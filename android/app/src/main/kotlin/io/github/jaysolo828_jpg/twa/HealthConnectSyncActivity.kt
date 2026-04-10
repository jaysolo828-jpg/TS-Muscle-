package io.github.jaysolo828_jpg.twa

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
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
                // User denied the permission — explain how to fix it.
                showDialog(
                    title   = "Permission needed",
                    message = "TS Muscle needs access to your exercise sessions in Health Connect. " +
                              "You can grant it in Health Connect \u2192 App permissions.",
                    positive        = "Open Health Connect",
                    positiveAction  = { openHealthConnectSettings() },
                    negative        = "Not now",
                    negativeAction  = { finish() }
                )
            }
        }

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
                positive = "Got it",
                positiveAction = { finish() }
            )
            return
        }

        val data = intent?.data ?: run { finish(); return }
        jwt          = data.getQueryParameter("jwt")          ?: run { finish(); return }
        userId       = data.getQueryParameter("user_id")      ?: run { finish(); return }
        challengeId  = data.getQueryParameter("challenge_id") ?: run { finish(); return }
        sbUrl        = data.getQueryParameter("sb_url")       ?: run { finish(); return }
        apiKey       = data.getQueryParameter("apikey")       ?: run { finish(); return }
        lookbackDays = data.getQueryParameter("days")?.toLongOrNull() ?: 7L

        val status = HealthConnectClient.getSdkStatus(this)
        when (status) {
            HealthConnectClient.SDK_AVAILABLE -> {
                // All good — proceed.
                client = HealthConnectClient.getOrCreate(this)
                checkPermissionsAndSync()
            }
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                // Health Connect app is not installed (Android 9–13 only).
                // Prompt to install it from the Play Store.
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
                // SDK_UNAVAILABLE — device doesn't support Health Connect at all
                // (pre-Android 9). Finish silently; no point prompting.
                finish()
            }
        }
    }

    private fun checkPermissionsAndSync() {
        scope.launch {
            val granted  = client.permissionController.getGrantedPermissions()
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
                val response  = client.readRecords(request)
                val qualifying = response.records.filter { session ->
                    session.exerciseType in CARDIO_TYPES &&
                    ChronoUnit.MINUTES.between(session.startTime, session.endTime) >= MIN_SESSION_MINUTES
                }

                if (qualifying.isEmpty()) {
                    // Nothing found — could be no connected apps, or just no
                    // qualifying sessions this week. Tell the user either way.
                    withContext(Dispatchers.Main) {
                        showDialog(
                            title   = "No sessions found",
                            message = "No walking or running sessions (10+ minutes) were found " +
                                      "in Health Connect for the past $lookbackDays days.\n\n" +
                                      "Make sure a fitness app like Google Fit, Strava, or " +
                                      "Samsung Health is connected to Health Connect and has " +
                                      "recorded your sessions.",
                            positive        = "Open Health Connect",
                            positiveAction  = { openHealthConnectSettings(); finish() },
                            negative        = "OK",
                            negativeAction  = { finish() }
                        )
                    }
                    return@withContext
                }

                for (session in qualifying) {
                    val minutes  = ChronoUnit.MINUTES.between(session.startTime, session.endTime).toInt()
                    val hcId     = session.metadata.id
                    val loggedAt = session.endTime.toString()

                    val body = JSONObject().apply {
                        put("challenge_id",  challengeId)
                        put("user_id",       userId)
                        put("logged_at",     loggedAt)
                        put("minutes",       minutes)
                        put("hc_session_id", hcId)
                    }.toString()

                    postToSupabase(body)
                }
            } catch (_: Exception) {
                // Network/HC read error — finish silently. The user can retry.
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

    // Opens the Health Connect main settings screen where users can see
    // connected apps and manage permissions.
    private fun openHealthConnectSettings() {
        try {
            startActivity(Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS))
        } catch (_: Exception) {
            // Fallback: open the HC Play Store listing if settings can't launch.
            startActivity(Intent(Intent.ACTION_VIEW,
                Uri.parse("market://details?id=com.google.android.apps.healthdata")))
        }
    }

    // Convenience wrapper so every dialog has the same structure.
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
