package io.github.jaysolo828_jpg.twa

import android.content.ComponentName
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryPurchasesParams
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
        private const val SUB_ACTIVE_KEY       = "sub_active"
        private const val SUB_SKU_KEY          = "sub_sku"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Warm up Chrome's Custom Tabs service as early as possible so DAL
        // verification gets maximum lead time before the TWA shell paints.
        // On device wakeup the network comes up slowly; this head start
        // prevents the race that shows the "disconnected from Play Store" banner.
        try {
            CustomTabsClient.bindCustomTabsService(
                this, "com.android.chrome",
                object : CustomTabsServiceConnection() {
                    override fun onCustomTabsServiceConnected(
                        name: ComponentName, client: CustomTabsClient
                    ) {
                        try {
                            client.warmup(0L)
                            client.newSession(null)?.mayLaunchUrl(super@MainActivity.getLaunchingUrl(), null, null)
                        } catch (_: Exception) {}
                    }
                    override fun onServiceDisconnected(name: ComponentName) {}
                }
            )
        } catch (_: Exception) {}

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

        // If the user has previously granted Health Connect permissions (indicated
        // by a stored refresh token), keep the background sync job alive across
        // app updates and device reboots. The KEEP policy is a no-op when the
        // job is already enqueued, so this is safe to call on every launch.
        // Guard is required because HCSyncWorker uses java.time (API 26+).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val refreshToken = prefs.getString("sb_refresh_token", null)
            if (!refreshToken.isNullOrEmpty()) {
                @Suppress("NewApi")
                val request = PeriodicWorkRequestBuilder<HCSyncWorker>(6, TimeUnit.HOURS).build()
                WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                    HCSyncWorker.WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    request
                )
            }
        }

        // NOTE: We intentionally do NOT call ActivityCompat.requestPermissions
        // for POST_NOTIFICATIONS here. LauncherActivity.super.onCreate() launches
        // the Chrome Custom Tab and finishes this activity synchronously, so any
        // permission dialog requested from this point would fire on a finishing
        // activity and either never display or be dismissed by the Custom Tab
        // taking focus — exactly the bug that left users stuck in a "denied"
        // state without ever seeing a prompt.
        //
        // The correct TWA architecture is: the web page calls
        // Notification.requestPermission() when the user taps our "Enable
        // Notifications" button. Chrome, recognising this as a verified TWA
        // (via assetlinks.json), delegates to NotificationPermissionRequestActivity
        // (already declared in AndroidManifest.xml), which requests
        // POST_NOTIFICATIONS at the right moment in the lifecycle.
        // Fire-and-forget acknowledgement of any unacked subscription purchase.
        // SubscribeActivity acks once at purchase time, but if that single
        // attempt failed (network blip / BillingClient disconnect) the sub is
        // silently rotting and Play auto-cancels within 72 hours. Querying +
        // acking on every launch closes the recovery gap. Runs entirely async
        // off the BillingClient connection callbacks — does NOT block onCreate.
        acknowledgeUnackedPurchases()

        super.onCreate(savedInstanceState)
    }

    private fun acknowledgeUnackedPurchases() {
        try {
            // Use applicationContext so the client + listener outlive the
            // LauncherActivity (which finishes synchronously once the Custom
            // Tab launches). PaymentDelegationService keeps the process alive
            // long enough for the async ack callbacks to fire.
            val client = BillingClient.newBuilder(applicationContext)
                .setListener(object : PurchasesUpdatedListener {
                    override fun onPurchasesUpdated(r: BillingResult, p: MutableList<Purchase>?) {}
                })
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
                )
                .build()

            client.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(result: BillingResult) {
                    if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                        try { client.endConnection() } catch (_: Exception) {}
                        return
                    }
                    val params = QueryPurchasesParams.newBuilder()
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                    client.queryPurchasesAsync(params) { _, purchases ->
                        // Cache active subscription state to SharedPreferences
                        // so getLaunchingUrl() can pass the truth to the web
                        // page on the NEXT launch. This bypasses Chrome's
                        // DigitalGoodsService entirely — which has been
                        // observed returning empty even for active subs and
                        // is the reason the trial banner stays stuck.
                        val activeSub = purchases.firstOrNull {
                            it.purchaseState == Purchase.PurchaseState.PURCHASED
                        }
                        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
                        if (activeSub != null) {
                            val sku = activeSub.products.firstOrNull() ?: ""
                            prefs.edit()
                                .putString(SUB_ACTIVE_KEY, "1")
                                .putString(SUB_SKU_KEY, sku)
                                .apply()
                        } else {
                            prefs.edit()
                                .remove(SUB_ACTIVE_KEY)
                                .remove(SUB_SKU_KEY)
                                .apply()
                        }

                        var pending = purchases.count {
                            it.purchaseState == Purchase.PurchaseState.PURCHASED && !it.isAcknowledged
                        }
                        if (pending == 0) {
                            try { client.endConnection() } catch (_: Exception) {}
                            return@queryPurchasesAsync
                        }
                        for (purchase in purchases) {
                            if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) continue
                            if (purchase.isAcknowledged) continue
                            val ack = AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.purchaseToken)
                                .build()
                            client.acknowledgePurchase(ack) {
                                pending -= 1
                                if (pending <= 0) {
                                    try { client.endConnection() } catch (_: Exception) {}
                                }
                            }
                        }
                    }
                }
                override fun onBillingServiceDisconnected() {}
            })
        } catch (_: Exception) {
            // Swallow — next launch will retry.
        }
    }

    override fun getLaunchingUrl(): Uri {
        val base   = super.getLaunchingUrl()
        val prefs  = getSharedPreferences(PREFS, MODE_PRIVATE)
        val token  = prefs.getString(FCM_KEY, null)
        val subAct = prefs.getString(SUB_ACTIVE_KEY, null)
        val subSku = prefs.getString(SUB_SKU_KEY, null)
        if (token.isNullOrEmpty() && subAct.isNullOrEmpty()) return base
        val builder = base.buildUpon()
        if (!token.isNullOrEmpty()) builder.appendQueryParameter("fcm_token", token)
        if (!subAct.isNullOrEmpty()) {
            // sub_active=1 means BillingClient confirmed an active subscription
            // for THIS device on the PREVIOUS launch. The web page treats this
            // as authoritative and immediately upgrades local state to 'active'
            // — bypasses the broken DGS code path that was leaving the trial
            // banner stuck on screen.
            builder.appendQueryParameter("sub_active", subAct)
            if (!subSku.isNullOrEmpty()) builder.appendQueryParameter("sub_sku", subSku)
        }
        return builder.build()
    }
}
