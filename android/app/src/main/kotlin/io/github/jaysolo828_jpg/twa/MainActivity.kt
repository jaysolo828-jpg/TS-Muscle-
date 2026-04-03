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

class MainActivity : LauncherActivity() {

    companion object {
        private const val PREFS  = "ts_muscle_prefs"
        private const val FCM_KEY = "fcm_token"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestNotificationPermissionIfNeeded()
        // Refresh the FCM token and cache it; will be used on the next launch via getLaunchingUrl()
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(FCM_KEY, token).apply()
        }
    }

    // Append the cached FCM token as a URL param so the web app can save it to Supabase.
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
