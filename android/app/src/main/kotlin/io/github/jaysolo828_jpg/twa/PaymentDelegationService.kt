package io.github.jaysolo828_jpg.twa

import com.google.androidbrowserhelper.billing.DigitalGoodsRequestHandler
import com.google.androidbrowserhelper.trusted.DelegationService

class PaymentDelegationService : DelegationService() {
    override fun onCreate() {
        super.onCreate()
        registerExtraCommandHandler(DigitalGoodsRequestHandler(applicationContext))
    }
}
