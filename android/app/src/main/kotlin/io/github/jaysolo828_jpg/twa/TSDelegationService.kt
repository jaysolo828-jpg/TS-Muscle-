package io.github.jaysolo828_jpg.twa

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.browser.trusted.TrustedWebActivityService

// Extends TrustedWebActivityService directly (not DelegationService) because
// DelegationService in androidbrowserhelper 2.5.0 makes onNotifyNotificationWithChannel
// final, so subclasses cannot override it. TrustedWebActivityService exposes it as open.
//
// Purpose: strip the "app.thera..." origin subtext Chrome bakes into delegated
// web push notifications, so only "T&S Muscle" shows in the notification header.
class TSDelegationService : TrustedWebActivityService() {

    override fun onNotifyNotificationWithChannel(
        platformTag: String,
        platformId: Int,
        notification: Notification,
        channelName: String
    ): Boolean {
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "ts_muscle_workouts",
                "T&S Muscle Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            manager.createNotificationChannel(channel)
        }

        val rebuilt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Notification.Builder.recoverBuilder(this, notification)
                .setSubText(null)
                .setChannelId("ts_muscle_workouts")
                .build()
        } else {
            notification
        }

        manager.notify(platformTag, platformId, rebuilt)
        return true
    }
}
