package io.github.jaysolo828_jpg.twa

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

// Tiny bridge activity launched by the web page via:
//   intent://start#Intent;scheme=ts-muscle-step-start;package=io.github.jaysolo828_jpg.twa;end
//
// On Android 10+, TYPE_STEP_COUNTER requires ACTIVITY_RECOGNITION at runtime.
// This activity requests it (showing the OS dialog if needed), then starts
// StepCounterService with ACTION_RESET so the session counter begins fresh.
// It finishes immediately — the Chrome tab resumes in the foreground.
//
// If the user denies the permission, the service is not started. The web page's
// polling loop gets "connection refused" on localhost:8765 and the catch block
// silently ignores it — the timer still runs, steps just aren't shown.
class StepPermissionActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Reject any invocation that doesn't carry our custom scheme.
        if (intent?.scheme != "ts-muscle-step-start") { finish(); return }

        // ACTIVITY_RECOGNITION is only a runtime permission on Android 10 (API 29)+.
        // On older versions the hardware sensor is accessible without it.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            startStepService()
            finish()
            return
        }

        val granted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED

        if (granted) {
            startStepService()
            finish()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.ACTIVITY_RECOGNITION),
                REQUEST_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE &&
            grantResults.isNotEmpty() &&
            grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startStepService()
        }
        finish()
    }

    private fun startStepService() {
        val intent = Intent(this, StepCounterService::class.java).apply {
            action = StepCounterService.ACTION_RESET
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    companion object {
        private const val REQUEST_CODE = 5050
    }
}
