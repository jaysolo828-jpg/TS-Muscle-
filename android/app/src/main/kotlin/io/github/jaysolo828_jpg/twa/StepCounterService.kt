package io.github.jaysolo828_jpg.twa

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.ServerSocket
import java.net.Socket

// Foreground service that reads the phone's hardware step counter (TYPE_STEP_COUNTER)
// and exposes session step count over a local HTTP server on port 8765. The web page
// polls http://localhost:8765/steps every second to update the live display.
//
// Lifecycle:
//   - Started by StepPermissionActivity after ACTIVITY_RECOGNITION is granted.
//   - ACTION_RESET resets the session counter (called each time a new workout starts).
//   - ACTION_PAUSE / ACTION_RESUME freeze/unfreeze step accumulation and update the
//     notification action button. The web page syncs its pause state from the JSON response.
//   - Stopped when the web page POSTs to /stop (FINISH button), or via ACTION_STOP.
//
// The HTTP server adds Access-Control-Allow-Origin: * so Chrome's fetch() can reach
// it from the https://app.therapyandsneakers.org origin without CORS errors.
// Chrome always allows HTTP connections to localhost from HTTPS pages (localhost is
// a "secure context" exemption — no network_security_config change needed).
class StepCounterService : Service(), SensorEventListener {

    private var sensorManager: SensorManager? = null
    private var initialSteps = -1L
    private var sessionSteps = 0L
    private var frozenSteps  = 0L
    @Volatile private var isPaused = false
    private var hasSensor = false
    private var serverSocket: ServerSocket? = null
    private var serverThread: Thread? = null
    private var lastNotifMs = 0L

    companion object {
        const val CHANNEL_ID    = "ts_step_counter"
        const val NOTIF_ID      = 9001
        const val PORT          = 8765
        const val ACTION_RESET  = "io.github.jaysolo828_jpg.twa.STEP_RESET"
        const val ACTION_STOP   = "io.github.jaysolo828_jpg.twa.STEP_STOP"
        const val ACTION_PAUSE  = "io.github.jaysolo828_jpg.twa.STEP_PAUSE"
        const val ACTION_RESUME = "io.github.jaysolo828_jpg.twa.STEP_RESUME"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        // Android 14+ requires the foreground service type to be passed here.
        // FOREGROUND_SERVICE_TYPE_HEALTH = 256, added in API 34.
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIF_ID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH)
        } else {
            startForeground(NOTIF_ID, buildNotification())
        }

        val sm = getSystemService(SENSOR_SERVICE) as SensorManager
        sensorManager = sm
        val sensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        hasSensor = sensor != null
        if (sensor != null) {
            sm.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
        }

        startHttpServer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_RESET -> {
                // New workout started — reset the session counter and unpause.
                initialSteps = -1L
                sessionSteps = 0L
                frozenSteps  = 0L
                isPaused     = false
                updateNotification()
            }
            ACTION_PAUSE -> {
                frozenSteps = sessionSteps
                isPaused    = true
                updateNotification()
            }
            ACTION_RESUME -> {
                isPaused = false
                updateNotification()
            }
            ACTION_STOP -> stopSelf()
        }
        return START_STICKY
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
        val raw = event.values[0].toLong()
        if (initialSteps < 0) initialSteps = raw
        if (isPaused) {
            // Keep resetting the baseline so sessionSteps stays frozen at frozenSteps.
            initialSteps = raw - frozenSteps
        } else {
            sessionSteps = raw - initialSteps
        }
        // Throttle notification updates to at most every 10 seconds.
        val now = System.currentTimeMillis()
        if (now - lastNotifMs > 10_000) {
            lastNotifMs = now
            updateNotification()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun startHttpServer() {
        serverThread = Thread {
            try {
                val ss = ServerSocket(PORT).also { serverSocket = it }
                while (!Thread.currentThread().isInterrupted) {
                    val client: Socket = try { ss.accept() } catch (_: Exception) { break }
                    Thread { handleClient(client) }.apply { isDaemon = true }.start()
                }
            } catch (_: Exception) {}
        }.apply { isDaemon = true; start() }
    }

    private fun handleClient(client: Socket) {
        try {
            val reader = BufferedReader(InputStreamReader(client.getInputStream()))
            val requestLine = reader.readLine() ?: return

            val isStop      = requestLine.startsWith("POST /stop")
            val isPreflight = requestLine.startsWith("OPTIONS")

            val body = when {
                isPreflight -> ""
                isStop      -> "{\"stopped\":true}"
                else        -> "{\"steps\":$sessionSteps,\"has_sensor\":$hasSensor,\"paused\":$isPaused}"
            }

            val response = buildString {
                append("HTTP/1.1 200 OK\r\n")
                append("Content-Type: application/json\r\n")
                append("Access-Control-Allow-Origin: *\r\n")
                append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n")
                append("Access-Control-Allow-Headers: Content-Type\r\n")
                append("Content-Length: ${body.length}\r\n")
                append("Connection: close\r\n")
                append("\r\n")
                append(body)
            }
            client.getOutputStream().write(response.toByteArray(Charsets.UTF_8))
            client.getOutputStream().flush()

            if (isStop) stopSelf()
        } catch (_: Exception) {
        } finally {
            try { client.close() } catch (_: Exception) {}
        }
    }

    private fun updateNotification() {
        lastNotifMs = System.currentTimeMillis()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
            .notify(NOTIF_ID, buildNotification())
    }

    private fun buildNotification(): Notification {
        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)
        val flags = PendingIntent.FLAG_IMMUTABLE
        val pi = PendingIntent.getActivity(this, 0, tapIntent, flags)
        val stepText = if (hasSensor) "$sessionSteps steps" else "Timer running"
        val contentText = if (isPaused) "Paused — $stepText" else stepText

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        return builder
            .setSmallIcon(R.drawable.ic_ts_notification)
            .setContentTitle("Workout in progress")
            .setContentText(contentText)
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            val chan = NotificationChannel(CHANNEL_ID, "Step Counter", NotificationManager.IMPORTANCE_LOW)
            chan.setShowBadge(false)
            nm.createNotificationChannel(chan)
        }
    }

    override fun onDestroy() {
        sensorManager?.unregisterListener(this)
        try { serverSocket?.close() } catch (_: Exception) {}
        serverThread?.interrupt()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
