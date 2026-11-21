package com.mkr.academy

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.URISyntaxException

/**
 * MKR Academy - Production Android WebView Activity
 *
 * Includes full support for:
 * 1. Native Android Credential Manager Google Sign-In + Firebase Auth synchronization
 * 2. External Google Drive PDF opening via ACTION_VIEW (Drive App -> Chrome/Browser fallback)
 * 3. Razorpay UPI Intent payments (Google Pay, PhonePe, Paytm, BHIM)
 * 4. Android 11+ Package Visibility query handling
 * 5. Proper web navigation history and safe-area rendering
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var credentialManager: CredentialManager

    // Replace with your live custom/Netlify domain or Cloud Run URL
    private val websiteUrl = "https://ais-dev-thkxnkewcmofcvdrlseylg-476803681048.asia-southeast1.run.app"

    companion object {
        private const val GOOGLE_DRIVE_PACKAGE = "com.google.android.apps.docs"
        private const val CHROME_PACKAGE = "com.android.chrome"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        credentialManager = CredentialManager.create(this)
        webView = findViewById(R.id.webView)

        setupWebSettings()
        setupJavascriptBridge()
        setupWebViewClient()
        setupChromeClient()
        setupDownloadListener()
        setupBackNavigation()

        if (savedInstanceState == null) {
            webView.loadUrl(websiteUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebSettings() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.javaScriptCanOpenWindowsAutomatically = true

        // Append custom indicator to User-Agent while preserving normal Chrome browser UA
        val defaultUserAgent = settings.userAgentString
        settings.userAgentString = "$defaultUserAgent MKRAcademyApp/1.0"
    }

    /**
     * Exposes native Android Credential Manager and external Google Drive Intent APIs to the MKR Academy WebView.
     */
    @SuppressLint("JavascriptInterface")
    private fun setupJavascriptBridge() {
        webView.addJavascriptInterface(MkrAndroidBridge(), "MKRAcademyAndroid")
    }

    private fun isTrustedOrigin(currentUrl: String?): Boolean {
        if (currentUrl.isNullOrBlank()) return false
        return try {
            val uri = Uri.parse(currentUrl)
            val host = uri.host?.lowercase() ?: return false
            val websiteHost = Uri.parse(websiteUrl).host?.lowercase()
            host == websiteHost ||
                host == "mkracademy.in" ||
                host == "www.mkracademy.in" ||
                host.endsWith(".netlify.app") ||
                host.endsWith(".run.app") ||
                host.endsWith(".web.app") ||
                host.endsWith(".firebaseapp.com") ||
                host == "localhost" ||
                host == "127.0.0.1"
        } catch (_: Exception) {
            false
        }
    }

    inner class MkrAndroidBridge {
        @JavascriptInterface
        fun isAndroidApp(): Boolean = true

        @JavascriptInterface
        fun startGoogleSignIn() {
            runOnUiThread {
                if (!isTrustedOrigin(webView.url)) {
                    dispatchGoogleSignInError("UNTRUSTED_ORIGIN", "Untrusted origin for native sign-in.")
                    return@runOnUiThread
                }
                launchCredentialManagerGoogleSignIn()
            }
        }

        @JavascriptInterface
        fun clearGoogleSession() {
            runOnUiThread {
                if (!isTrustedOrigin(webView.url)) return@runOnUiThread
                lifecycleScope.launch {
                    try {
                        credentialManager.clearCredentialState(ClearCredentialStateRequest())
                    } catch (_: Exception) {
                        // Non-blocking cleanup
                    }
                    try {
                        if (FirebaseApp.getApps(this@MainActivity).isNotEmpty()) {
                            FirebaseAuth.getInstance().signOut()
                        }
                    } catch (_: Exception) {
                        // Non-blocking cleanup
                    }
                }
            }
        }

        @JavascriptInterface
        fun openInGoogleDrive(url: String?): Boolean {
            if (url.isNullOrBlank()) {
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Google Drive link is unavailable for this PDF.",
                        Toast.LENGTH_LONG
                    ).show()
                }
                return false
            }

            runOnUiThread {
                if (!isTrustedOrigin(webView.url)) {
                    Toast.makeText(
                        this@MainActivity,
                        "Blocked opening link from untrusted context.",
                        Toast.LENGTH_SHORT
                    ).show()
                    return@runOnUiThread
                }
                openExternalDriveOrBrowser(url)
            }
            return true
        }
    }

    /**
     * Launches native Android Google Account Picker via Credential Manager.
     * Supports single and multiple Gmail accounts without manual email/password pages.
     */
    private fun launchCredentialManagerGoogleSignIn() {
        val webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID
        if (webClientId.isBlank()) {
            dispatchGoogleSignInError("CONFIG_ERROR", "Google Web Client ID is not configured.")
            return
        }

        lifecycleScope.launch {
            try {
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setAutoSelectEnabled(false)
                    .setServerClientId(webClientId)
                    .build()

                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()

                val result = credentialManager.getCredential(
                    context = this@MainActivity,
                    request = request
                )
                handleCredentialResult(result.credential)
            } catch (e: GetCredentialCancellationException) {
                dispatchGoogleSignInError(
                    "CANCELLED",
                    "Google sign-in was cancelled. Please select a Google account to continue."
                )
            } catch (e: NoCredentialException) {
                // Fallback to explicit Google account chooser dialog on devices where bottom-sheet cache is empty
                launchSignInWithGoogleOptionFallback(webClientId)
            } catch (e: GetCredentialException) {
                val msg = e.errorMessage?.toString() ?: e.message ?: "Google account selection failed."
                val code = if (msg.contains("network", ignoreCase = true)) "NETWORK_ERROR" else "ERROR"
                dispatchGoogleSignInError(code, msg)
            } catch (e: Exception) {
                dispatchGoogleSignInError("ERROR", e.localizedMessage ?: "Failed to complete Google Sign-In.")
            }
        }
    }

    private fun launchSignInWithGoogleOptionFallback(webClientId: String) {
        lifecycleScope.launch {
            try {
                val signInWithGoogleOption = GetSignInWithGoogleOption.Builder(webClientId).build()
                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(signInWithGoogleOption)
                    .build()

                val result = credentialManager.getCredential(
                    context = this@MainActivity,
                    request = request
                )
                handleCredentialResult(result.credential)
            } catch (_: GetCredentialCancellationException) {
                dispatchGoogleSignInError(
                    "CANCELLED",
                    "Google sign-in was cancelled. Please select a Google account to continue."
                )
            } catch (_: NoCredentialException) {
                dispatchGoogleSignInError(
                    "NO_CREDENTIAL",
                    "No Google account found on this device. Please add a Gmail account in Android Settings and try again."
                )
            } catch (e: GetCredentialException) {
                val msg = e.errorMessage?.toString() ?: e.message ?: "Unable to connect to Google Sign-In."
                dispatchGoogleSignInError("ERROR", msg)
            } catch (e: Exception) {
                dispatchGoogleSignInError("ERROR", e.localizedMessage ?: "Google Sign-In failed.")
            }
        }
    }

    private fun handleCredentialResult(credential: androidx.credentials.Credential) {
        if (credential is CustomCredential &&
            credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
        ) {
            try {
                val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleCredential.idToken
                val email = googleCredential.id
                val displayName = googleCredential.displayName ?: ""

                // Authenticate native FirebaseAuth session if google-services.json is configured in the Android project
                if (FirebaseApp.getApps(this).isNotEmpty()) {
                    val firebaseCred = GoogleAuthProvider.getCredential(idToken, null)
                    FirebaseAuth.getInstance()
                        .signInWithCredential(firebaseCred)
                        .addOnSuccessListener {
                            dispatchGoogleSignInSuccess(idToken, email, displayName)
                        }
                        .addOnFailureListener { authEx ->
                            dispatchGoogleSignInError(
                                "ERROR",
                                authEx.localizedMessage ?: "Firebase Authentication failed."
                            )
                        }
                } else {
                    // Deliver verified Google ID token to WebView where Firebase Web SDK authenticates the session
                    dispatchGoogleSignInSuccess(idToken, email, displayName)
                }
            } catch (e: GoogleIdTokenParsingException) {
                dispatchGoogleSignInError("ERROR", "Invalid Google ID token received from device.")
            }
        } else {
            dispatchGoogleSignInError("ERROR", "Unexpected credential type returned by Google.")
        }
    }

    private fun dispatchGoogleSignInSuccess(idToken: String, email: String, displayName: String) {
        val payload = JSONObject().apply {
            put("idToken", idToken)
            put("email", email)
            put("displayName", displayName)
        }.toString()

        runOnUiThread {
            val js = "window.__mkrAndroidGoogleSignInSuccess && window.__mkrAndroidGoogleSignInSuccess($payload);"
            webView.evaluateJavascript(js, null)
        }
    }

    private fun dispatchGoogleSignInError(code: String, message: String) {
        val payload = JSONObject().apply {
            put("code", code)
            put("message", message)
        }.toString()

        runOnUiThread {
            val js = "window.__mkrAndroidGoogleSignInError && window.__mkrAndroidGoogleSignInError($payload);"
            webView.evaluateJavascript(js, null)
        }
    }

    private fun setupWebViewClient() {
        webView.webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val isMainFrame = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    request?.isForMainFrame ?: true
                } else {
                    true
                }
                return handleUrlScheme(url, isMainFrame)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false
                return handleUrlScheme(url, true)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
            }
        }
    }

    /**
     * Intercepts UPI schemes and external Google Drive URLs while keeping
     * MKR Academy pages, Razorpay checkout, and inline PDF preview iframes inside WebView.
     */
    private fun handleUrlScheme(url: String, isMainFrame: Boolean): Boolean {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            if (url.contains("api.razorpay.com") || url.contains("checkout.razorpay.com")) {
                return false
            }

            // Open Google Drive / Docs PDF links externally when clicked as top-level navigation,
            // while allowing embedded /preview iframes to remain unchanged inside WebView.
            if (isMainFrame && isGoogleDriveUrl(url) && !url.contains("/preview")) {
                return openExternalDriveOrBrowser(url)
            }

            return false
        }

        // Direct UPI schemes
        if (url.startsWith("upi://") ||
            url.startsWith("tez://") ||
            url.startsWith("phonepe://") ||
            url.startsWith("paytmmp://") ||
            url.startsWith("paytm://") ||
            url.startsWith("bhim://")
        ) {
            return launchIntentUri(url)
        }

        // Android Intent scheme (intent://...#Intent;scheme=upi;...)
        if (url.startsWith("intent://")) {
            return launchAndroidIntent(url)
        }

        // WhatsApp, Tel, Mailto schemes
        if (url.startsWith("whatsapp://") ||
            url.startsWith("tel:") ||
            url.startsWith("mailto:")
        ) {
            return launchIntentUri(url)
        }

        return false
    }

    private fun isGoogleDriveUrl(url: String): Boolean {
        val lower = url.lowercase()
        return lower.startsWith("https://drive.google.com/") ||
            lower.startsWith("https://docs.google.com/") ||
            lower.startsWith("https://drive.usercontent.google.com/") ||
            lower.startsWith("http://drive.google.com/") ||
            lower.startsWith("http://docs.google.com/")
    }

    private fun isPackageInstalled(packageName: String): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getPackageInfo(packageName, 0)
            }
            true
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Opens the original Google Drive URL externally outside WebView:
     * 1. Opens in Google Drive app if installed and able to handle the URI.
     * 2. Falls back to Chrome or default external browser if Google Drive is not installed.
     * 3. Displays a helpful message if invalid or no external viewer is available.
     */
    private fun openExternalDriveOrBrowser(rawUrl: String): Boolean {
        val uri = try {
            Uri.parse(rawUrl.trim())
        } catch (_: Exception) {
            Toast.makeText(this, "Invalid Google Drive PDF link.", Toast.LENGTH_LONG).show()
            return true
        }

        val scheme = uri.scheme?.lowercase()
        if (scheme != "https" && scheme != "http") {
            Toast.makeText(this, "Unsupported PDF link format.", Toast.LENGTH_LONG).show()
            return true
        }

        // 1. Prefer Google Drive app when installed
        if (isGoogleDriveUrl(rawUrl) && isPackageInstalled(GOOGLE_DRIVE_PACKAGE)) {
            try {
                val driveIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                    setPackage(GOOGLE_DRIVE_PACKAGE)
                    addCategory(Intent.CATEGORY_BROWSABLE)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                if (driveIntent.resolveActivity(packageManager) != null) {
                    startActivity(driveIntent)
                    return true
                }
            } catch (_: Exception) {
                // Fall back to external browser below
            }
        }

        // 2. Fallback to Chrome if installed
        if (isPackageInstalled(CHROME_PACKAGE)) {
            try {
                val chromeIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                    setPackage(CHROME_PACKAGE)
                    addCategory(Intent.CATEGORY_BROWSABLE)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                if (chromeIntent.resolveActivity(packageManager) != null) {
                    startActivity(chromeIntent)
                    return true
                }
            } catch (_: Exception) {
                // Fall back to generic system browser below
            }
        }

        // 3. Generic external ACTION_VIEW browser fallback
        return try {
            val browserIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                addCategory(Intent.CATEGORY_BROWSABLE)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(browserIntent)
            true
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(
                this,
                "Please install Google Drive or a web browser (such as Chrome) to open this PDF.",
                Toast.LENGTH_LONG
            ).show()
            true
        } catch (_: Exception) {
            Toast.makeText(
                this,
                "Unable to open PDF link externally. Please try again.",
                Toast.LENGTH_LONG
            ).show()
            true
        }
    }

    private fun launchIntentUri(url: String): Boolean {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)
            return true
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(
                this,
                "No supported UPI application found on this device. Please install Google Pay, PhonePe, or Paytm.",
                Toast.LENGTH_LONG
            ).show()
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return true
        }
    }

    private fun launchAndroidIntent(intentUrl: String): Boolean {
        try {
            val intent = Intent.parseUri(intentUrl, Intent.URI_INTENT_SCHEME)
            intent.addCategory(Intent.CATEGORY_BROWSABLE)
            intent.component = null
            intent.selector = null

            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
                return true
            }

            val fallbackUrl = intent.getStringExtra("browser_fallback_url")
            if (!fallbackUrl.isNullOrEmpty()) {
                webView.loadUrl(fallbackUrl)
                return true
            }

            val packageName = intent.`package`
            if (!packageName.isNullOrEmpty()) {
                try {
                    val marketIntent = Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse("market://details?id=$packageName")
                    )
                    startActivity(marketIntent)
                    return true
                } catch (e: ActivityNotFoundException) {
                    val playStoreIntent = Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse("https://play.google.com/store/apps/details?id=$packageName")
                    )
                    startActivity(playStoreIntent)
                    return true
                }
            }
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return true
    }

    private fun setupChromeClient() {
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
            }
        }
    }

    /**
     * Never writes PDFs to internal/external storage; delegates external URLs to Drive / Browser ACTION_VIEW.
     */
    private fun setupDownloadListener() {
        webView.setDownloadListener { url, _, _, _, _ ->
            if (!url.isNullOrBlank()) {
                openExternalDriveOrBrowser(url)
            } else {
                Toast.makeText(this, "Invalid PDF download link.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.removeJavascriptInterface("MKRAcademyAndroid")
        super.onDestroy()
    }
}
