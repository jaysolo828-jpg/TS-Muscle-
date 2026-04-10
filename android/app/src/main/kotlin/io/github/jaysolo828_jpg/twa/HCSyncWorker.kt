package io.github.jaysolo828_jpg.twa

import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.temporal.ChronoUnit

// Worker is only enqueued from HealthConnectSyncActivity (which is itself
// @RequiresApi O) and from MainActivity after a Build.VERSION.SDK_INT >= O
// guard, so this class is never instantiated on API < 26 devices.
@RequiresApi(Build.VERSION_CODES.O)
class HCSyncWorker(appContext: Context, workerParams: WorkerParameters) :
    CoroutineWorker(appContext, workerParams) {

    companion object {
        const val WORK_NAME = "ts_muscle_hc_sync"
    }

    private val CARDIO_TYPES = setOf(
        ExerciseSessionRecord.EXERCISE_TYPE_WALKING,
        ExerciseSessionRecord.EXERCISE_TYPE_HIKING,
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING,
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL,
    )
    private val MIN_SESSION_MINUTES = 10L

    override suspend fun doWork(): Result {
        val prefs        = applicationContext.getSharedPreferences("ts_muscle_prefs", Context.MODE_PRIVATE)
        val refreshToken = prefs.getString("sb_refresh_token", null) ?: return Result.success()
        val sbUrl        = prefs.getString("sb_url",           null) ?: return Result.success()
        val apiKey       = prefs.getString("sb_apikey",        null) ?: return Result.success()
        val userId       = prefs.getString("sb_user_id",       null) ?: return Result.success()

        val jwt = refreshJwt(sbUrl, apiKey, refreshToken, prefs) ?: return Result.retry()

        val status = HealthConnectClient.getSdkStatus(applicationContext, "com.google.android.apps.healthdata")
        if (status != HealthConnectClient.SDK_AVAILABLE) return Result.success()

        val client = HealthConnectClient.getOrCreate(applicationContext)
        val requiredPerms = setOf(
            HealthPermission.getReadPermission(ExerciseSessionRecord::class),
            HealthPermission.getReadPermission(DistanceRecord::class),
            HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
            HealthPermission.getReadPermission(StepsRecord::class),
        )
        if (!client.permissionController.getGrantedPermissions().containsAll(requiredPerms)) {
            return Result.success()
        }

        val now   = Instant.now()
        val start = now.minus(7, ChronoUnit.DAYS)

        return try {
            val sessions = client.readRecords(ReadRecordsRequest(
                recordType      = ExerciseSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start, now),
            )).records.filter { s ->
                s.exerciseType in CARDIO_TYPES &&
                ChronoUnit.MINUTES.between(s.startTime, s.endTime) >= MIN_SESSION_MINUTES
            }

            for (session in sessions) {
                val timeRange = TimeRangeFilter.between(session.startTime, session.endTime)

                val distMeters = try {
                    client.readRecords(ReadRecordsRequest(DistanceRecord::class, timeRange))
                        .records.sumOf { it.distance.inMeters }
                } catch (_: Exception) { 0.0 }

                val calories = try {
                    client.readRecords(ReadRecordsRequest(TotalCaloriesBurnedRecord::class, timeRange))
                        .records.sumOf { it.energy.inKilocalories }.toInt()
                } catch (_: Exception) { 0 }

                val steps = try {
                    client.readRecords(ReadRecordsRequest(StepsRecord::class, timeRange))
                        .records.sumOf { it.count }
                } catch (_: Exception) { 0L }

                val exerciseTypeStr = when (session.exerciseType) {
                    ExerciseSessionRecord.EXERCISE_TYPE_WALKING,
                    ExerciseSessionRecord.EXERCISE_TYPE_HIKING  -> "walk"
                    ExerciseSessionRecord.EXERCISE_TYPE_RUNNING -> "outdoor"
                    ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "treadmill"
                    else -> "walk"
                }

                val body = JSONObject().apply {
                    put("user_id",       userId)
                    put("logged_at",     session.endTime.toString())
                    put("minutes",       ChronoUnit.MINUTES.between(session.startTime, session.endTime).toInt())
                    put("hc_session_id", session.metadata.id)
                    put("exercise_type", exerciseTypeStr)
                    if (distMeters > 0) put("distance_meters", distMeters)
                    if (calories > 0)   put("calories",        calories)
                    if (steps > 0)      put("steps",           steps)
                }.toString()

                postToSupabase(sbUrl, jwt, apiKey, body)
            }

            prefs.edit().putLong("sb_last_sync_ms", System.currentTimeMillis()).apply()
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    private fun refreshJwt(
        sbUrl: String,
        apiKey: String,
        refreshToken: String,
        prefs: android.content.SharedPreferences,
    ): String? {
        return try {
            val url  = URL("$sbUrl/auth/v1/token?grant_type=refresh_token")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("apikey",       apiKey)
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput       = true
            conn.connectTimeout = 10_000
            conn.readTimeout    = 10_000
            conn.outputStream.use { it.write("""{"refresh_token":"$refreshToken"}""".toByteArray(Charsets.UTF_8)) }
            if (conn.responseCode != 200) return null
            val json = JSONObject(conn.inputStream.bufferedReader().readText())
            // Persist the rotated refresh token so subsequent runs stay authenticated.
            val newRefresh = json.optString("refresh_token")
            if (newRefresh.isNotEmpty()) {
                prefs.edit().putString("sb_refresh_token", newRefresh).apply()
            }
            json.optString("access_token").takeIf { it.isNotEmpty() }
        } catch (_: Exception) { null }
    }

    private fun postToSupabase(sbUrl: String, jwt: String, apiKey: String, jsonBody: String) {
        val url  = URL("$sbUrl/rest/v1/cyh_logs")
        val conn = url.openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.setRequestProperty("Authorization", "Bearer $jwt")
            conn.setRequestProperty("apikey",        apiKey)
            conn.setRequestProperty("Content-Type",  "application/json")
            conn.setRequestProperty("Prefer", "resolution=ignore-duplicates,return=minimal")
            conn.doOutput       = true
            conn.connectTimeout = 10_000
            conn.readTimeout    = 10_000
            conn.outputStream.use { it.write(jsonBody.toByteArray(Charsets.UTF_8)) }
            conn.responseCode
        } catch (_: Exception) {
        } finally {
            conn.disconnect()
        }
    }
}
