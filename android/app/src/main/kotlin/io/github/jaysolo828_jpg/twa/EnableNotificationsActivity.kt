package io.github.jaysolo828_jpg.twa

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Tiny bridge activity invoked by the web page via a custom-scheme
 * intent URL (ts-muscle-enable-notifs://prompt). Its sole job is to
 * call ActivityCompat.requestPermissions(POST_NOTIFICATIONS) so the
 * real Android OS permission dialog is shown — independent of Chrome's
 * cached per-origin permission state.
 *
 * Why this exists:
 *   Chrome's Notification.requestPermission() only shows the OS prompt
 *   when its internal delegation path fires, and that delegation is
 *   skipped when Chrome thinks the origin permission is already granted.
 *   When the Chrome origin permission is 'granted' but the Android
 *   POST_NOTIFICATIONS permission is denied (a real split state users
 *   can and do end up in), the web-side Notification.requestPermission()
 *   is a no-op and there is no web API to unstick it. This activity
 *   bypasses Chrome entirely and talks to the Android OS directly.
 *
 * After the user grants or denies, the activity finishes itself and the
 * TWA task resumes. Chrome will re-check POST_NOTIFICATIONS the next
 * time a notification is delivered or the next time the page calls
 * pushManager.subscribe(), so the OS decision propagates naturally.
 */
class EnableNotificationsActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Reject any invocation that doesn't carry our custom scheme.
        // Prevents external apps from triggering this activity via an
        // BROWSABLE intent with a different scheme or action.
        if (intent?.scheme != "ts-muscle-enable-notifs") { finish(); return }

        // On Android 12 and below, POST_NOTIFICATIONS does not exist as
        // a runtime permission — notifications are granted by default
        // until the user turns them off in system settings. Nothing to
        // request, just finish.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            finish()
            return
        }

        val alreadyGranted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED

        if (alreadyGranted) {
            finish()
            return
        }

        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            REQUEST_CODE
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        // Whatever the user chose, we're done. Finish so the TWA resumes.
        finish()
    }

    companion object {
        private const val REQUEST_CODE = 4242
    }
}
