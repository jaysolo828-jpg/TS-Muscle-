package io.github.jaysolo828_jpg.twa

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams

class SubscribeActivity : Activity(), PurchasesUpdatedListener {

    private lateinit var billingClient: BillingClient
    private var sku: String = "muscle_monthly"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sku = intent?.getStringExtra("sku")
            ?: intent?.data?.getQueryParameter("sku")
            ?: "muscle_monthly"

        billingClient = BillingClient.newBuilder(this)
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build()
            )
            .build()

        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    // Check for existing purchases FIRST. If the user is already
                    // subscribed (Play has a token for this SKU), there's no
                    // billing flow to launch — Play would just show "you already
                    // own this" and return ITEM_ALREADY_OWNED. Instead, ack any
                    // unacked purchase, persist the active state to prefs, and
                    // return to the web with success so the trial badge clears.
                    checkExistingThenLaunch()
                } else {
                    returnToWeb("error", "setup_${billingResult.responseCode}")
                }
            }
            override fun onBillingServiceDisconnected() {}
        })
    }

    private fun checkExistingThenLaunch() {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
        billingClient.queryPurchasesAsync(params) { _, purchases ->
            val existing = purchases.firstOrNull {
                it.purchaseState == Purchase.PurchaseState.PURCHASED &&
                it.products.contains(sku)
            }
            if (existing != null) {
                // Cache to prefs so MainActivity's getLaunchingUrl picks it up
                // on the next cold launch too, even if the user closes the
                // app before the web-side write finishes.
                try {
                    getSharedPreferences("ts_muscle_prefs", MODE_PRIVATE).edit()
                        .putString("sub_active", "1")
                        .putString("sub_sku", sku)
                        .apply()
                } catch (_: Exception) {}

                if (!existing.isAcknowledged) {
                    val ackParams = AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(existing.purchaseToken)
                        .build()
                    billingClient.acknowledgePurchase(ackParams) { _ ->
                        returnToWeb("success", existing.purchaseToken)
                    }
                } else {
                    returnToWeb("success", existing.purchaseToken)
                }
            } else {
                runOnUiThread { querySubAndLaunch() }
            }
        }
    }

    private fun querySubAndLaunch() {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(listOf(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(sku)
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            )).build()

        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode != BillingClient.BillingResponseCode.OK || productDetailsList.isEmpty()) {
                runOnUiThread {
                    returnToWeb("error", "query_${billingResult.responseCode}_n${productDetailsList.size}")
                }
                return@queryProductDetailsAsync
            }

            val product = productDetailsList[0]
            val offerToken = product.subscriptionOfferDetails?.firstOrNull()?.offerToken
            if (offerToken == null) {
                runOnUiThread { returnToWeb("error", "no_offer") }
                return@queryProductDetailsAsync
            }

            val flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(product)
                        .setOfferToken(offerToken)
                        .build()
                )).build()

            runOnUiThread {
                val launchResult = billingClient.launchBillingFlow(this, flowParams)
                if (launchResult.responseCode != BillingClient.BillingResponseCode.OK) {
                    returnToWeb("error", "launch_${launchResult.responseCode}")
                }
            }
        }
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: MutableList<Purchase>?) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val purchase = purchases?.firstOrNull()
                if (purchase == null) {
                    returnToWeb("error", "ok_but_no_purchase")
                    return
                }
                if (!purchase.isAcknowledged) {
                    val ackParams = AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(purchase.purchaseToken)
                        .build()
                    billingClient.acknowledgePurchase(ackParams) { ackResult ->
                        if (ackResult.responseCode == BillingClient.BillingResponseCode.OK) {
                            returnToWeb("success", purchase.purchaseToken)
                        } else {
                            // Tell the web the purchase went through but ack failed
                            // so it can retry via DGS.acknowledge on next launch.
                            returnToWeb("success_unacked", purchase.purchaseToken)
                        }
                    }
                } else {
                    returnToWeb("success", purchase.purchaseToken)
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> returnToWeb("cancelled", "")
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                // Belt-and-suspenders — checkExistingThenLaunch should catch
                // this before launchBillingFlow runs, but if Play returns it
                // anyway, re-query and resolve to success.
                checkExistingThenLaunch()
            }
            else -> returnToWeb("error", "buy_${billingResult.responseCode}")
        }
    }

    private fun returnToWeb(status: String, detail: String) {
        val url = Uri.parse("https://app.therapyandsneakers.org/")
            .buildUpon()
            .appendQueryParameter("subscribe", status)
            .appendQueryParameter("subscribe_token", detail)
            .appendQueryParameter("subscribe_sku", sku)
            .build()

        val intent = Intent(Intent.ACTION_VIEW, url).apply {
            setPackage(packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        try { startActivity(intent) } catch (_: Exception) {}
        finish()
    }

    override fun onDestroy() {
        if (::billingClient.isInitialized) {
            try { billingClient.endConnection() } catch (_: Exception) {}
        }
        super.onDestroy()
    }
}
