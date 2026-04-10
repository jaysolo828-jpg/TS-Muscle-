package io.github.jaysolo828_jpg.twa

import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.temporal.ChronoUnit

class HealthConnectSyncActivity : Activity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // Walking, hiking, running, treadmill running
    private val CARDIO_TYPES = setOf(
        ExerciseSessionRecord.EXERCISE_TYPE_WALKING,
        ExerciseSessionRecord.EXERCISE_TYPE_HIKING,
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING,
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL,
    )

    private val MIN_SESSION_MINUTES = 10L

    private var jwt = ""
    private var userId = ""
    private var challengeId = ""
    private var sbUrl = ""
    private var apiKey = ""
    private var lookbackDays = 7L

    private lateinit var client: HealthConnectClient

    private val requestPermissions =
        registerForActivityResult(PermissionController.createRequestPermissionResultContract()) { granted ->
            if (HealthPermission.getReadPermission(ExerciseSessionRecord::class) in granted) {
                scope.launch { doSync() }
            } else {
                finish()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Handle the Play Store rationale intent — show a brief explanation
        // of what data the app reads from Health Connect and why.
        if (intent?.action == "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE") {
            AlertDialog.Builder(this)
                .setTitle("Health Connect")
                .setMessage(
                    "TS Muscle reads your walking and running sessions from Health Connect " +
                    "to automatically track your progress in group movement challenges. " +
                    "Only sessions of 10 minutes or more are counted."
                )
                .setPositiveButton("OK") { _, _ -> finish() }
                .setOnDismissListener { finish() }
                .show()
            return
        }

        val data = intent?.data ?: run { finish(); return }
        jwt         = data.getQueryParameter("jwt")          ?: run { finish(); return }
        userId      = data.getQueryParameter("user_id")      ?: run { finish(); return }
        challengeId = data.getQueryParameter("challenge_id") ?: run { finish(); return }
        sbUrl       = data.getQueryParameter("sb_url")       ?: run { finish(); return }
        apiKey      = data.getQueryParameter("apikey")       ?: run { finish(); return }
        lookbackDays = data.getQueryParameter("days")?.toLongOrNull() ?: 7L

        // Health Connect is only available on Android 9+ via the standalone
        // Play Store app, or built-in on Android 14+. Silently finish on
        // older devices or devices without the HC app installed.
        val status = HealthConnectClient.getSdkStatus(this)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            finish()
            return
        }

        client = HealthConnectClient.getOrCreate(this)

        scope.launch {
            val granted = client.permissionController.getGrantedPermissions()
            val readPerm = HealthPermission.getReadPermission(ExerciseSessionRecord::class)
            if (readPerm in granted) {
                doSync()
            } else {
                requestPermissions.launch(setOf(readPerm))
            }
        }
    }

    private suspend fun doSync() {
        withContext(Dispatchers.IO) {
            try {
                val now   = Instant.now()
                val start = now.minus(lookbackDays, ChronoUnit.DAYS)

                val request = ReadRecordsRequest(
                    recordType      = ExerciseSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(start, now),
                )
                val response = client.readRecords(request)

                val qualifying = response.records.filter { session ->
                    session.exerciseType in CARDIO_TYPES &&
                    ChronoUnit.MINUTES.between(session.startTime, session.endTime) >= MIN_SESSION_MINUTES
                }

                for (session in qualifying) {
                    val minutes  = ChronoUnit.MINUTES.between(session.startTime, session.endTime).toInt()
                    val hcId     = session.metadata.id
                    val loggedAt = session.endTime.toString()

                    val body = JSONObject().apply {
                        put("challenge_id",   challengeId)
                        put("user_id",        userId)
                        put("logged_at",      loggedAt)
                        put("minutes",        minutes)
                        put("hc_session_id",  hcId)
                    }.toString()

                    postToSupabase(body)
                }
            } catch (_: Exception) {
                // Silently absorb — network errors, HC read errors, etc.
                // The user will see no new sessions synced; they can retry.
            } finally {
                withContext(Dispatchers.Main) { finish() }
            }
        }
    }

    private fun postToSupabase(jsonBody: String) {
        val url  = URL("$sbUrl/rest/v1/cyh_logs")
        val conn = url.openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.setRequestProperty("Authorization",  "Bearer $jwt")
            conn.setRequestProperty("apikey",         apiKey)
            conn.setRequestProperty("Content-Type",   "application/json")
            // ignore-duplicates: if hc_session_id already exists for this
            // challenge, skip silently instead of erroring.
            conn.setRequestProperty("Prefer", "resolution=ignore-duplicates,return=minimal")
            conn.doOutput       = true
            conn.connectTimeout = 10_000
            conn.readTimeout    = 10_000
            conn.outputStream.use { it.write(jsonBody.toByteArray(Charsets.UTF_8)) }
            conn.responseCode   // triggers the request
        } catch (_: Exception) {
        } finally {
            conn.disconnect()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}
