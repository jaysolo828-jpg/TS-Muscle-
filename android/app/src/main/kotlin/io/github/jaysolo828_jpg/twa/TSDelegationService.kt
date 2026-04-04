package io.github.jaysolo828_jpg.twa

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.google.androidbrowserhelper.trusted.DelegationService

// Custom DelegationService that strips the "app.thera..." origin URL Chrome bakes
// into delegated web push notifications. Extends DelegationService (not
// TrustedWebActivityService directly) so getTokenStore() is handled by the library.
//
// NOTE: parameters must be non-nullable (String not String?) to match the Java
// @NonNull signature — nullable caused "overrides nothing" compile errors.
class TSDelegationService : DelegationService() {

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
