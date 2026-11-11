package com.mkr.academy

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import java.net.URISyntaxException

/**
 * MKR Academy - Production Android WebView Activity
 * 
 * Includes full support for:
 * 1. Razorpay UPI Intent payments (Google Pay, PhonePe, Paytm, BHIM)
 * 2. Deep-link scheme interception (upi://, intent://, tez://, phonepe://, paytmmp://)
 * 3. Android 11+ Package Visibility query handling
 * 4. Proper web navigation history and safe-area rendering
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    // Replace with your live domain or development URL
    private val websiteUrl = "https://ais-dev-thkxnkewcmofcvdrlseylg-476803681048.asia-southeast1.run.app"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        setupWebSettings()
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

    private fun setupWebViewClient() {
        webView.webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return handleUrlScheme(url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false
                return handleUrlScheme(url)
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
     * Intercepts UPI intent schemes and passes them to native UPI applications
     */
    private fun handleUrlScheme(url: String): Boolean {
        // 1. Check for standard HTTP/HTTPS URLs (Load inside WebView)
        if (url.startsWith("http://") || url.startsWith("https://")) {
            // Check if URL is an external payment or OAuth provider redirect requiring external browser
            if (url.contains("api.razorpay.com") || url.contains("checkout.razorpay.com")) {
                return false // Allow Razorpay checkout to load inside WebView
            }
            return false // Default: let WebView load the website page
        }

        // 2. Direct UPI schemes (upi://pay?...)
        if (url.startsWith("upi://") ||
            url.startsWith("tez://") ||
            url.startsWith("phonepe://") ||
            url.startsWith("paytmmp://") ||
            url.startsWith("paytm://") ||
            url.startsWith("bhim://")
        ) {
            return launchIntentUri(url)
        }

        // 3. Android Intent scheme (intent://...#Intent;scheme=upi;...)
        if (url.startsWith("intent://")) {
            return launchAndroidIntent(url)
        }

        // 4. WhatsApp, Tel, Mailto schemes
        if (url.startsWith("whatsapp://") ||
            url.startsWith("tel:") ||
            url.startsWith("mailto:")
        ) {
            return launchIntentUri(url)
        }

        return false
    }

    /**
     * Launches standard URI via ACTION_VIEW
     */
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

    /**
     * Parses and launches intent:// scheme with package fallback to Google Play Store
     */
    private fun launchAndroidIntent(intentUrl: String): Boolean {
        try {
            val intent = Intent.parseUri(intentUrl, Intent.URI_INTENT_SCHEME)
            intent.addCategory(Intent.CATEGORY_BROWSABLE)
            intent.component = null
            intent.selector = null

            // Try launching the specific app intent
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
                return true
            }

            // Fallback: If app not installed, open fallback URL or Play Store
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

    private fun setupDownloadListener() {
        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
            try {
                val intent = Intent(Intent.ACTION_VIEW)
                intent.data = Uri.parse(url)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                startActivity(intent)
            } catch (e: Exception) {
                try {
                    val request = android.app.DownloadManager.Request(Uri.parse(url))
                    request.setMimeType(mimetype)
                    request.addRequestHeader("User-Agent", userAgent)
                    request.setDescription("Downloading MKR Academy Educational Notes")
                    request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype))
                    request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    request.setDestinationInExternalPublicDir(
                        android.os.Environment.DIRECTORY_DOWNLOADS,
                        URLUtil.guessFileName(url, contentDisposition, mimetype)
                    )
                    val dm = getSystemService(Context.DOWNLOAD_SERVICE) as? android.app.DownloadManager
                    dm?.enqueue(request)
                    Toast.makeText(applicationContext, "Downloading Note...", Toast.LENGTH_SHORT).show()
                } catch (ex: Exception) {
                    Toast.makeText(applicationContext, "Failed to start download.", Toast.LENGTH_SHORT).show()
                }
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
}
