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

        // Tap opens the app
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://app.therapyandsneakers.org/"))
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val avatarUrl = message.data["avatar_url"]
        val largeIcon = try {
            if (!avatarUrl.isNullOrEmpty()) {
                val stream = java.net.URL(avatarUrl).openStream()
                BitmapFactory.decodeStream(stream)
            } else {
                BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
            }
        } catch (e: Exception) {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_icon)
            .setLargeIcon(largeIcon)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    override fun onNewToken(token: String) {
        // Token is saved to Supabase by the web app when it calls _saveFcmToken()
    }
}
