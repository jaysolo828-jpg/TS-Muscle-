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
        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)

        // Synchronously fetch the FCM token (with a short timeout) BEFORE
        // super.onCreate() so that getLaunchingUrl() — which is called
        // from inside super.onCreate() — has the token to append to the
        // launching URL on the very first launch after install.
        //
        // Without this, on a fresh install SharedPreferences is empty,
        // the URL launches without ?fcm_token=..., the page never sees
        // the native token, never registers it with Supabase, and every
        // notification falls back to web push (rendered by Chrome with
        // the source URL on the card). That is the bug we're fixing.
        try {
            val latch = CountDownLatch(1)
            // Run the completion listener on a background executor so it
            // does not deadlock against the main thread we're blocking.
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
            // Ignore — fall through with whatever (if anything) is cached.
            // onNewToken will catch up the next time the token rotates.
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
