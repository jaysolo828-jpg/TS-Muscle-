package io.github.jaysolo828_jpg.twa

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.androidbrowserhelper.trusted.LauncherActivity
import com.google.firebase.messaging.FirebaseMessaging
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class MainActivity : LauncherActivity() {

    companion object {
        private const val PREFS   = "ts_muscle_prefs"
        private const val FCM_KEY = "fcm_token"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)

        if (!prefs.contains(FCM_KEY)) {
            // Run the Firebase token fetch on a background thread to avoid
            // blocking the main thread (which would deadlock the completion listener).
            val latch = CountDownLatch(1)
            Thread {
                FirebaseMessaging.getInstance().token
                    .addOnCompleteListener { task ->
                        if (task.isSuccessful) {
                            task.result?.let { prefs.edit().putString(FCM_KEY, it).apply() }
                        }
                        latch.countDown()
                    }
                latch.await(5, TimeUnit.SECONDS)
            }.apply { isDaemon = true; start() }.join(6000)
        }

        super.onCreate(savedInstanceState)
        requestNotificationPermissionIfNeeded()
    }

    override fun getLaunchingUrl(): Uri {
        val base  = super.getLaunchingUrl()
        val token = getSharedPreferences(PREFS, MODE_PRIVATE).getString(FCM_KEY, null)
            ?: return base
        return base.buildUpon().appendQueryParameter("fcm_token", token).build()
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this, Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    1001
                )
            }
        }
    }
}
