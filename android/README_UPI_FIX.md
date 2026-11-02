# Razorpay UPI Payment Fix for Android APK (WebView)

## 1. Root Cause Analysis
Why was the UPI option (Google Pay, PhonePe, Paytm, BHIM) missing inside the Android APK while working in mobile Chrome?

1. **Razorpay Checkout Default Behavior**:
   When Razorpay's JavaScript SDK (`checkout.razorpay.com/v1/checkout.js`) detects an Android WebView (via User-Agent), it **automatically hides all UPI Intent options** by default. It does this because a vanilla Android `WebView` throws `net::ERR_UNKNOWN_URL_SCHEME` when trying to open custom URI schemes like `upi://pay`, crashing the payment flow.

2. **Missing `webview_intent: true`**:
   To instruct Razorpay that the Android app's WebView can handle deep-links, `webview_intent: true` must be passed in the `Razorpay(options)` object.

3. **Missing `shouldOverrideUrlLoading` Interception**:
   In Android, when a student taps "Google Pay", "PhonePe", or "Paytm", the WebView attempts to open an `intent://`, `upi://`, `tez://`, `phonepe://`, or `paytmmp://` URL. The `WebViewClient` must intercept these schemes and launch them using Android's `Intent(Intent.ACTION_VIEW, Uri.parse(url))`.

4. **Android 11+ Package Visibility (`<queries>`)**:
   On Android 11 (API level 30) and above, apps cannot query or communicate with other installed apps unless those intent schemes or package names are explicitly declared inside `<queries>` in `AndroidManifest.xml`.

---

## 2. Changes Made in Web App (`CheckoutModal.tsx`)
In `src/components/student/CheckoutModal.tsx`, the Razorpay initialization options have been updated:
```typescript
const options: any = {
  key: keyId,
  amount: product.sellingPricePaise,
  currency: 'INR',
  name: 'MKR Academy',
  description: product.title.substring(0, 40),
  order_id: razorpayOrderId,
  prefill: { ... },
  theme: { color: '#b91c1c' },

  // CRITICAL FIXES FOR ANDROID APK / WEBVIEW:
  webview_intent: true,  // Forces Razorpay to display UPI Intent apps (GPay, PhonePe, Paytm, BHIM)
  send_sms_hash: true,
  retry: {
    enabled: true,
    max_count: 3
  },
  timeout: 900,
  handler: async function (response) { ... }
};
```

---

## 3. Changes in Android APK Project

All ready-to-use Android files are available in the `/android` directory:
- `android/MainActivity.kt` (Kotlin)
- `android/MainActivity.java` (Java)
- `android/AndroidManifest.xml` (Includes `<queries>` for UPI)
- `android/activity_main.xml` (Layout)
- `android/build.gradle` (Dependencies)

### Key Method in WebViewClient (`shouldOverrideUrlLoading`):
```kotlin
override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
    val url = request?.url?.toString() ?: return false

    // 1. HTTP/HTTPS stays in WebView
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return false
    }

    // 2. Intercept UPI apps
    if (url.startsWith("upi://") ||
        url.startsWith("tez://") ||
        url.startsWith("phonepe://") ||
        url.startsWith("paytmmp://") ||
        url.startsWith("paytm://") ||
        url.startsWith("bhim://")) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)
        return true
    }

    // 3. Intercept Android Intent scheme
    if (url.startsWith("intent://")) {
        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
        if (intent.resolveActivity(packageManager) != null) {
            startActivity(intent)
            return true
        }
    }

    return false
}
```

### Essential Manifest Declarations (`AndroidManifest.xml`):
```xml
<queries>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="upi" />
    </intent>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="tez" />
    </intent>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="phonepe" />
    </intent>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="paytmmp" />
    </intent>
    <package android:name="com.google.android.apps.nbu.paisa.user" />
    <package android:name="com.phonepe.app" />
    <package android:name="net.one97.paytm" />
    <package android:name="in.org.npci.upiapp" />
</queries>
```

---

## 4. Payment Return & Verification
When a student completes payment inside Google Pay / PhonePe / Paytm:
1. Android switches back to the MKR Academy WebView.
2. Razorpay Checkout receives the payment result from the banking network.
3. Razorpay invokes the `handler(response)` callback with `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
4. The client sends these securely to `/api/payment/verify` on the MKR Academy server.
5. The backend validates the HMAC SHA-256 signature using the secret key.
6. Only upon genuine verification is the student granted permanent note access.
