package com.mkr.academy;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.GoogleAuthProvider;
import org.json.JSONObject;
import java.net.URISyntaxException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * MKR Academy - Production Java Android WebView Activity
 *
 * Includes full support for:
 * 1. Native Android Credential Manager Google Sign-In + Firebase Auth synchronization
 * 2. External Google Drive PDF opening via ACTION_VIEW (Drive App -> Chrome/Browser fallback)
 * 3. Razorpay UPI Intent payments (Google Pay, PhonePe, Paytm, BHIM)
 */
public class MainActivity extends AppCompatActivity {

    private static final String GOOGLE_DRIVE_PACKAGE = "com.google.android.apps.docs";
    private static final String CHROME_PACKAGE = "com.android.chrome";

    private WebView webView;
    private CredentialManager credentialManager;
    private final ExecutorService authExecutor = Executors.newSingleThreadExecutor();
    private final String websiteUrl = "https://ais-dev-thkxnkewcmofcvdrlseylg-476803681048.asia-southeast1.run.app";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        credentialManager = CredentialManager.create(this);
        webView = findViewById(R.id.webView);

        setupWebSettings();
        setupJavascriptBridge();
        setupWebViewClient();
        setupDownloadListener();
        setupBackNavigation();

        if (savedInstanceState == null) {
            webView.loadUrl(websiteUrl);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebSettings() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        String defaultUserAgent = settings.getUserAgentString();
        settings.setUserAgentString(defaultUserAgent + " MKRAcademyApp/1.0");
    }

    @SuppressLint("JavascriptInterface")
    private void setupJavascriptBridge() {
        webView.addJavascriptInterface(new MkrAndroidBridge(), "MKRAcademyAndroid");
    }

    private boolean isTrustedOrigin(String currentUrl) {
        if (currentUrl == null || currentUrl.trim().isEmpty()) return false;
        try {
            Uri uri = Uri.parse(currentUrl);
            String host = uri.getHost();
            if (host == null) return false;
            String lowerHost = host.toLowerCase();
            String websiteHost = Uri.parse(websiteUrl).getHost();
            return (websiteHost != null && lowerHost.equals(websiteHost.toLowerCase())) ||
                lowerHost.equals("mkracademy.in") ||
                lowerHost.equals("www.mkracademy.in") ||
                lowerHost.endsWith(".netlify.app") ||
                lowerHost.endsWith(".run.app") ||
                lowerHost.endsWith(".web.app") ||
                lowerHost.endsWith(".firebaseapp.com") ||
                lowerHost.equals("localhost") ||
                lowerHost.equals("127.0.0.1");
        } catch (Exception e) {
            return false;
        }
    }

    public class MkrAndroidBridge {
        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }

        @JavascriptInterface
        public void startGoogleSignIn() {
            runOnUiThread(() -> {
                if (!isTrustedOrigin(webView.getUrl())) {
                    dispatchGoogleSignInError("UNTRUSTED_ORIGIN", "Untrusted origin for native sign-in.");
                    return;
                }
                launchCredentialManagerGoogleSignIn();
            });
        }

        @JavascriptInterface
        public void clearGoogleSession() {
            runOnUiThread(() -> {
                if (!isTrustedOrigin(webView.getUrl())) return;
                credentialManager.clearCredentialStateAsync(
                    new ClearCredentialStateRequest(),
                    new CancellationSignal(),
                    authExecutor,
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override
                        public void onResult(Void result) {}

                        @Override
                        public void onError(@NonNull ClearCredentialException e) {}
                    }
                );
                try {
                    if (!FirebaseApp.getApps(MainActivity.this).isEmpty()) {
                        FirebaseAuth.getInstance().signOut();
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public boolean openInGoogleDrive(String url) {
            if (url == null || url.trim().isEmpty()) {
                runOnUiThread(() -> Toast.makeText(
                    MainActivity.this,
                    "Google Drive link is unavailable for this PDF.",
                    Toast.LENGTH_LONG
                ).show());
                return false;
            }

            runOnUiThread(() -> {
                if (!isTrustedOrigin(webView.getUrl())) {
                    Toast.makeText(
                        MainActivity.this,
                        "Blocked opening link from untrusted context.",
                        Toast.LENGTH_SHORT
                    ).show();
                    return;
                }
                openExternalDriveOrBrowser(url);
            });
            return true;
        }
    }

    private void launchCredentialManagerGoogleSignIn() {
        String webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID;
        if (webClientId == null || webClientId.trim().isEmpty()) {
            dispatchGoogleSignInError("CONFIG_ERROR", "Google Web Client ID is not configured.");
            return;
        }

        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setAutoSelectEnabled(false)
            .setServerClientId(webClientId)
            .build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build();

        credentialManager.getCredentialAsync(
            this,
            request,
            new CancellationSignal(),
            authExecutor,
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse response) {
                    handleCredentialResult(response.getCredential());
                }

                @Override
                public void onError(@NonNull GetCredentialException e) {
                    if (e instanceof GetCredentialCancellationException) {
                        dispatchGoogleSignInError(
                            "CANCELLED",
                            "Google sign-in was cancelled. Please select a Google account to continue."
                        );
                    } else if (e instanceof NoCredentialException) {
                        launchSignInWithGoogleOptionFallback(webClientId);
                    } else {
                        String msg = e.getErrorMessage() != null
                            ? e.getErrorMessage().toString()
                            : (e.getMessage() != null ? e.getMessage() : "Google account selection failed.");
                        String code = msg.toLowerCase().contains("network") ? "NETWORK_ERROR" : "ERROR";
                        dispatchGoogleSignInError(code, msg);
                    }
                }
            }
        );
    }

    private void launchSignInWithGoogleOptionFallback(String webClientId) {
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(webClientId).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(option)
            .build();

        credentialManager.getCredentialAsync(
            this,
            request,
            new CancellationSignal(),
            authExecutor,
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse response) {
                    handleCredentialResult(response.getCredential());
                }

                @Override
                public void onError(@NonNull GetCredentialException e) {
                    if (e instanceof GetCredentialCancellationException) {
                        dispatchGoogleSignInError(
                            "CANCELLED",
                            "Google sign-in was cancelled. Please select a Google account to continue."
                        );
                    } else if (e instanceof NoCredentialException) {
                        dispatchGoogleSignInError(
                            "NO_CREDENTIAL",
                            "No Google account found on this device. Please add a Gmail account in Android Settings and try again."
                        );
                    } else {
                        String msg = e.getErrorMessage() != null
                            ? e.getErrorMessage().toString()
                            : (e.getMessage() != null ? e.getMessage() : "Unable to connect to Google Sign-In.");
                        dispatchGoogleSignInError("ERROR", msg);
                    }
                }
            }
        );
    }

    private void handleCredentialResult(Credential credential) {
        if (credential instanceof CustomCredential &&
            GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
            try {
                GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(credential.getData());
                String idToken = googleCredential.getIdToken();
                String email = googleCredential.getId();
                String displayName = googleCredential.getDisplayName() != null ? googleCredential.getDisplayName() : "";

                if (!FirebaseApp.getApps(this).isEmpty()) {
                    AuthCredential firebaseCred = GoogleAuthProvider.getCredential(idToken, null);
                    FirebaseAuth.getInstance()
                        .signInWithCredential(firebaseCred)
                        .addOnSuccessListener(authResult -> dispatchGoogleSignInSuccess(idToken, email, displayName))
                        .addOnFailureListener(authEx -> dispatchGoogleSignInError(
                            "ERROR",
                            authEx.getLocalizedMessage() != null ? authEx.getLocalizedMessage() : "Firebase Authentication failed."
                        ));
                } else {
                    dispatchGoogleSignInSuccess(idToken, email, displayName);
                }
            } catch (GoogleIdTokenParsingException e) {
                dispatchGoogleSignInError("ERROR", "Invalid Google ID token received from device.");
            }
        } else {
            dispatchGoogleSignInError("ERROR", "Unexpected credential type returned by Google.");
        }
    }

    private void dispatchGoogleSignInSuccess(String idToken, String email, String displayName) {
        try {
            JSONObject obj = new JSONObject();
            obj.put("idToken", idToken);
            obj.put("email", email);
            obj.put("displayName", displayName);
            String payload = obj.toString();

            runOnUiThread(() -> {
                String js = "window.__mkrAndroidGoogleSignInSuccess && window.__mkrAndroidGoogleSignInSuccess(" + payload + ");";
                webView.evaluateJavascript(js, null);
            });
        } catch (Exception e) {
            dispatchGoogleSignInError("ERROR", "Failed to pass credential to app.");
        }
    }

    private void dispatchGoogleSignInError(String code, String message) {
        try {
            JSONObject obj = new JSONObject();
            obj.put("code", code);
            obj.put("message", message);
            String payload = obj.toString();

            runOnUiThread(() -> {
                String js = "window.__mkrAndroidGoogleSignInError && window.__mkrAndroidGoogleSignInError(" + payload + ");";
                webView.evaluateJavascript(js, null);
            });
        } catch (Exception ignored) {}
    }

    private void setupWebViewClient() {
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    boolean isMainFrame = Build.VERSION.SDK_INT < Build.VERSION_CODES.N || request.isForMainFrame();
                    return handleUrlScheme(request.getUrl().toString(), isMainFrame);
                }
                return false;
            }

            @Deprecated
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null) {
                    return handleUrlScheme(url, true);
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
    }

    private boolean handleUrlScheme(String url, boolean isMainFrame) {
        if (url == null) return false;

        if (url.startsWith("http://") || url.startsWith("https://")) {
            if (url.contains("api.razorpay.com") || url.contains("checkout.razorpay.com")) {
                return false;
            }
            if (isMainFrame && isGoogleDriveUrl(url) && !url.contains("/preview")) {
                return openExternalDriveOrBrowser(url);
            }
            return false;
        }

        if (url.startsWith("upi://") ||
            url.startsWith("tez://") ||
            url.startsWith("phonepe://") ||
            url.startsWith("paytmmp://") ||
            url.startsWith("paytm://") ||
            url.startsWith("bhim://")) {
            return launchIntentUri(url);
        }

        if (url.startsWith("intent://")) {
            return launchAndroidIntent(url);
        }

        if (url.startsWith("whatsapp://") || url.startsWith("tel:") || url.startsWith("mailto:")) {
            return launchIntentUri(url);
        }

        return false;
    }

    private boolean isGoogleDriveUrl(String url) {
        String lower = url.toLowerCase();
        return lower.startsWith("https://drive.google.com/") ||
            lower.startsWith("https://docs.google.com/") ||
            lower.startsWith("https://drive.usercontent.google.com/") ||
            lower.startsWith("http://drive.google.com/") ||
            lower.startsWith("http://docs.google.com/");
    }

    private boolean isPackageInstalled(String packageName) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getPackageManager().getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0));
            } else {
                getPackageManager().getPackageInfo(packageName, 0);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean openExternalDriveOrBrowser(String rawUrl) {
        Uri uri;
        try {
            uri = Uri.parse(rawUrl.trim());
        } catch (Exception e) {
            Toast.makeText(this, "Invalid Google Drive PDF link.", Toast.LENGTH_LONG).show();
            return true;
        }

        String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
        if (!"https".equals(scheme) && !"http".equals(scheme)) {
            Toast.makeText(this, "Unsupported PDF link format.", Toast.LENGTH_LONG).show();
            return true;
        }

        if (isGoogleDriveUrl(rawUrl) && isPackageInstalled(GOOGLE_DRIVE_PACKAGE)) {
            try {
                Intent driveIntent = new Intent(Intent.ACTION_VIEW, uri);
                driveIntent.setPackage(GOOGLE_DRIVE_PACKAGE);
                driveIntent.addCategory(Intent.CATEGORY_BROWSABLE);
                driveIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (driveIntent.resolveActivity(getPackageManager()) != null) {
                    startActivity(driveIntent);
                    return true;
                }
            } catch (Exception ignored) {}
        }

        if (isPackageInstalled(CHROME_PACKAGE)) {
            try {
                Intent chromeIntent = new Intent(Intent.ACTION_VIEW, uri);
                chromeIntent.setPackage(CHROME_PACKAGE);
                chromeIntent.addCategory(Intent.CATEGORY_BROWSABLE);
                chromeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (chromeIntent.resolveActivity(getPackageManager()) != null) {
                    startActivity(chromeIntent);
                    return true;
                }
            } catch (Exception ignored) {}
        }

        try {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, uri);
            browserIntent.addCategory(Intent.CATEGORY_BROWSABLE);
            browserIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(browserIntent);
            return true;
        } catch (ActivityNotFoundException e) {
            Toast.makeText(
                this,
                "Please install Google Drive or a web browser (such as Chrome) to open this PDF.",
                Toast.LENGTH_LONG
            ).show();
            return true;
        } catch (Exception e) {
            Toast.makeText(this, "Unable to open PDF link externally. Please try again.", Toast.LENGTH_LONG).show();
            return true;
        }
    }

    private boolean launchIntentUri(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            return true;
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No supported UPI application found. Please install Google Pay, PhonePe, or Paytm.", Toast.LENGTH_LONG).show();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return true;
        }
    }

    private boolean launchAndroidIntent(String intentUrl) {
        try {
            Intent intent = Intent.parseUri(intentUrl, Intent.URI_INTENT_SCHEME);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.setComponent(null);
            intent.setSelector(null);

            if (intent.resolveActivity(getPackageManager()) != null) {
                startActivity(intent);
                return true;
            }

            String fallbackUrl = intent.getStringExtra("browser_fallback_url");
            if (fallbackUrl != null && !fallbackUrl.isEmpty()) {
                webView.loadUrl(fallbackUrl);
                return true;
            }

            String packageName = intent.getPackage();
            if (packageName != null && !packageName.isEmpty()) {
                try {
                    Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
                    startActivity(marketIntent);
                    return true;
                } catch (ActivityNotFoundException e) {
                    Intent playStoreIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + packageName));
                    startActivity(playStoreIntent);
                    return true;
                }
            }
        } catch (URISyntaxException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return true;
    }

    private void setupDownloadListener() {
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            if (url != null && !url.trim().isEmpty()) {
                openExternalDriveOrBrowser(url);
            } else {
                Toast.makeText(getApplicationContext(), "Invalid PDF download link.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("MKRAcademyAndroid");
        }
        authExecutor.shutdownNow();
        super.onDestroy();
    }
}
