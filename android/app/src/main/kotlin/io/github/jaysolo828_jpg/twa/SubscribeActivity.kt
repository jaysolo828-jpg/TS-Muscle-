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

class SubscribeActivity : Activity(), PurchasesUpdatedListener {

    private lateinit var billingClient: BillingClient
    private var sku: String = "muscle_monthly"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sku = intent?.data?.getQueryParameter("sku") ?: "muscle_monthly"

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
                    querySubAndLaunch()
                } else {
                    returnToWeb("error", "setup_${billingResult.responseCode}")
                }
            }
            override fun onBillingServiceDisconnected() {}
        })
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
                billingClient.launchBillingFlow(this, flowParams)
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
                    billingClient.acknowledgePurchase(ackParams) {
                        returnToWeb("success", purchase.purchaseToken)
                    }
                } else {
                    returnToWeb("success", purchase.purchaseToken)
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> returnToWeb("cancelled", "")
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
