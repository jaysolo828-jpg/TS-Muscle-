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
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class MainActivity : LauncherActivity() {

    companion object {
        private const val PREFS                = "ts_muscle_prefs"
        private const val FCM_KEY              = "fcm_token"
        private const val FCM_FETCH_TIMEOUT_MS = 1500L
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val prefs        = getSharedPreferences(PREFS, MODE_PRIVATE)
        val cachedToken  = prefs.getString(FCM_KEY, null)

        if (cachedToken.isNullOrEmpty()) {
            // FIRST LAUNCH AFTER INSTALL ONLY: we don't yet have a token in
            // SharedPreferences, so getLaunchingUrl() would launch without
            // ?fcm_token=... and the page would never register the native
            // token with Supabase. Block briefly (with a short timeout) to
            // fetch it synchronously. The completion listener runs on a
            // background executor to avoid deadlocking the main thread.
            try {
                val latch = CountDownLatch(1)
                val bgExecutor = Executors.newSingleThreadExecutor()
                FirebaseMessaging.getInstance().token
                    .addOnCompleteListener(bgExecutor) { task ->
                        try {
                            if (task.isSuccessful) {
                                val token = task.result
                                if (!token.isNullOrEmpty()) {
                                    prefs.edit().putString(FCM_KEY, token).apply()
                                }
                            }
                        } finally {
                            latch.countDown()
                        }
                    }
                latch.await(FCM_FETCH_TIMEOUT_MS, TimeUnit.MILLISECONDS)
                bgExecutor.shutdown()
            } catch (_: Exception) {
                // Ignore — onNewToken will catch up on a later launch.
            }
        } else {
            // SUBSEQUENT LAUNCHES: we already have a cached token — use it
            // immediately and refresh asynchronously so next launch has the
            // latest. Do NOT block the main thread here.
            FirebaseMessaging.getInstance().token
                .addOnSuccessListener { token ->
                    if (!token.isNullOrEmpty() && token != cachedToken) {
                        prefs.edit().putString(FCM_KEY, token).apply()
                    }
                }
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
