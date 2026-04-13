# Firebase / FCM
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# TWA / Custom Tabs
-keep class com.google.androidbrowserhelper.** { *; }
-dontwarn com.google.androidbrowserhelper.**

# Google Play Billing
-keep class com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# Health Connect
-keep class androidx.health.connect.** { *; }
-dontwarn androidx.health.connect.**

# WorkManager
-keep class androidx.work.** { *; }
-dontwarn androidx.work.**

# App activities and services
-keep class io.github.jaysolo828_jpg.twa.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-dontwarn kotlin.**
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
