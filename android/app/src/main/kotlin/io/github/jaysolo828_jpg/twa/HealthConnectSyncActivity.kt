package io.github.jaysolo828_jpg.twa

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
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
import java.util.concurrent.TimeUnit

// java.time APIs (Instant, ChronoUnit) require API 26+. Health Connect itself
// only returns SDK_AVAILABLE on API 26+ devices, so doSync() is never reached
// on older devices. The @RequiresApi annotation satisfies the compiler without
// needing core library desugaring.
@RequiresApi(Build.VERSION_CODES.O)
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
    private val HC_PERM_REQUEST_CODE = 1001

    private var jwt          = ""
    private var userId       = ""
    private var challengeId  = ""
    private var sbUrl        = ""
    private var apiKey       = ""
    private var lookbackDays = 7L
    private var refreshToken = ""

    private lateinit var client: HealthConnectClient

    // All four permissions needed for rich data (exercise sessions + distance +
    // calories + steps). Declared as a set so permission checks and requests
    // are always consistent.
    private val requiredPerms = setOf(
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
    )

    // The permission contract lets us build the intent and parse the result
    // using the old startActivityForResult pattern, which works on plain
    // android.app.Activity (registerForActivityResult requires ComponentActivity).
    private val permContract = PermissionController.createRequestPermissionResultContract()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Play Store requirement: handle the rationale intent from the
        // Health Connect permissions screen.
        if (intent?.action == "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE") {
            showDialog(
                title   = "Why TS Muscle uses Health Connect",
                message = "TS Muscle reads your walking and running sessions from Health Connect " +
                          "to automatically track progress in group movement challenges. " +
                          "Only sessions of 10 minutes or more are counted. " +
                          "No data is shared with third parties.",
                positive       = "Got it",
                positiveAction = { finish() }
            )
            return
        }

        val data = intent?.data ?: run { finish(); return }
        jwt          = data.getQueryParameter("jwt")           ?: run { finish(); return }
        userId       = data.getQueryParameter("user_id")       ?: run { finish(); return }
        challengeId  = data.getQueryParameter("challenge_id")  ?: ""
        sbUrl        = data.getQueryParameter("sb_url")        ?: run { finish(); return }
        apiKey       = data.getQueryParameter("apikey")        ?: run { finish(); return }
        lookbackDays = data.getQueryParameter("days")?.toLongOrNull() ?: 7L
        refreshToken = data.getQueryParameter("refresh_token") ?: ""

        // Persist session credentials for the background WorkManager sync so
        // it can refresh the JWT without launching a browser activity.
        if (refreshToken.isNotEmpty()) {
            getSharedPreferences("ts_muscle_prefs", MODE_PRIVATE).edit()
                .putString("sb_user_id",       userId)
                .putString("sb_refresh_token", refreshToken)
                .putString("sb_url",           sbUrl)
                .putString("sb_apikey",        apiKey)
                .apply()
        }

        val status = HealthConnectClient.getSdkStatus(this, "com.google.android.apps.healthdata")
        when (status) {
            HealthConnectClient.SDK_AVAILABLE -> {
                client = HealthConnectClient.getOrCreate(this)
                checkPermissionsAndSync()
            }
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                // Health Connect app not installed (Android 9–13).
                showDialog(
                    title   = "Health Connect required",
                    message = "This feature uses Health Connect to read your walking and running " +
                              "sessions. Install the free Health Connect app from the Play Store " +
                              "to get started.",
                    positive        = "Install Health Connect",
                    positiveAction  = {
                        startActivity(Intent(Intent.ACTION_VIEW,
                            Uri.parse("market://details?id=com.google.android.apps.healthdata")))
                        finish()
                    },
                    negative       = "Not now",
                    negativeAction = { finish() }
                )
            }
            else -> {
                // SDK_UNAVAILABLE — pre-Android 9, finish silently.
                finish()
            }
        }
    }

    private fun checkPermissionsAndSync() {
        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (granted.containsAll(requiredPerms)) {
                    scheduleBackgroundSync()
                    doSync()
                } else {
                    // Launch the Health Connect permission UI via startActivityForResult
                    // so we can handle the result in onActivityResult without needing
                    // ComponentActivity / registerForActivityResult.
                    val permIntent = permContract.createIntent(this@HealthConnectSyncActivity, requiredPerms)
                    @Suppress("DEPRECATION")
                    startActivityForResult(permIntent, HC_PERM_REQUEST_CODE)
                }
            } catch (_: Exception) {
                withContext(Dispatchers.Main) { finish() }
            }
        }
    }

    @Suppress("DEPRECATION")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == HC_PERM_REQUEST_CODE) {
            val granted = permContract.parseResult(resultCode, data)
            if (granted.containsAll(requiredPerms)) {
                scheduleBackgroundSync()
                scope.launch {
                    try { doSync() } catch (_: Exception) { finish() }
                }
            } else {
                showDialog(
                    title   = "Permission needed",
                    message = "TS Muscle needs access to your exercise sessions in Health Connect. " +
                              "You can grant it in Health Connect \u2192 App permissions.",
                    positive       = "Open Health Connect",
                    positiveAction = { openHealthConnectSettings() },
                    negative       = "Not now",
                    negativeAction = { finish() }
                )
            }
        }
    }

    // Enqueue a recurring background sync every 6 hours. KEEP policy means
    // repeated calls are no-ops — safe to call on every manual sync.
    private fun scheduleBackgroundSync() {
        val request = PeriodicWorkRequestBuilder<HCSyncWorker>(6, TimeUnit.HOURS).build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            HCSyncWorker.WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            request
        )
    }

    private suspend fun doSync() {
        withContext(Dispatchers.IO) {
            try {
                val now   = Instant.now()
                val start = now.minus(lookbackDays, ChronoUnit.DAYS)

                val response = client.readRecords(ReadRecordsRequest(
                    recordType      = ExerciseSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(start, now),
                ))
                val qualifying = response.records.filter { session ->
                    session.exerciseType in CARDIO_TYPES &&
                    ChronoUnit.MINUTES.between(session.startTime, session.endTime) >= MIN_SESSION_MINUTES
                }

                if (qualifying.isEmpty()) {
                    withContext(Dispatchers.Main) {
                        showDialog(
                            title   = "No sessions found",
                            message = "No walking or running sessions (10+ minutes) were found " +
                                      "in Health Connect for the past $lookbackDays days.\n\n" +
                                      "Make sure a fitness app like Google Fit, Strava, or " +
                                      "Samsung Health is connected to Health Connect and has " +
                                      "recorded your sessions.",
                            positive       = "Open Health Connect",
                            positiveAction = { openHealthConnectSettings(); finish() },
                            negative       = "OK",
                            negativeAction = { finish() }
                        )
                    }
                    return@withContext
                }

                for (session in qualifying) {
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

                    val minutes  = ChronoUnit.MINUTES.between(session.startTime, session.endTime).toInt()
                    val hcId     = session.metadata.id
                    val loggedAt = session.endTime.toString()

                    val body = JSONObject().apply {
                        if (challengeId.isNotEmpty()) put("challenge_id", challengeId)
                        put("user_id",       userId)
                        put("logged_at",     loggedAt)
                        put("minutes",       minutes)
                        put("hc_session_id", hcId)
                        put("exercise_type", exerciseTypeStr)
                        if (distMeters > 0) put("distance_meters", distMeters)
                        if (calories > 0)   put("calories",        calories)
                        if (steps > 0)      put("steps",           steps)
                    }.toString()

                    postToSupabase(body)
                }
            } catch (_: Exception) {
                // Network/HC read error — finish silently, user can retry.
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

    private fun openHealthConnectSettings() {
        try {
            startActivity(Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS))
        } catch (_: Exception) {
            startActivity(Intent(Intent.ACTION_VIEW,
                Uri.parse("market://details?id=com.google.android.apps.healthdata")))
        }
    }

    private fun showDialog(
        title: String,
        message: String,
        positive: String,
        positiveAction: () -> Unit,
        negative: String? = null,
        negativeAction: (() -> Unit)? = null,
    ) {
        val builder = AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton(positive) { _, _ -> positiveAction() }
            .setOnDismissListener { finish() }
        if (negative != null && negativeAction != null) {
            builder.setNegativeButton(negative) { _, _ -> negativeAction() }
        }
        builder.show()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}
