package io.github.jaysolo828_jpg.twa

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

// ── How the notification card is built ────────────────────────────────────────
//
// LEFT SIDE (small icon): ic_launcher (mipmap) — the sneaker logo.
//
// RIGHT SIDE (large icon): sender's avatar fetched from avatar_url in FCM data.
//   - Falls back to ic_launcher (the full-color T&S app icon) if no avatar.
//
// WHY DATA-ONLY FCM (no notification block in the payload):
//   - If the FCM message includes a "notification" block, Android handles it
//     automatically in the background and never calls onMessageReceived.
//   - That means setSmallIcon and setLargeIcon never run — no logo, no avatar.
//   - Data-only messages always call onMessageReceived regardless of app state,
//     so our code here always controls exactly how the notification looks.
//
// ─────────────────────────────────────────────────────────────────────────────

class TSFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val CHANNEL_ID = "ts_muscle_workouts"
        private const val CHANNEL_NAME = "Workout Alerts"
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.data["title"] ?: message.notification?.title ?: "T&S Muscle"
        val body  = message.data["body"]  ?: message.notification?.body  ?: ""

        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        // Create channel on Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            )
            manager.createNotificationChannel(channel)
        }

        // Tap opens the app, deep-linking to the reactions sheet for this
        // workout signal. The web page reads ?open_friend= and ?signal_id=
        // on launch and opens _openFriendActivity for that signal.
        val toUserId = message.data["to_user_id"]
        val signalId = message.data["signal_id"]
        val notificationId = System.currentTimeMillis().toInt()
        val tapUri = Uri.parse("https://app.therapyandsneakers.org/")
            .buildUpon()
            .apply {
                if (!toUserId.isNullOrEmpty()) appendQueryParameter("open_friend", toUserId)
                if (!signalId.isNullOrEmpty()) appendQueryParameter("signal_id", signalId)
            }
            .build()
        val intent = Intent(Intent.ACTION_VIEW, tapUri)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pendingIntent = PendingIntent.getActivity(
            this, notificationId, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        // Right side of notification card: sender's profile picture, or app logo as fallback.
        // URL is validated to HTTPS and known storage domains before fetching.
        val avatarUrl = message.data["avatar_url"]
        val largeIcon = try {
            val parsed = if (!avatarUrl.isNullOrEmpty()) Uri.parse(avatarUrl) else null
            val allowed = setOf(
                "lbdnmghpevnqpkldcqfi.supabase.co",
                "app.therapyandsneakers.org"
            )
            if (parsed != null && parsed.scheme == "https" && allowed.contains(parsed.host)) {
                val conn = java.net.URL(avatarUrl).openConnection() as java.net.HttpURLConnection
                conn.connectTimeout = 3000
                conn.readTimeout = 3000
                conn.inputStream.use { BitmapFactory.decodeStream(it) }
            } else {
                BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
            }
        } catch (e: Exception) {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_ts_notification)   // left side — sneaker logo
            .setLargeIcon(largeIcon)                       // right side — sender avatar or app logo
            .setColor(0xFF000000.toInt())                  // black tint matches logo's circular background
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(notificationId, notification)
    }

    override fun onNewToken(token: String) {
        // Always persist the latest token so MainActivity can append it to the launch URL.
        // This also fires when a token is refreshed, keeping SharedPreferences current
        // even if the initial fetch in MainActivity timed out.
        getSharedPreferences("ts_muscle_prefs", MODE_PRIVATE)
            .edit().putString("fcm_token", token).apply()
    }
}
