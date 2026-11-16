package com.roadplanner.manager

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * 로드플래너 안드로이드 앱 — 매니저 웹앱을 그대로 보여 주는 앱
 *  - 티맵·카카오맵·전화 같은 외부 앱 열기
 *  - 사진 첨부(로드톡·긴급보고), 위치(지연 예상)
 *  - 출발 15분 전 알림: 웹이 window.RoadPlannerAndroid.setReminders(json) 로 목록을 넘기면 폰에 알림 예약
 *  - roadplanner://next 로 열면 다음 일정 길안내
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    private val pickFile = registerForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        fileCallback?.onReceiveValue(uris.toTypedArray())
        fileCallback = null
    }

    private val askLocation = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val ok = result.values.any { it }
        geoCallback?.invoke(geoOrigin, ok, false)
        geoCallback = null
    }

    private val askNotify = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(edgeToEdgeLayout(web))
        Reminders.ensureChannel(this)

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setGeolocationEnabled(true)
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportZoom(false)
            builtInZoomControls = false
            userAgentString = "$userAgentString RoadPlannerAndroid/1.0"
        }

        web.addJavascriptInterface(Bridge(), "RoadPlannerAndroid")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return handleUrl(request.url.toString())
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView?, callback: ValueCallback<Array<Uri>>?, params: FileChooserParams?): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                val type = params?.acceptTypes?.firstOrNull { it.isNotBlank() } ?: "*/*"
                return try { pickFile.launch(type); true } catch (e: Exception) { fileCallback = null; false }
            }

            override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                val granted = ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                    ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                if (granted) { callback?.invoke(origin, true, false); return }
                geoOrigin = origin; geoCallback = callback
                askLocation.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })

        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            askNotify.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        web.loadUrl(startUrl(intent))
    }

    /**
     * 안드로이드 15 이상(앱 기준 API 35+)은 화면을 상태 표시줄·아래 버튼 밑까지 꽉 채워 그리게 강제함.
     * 웹 화면이 시계·배터리 아이콘이나 아래 버튼에 가리지 않게, 위·아래에 그만큼 빈 칸을 두고 웹을 그 사이에 둠.
     * (위 칸은 예전 상태 표시줄 색, 아래 칸은 흰색 → 예전과 같은 모습. 자판이 올라오면 아래 칸이 자판 높이만큼 커짐)
     */
    private fun edgeToEdgeLayout(content: View): View {
        WindowCompat.setDecorFitsSystemWindows(window, false)   // 안드로이드 14 이하도 같은 방식으로
        val top = View(this).apply { setBackgroundColor(0xFF1E1B4B.toInt()) }
        val bottom = View(this).apply { setBackgroundColor(0xFFFFFFFF.toInt()) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFFFFFFFF.toInt())
            addView(top, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0))
            addView(content, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
            addView(bottom, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            top.layoutParams = (top.layoutParams as LinearLayout.LayoutParams).apply { height = bars.top }
            bottom.layoutParams = (bottom.layoutParams as LinearLayout.LayoutParams).apply { height = maxOf(bars.bottom, ime.bottom) }
            v.setPadding(bars.left, 0, bars.right, 0)
            top.requestLayout(); bottom.requestLayout()
            WindowInsetsCompat.CONSUMED
        }
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = false     // 어두운 위 칸 → 흰 아이콘
            isAppearanceLightNavigationBars = true  // 흰 아래 칸 → 어두운 버튼
        }
        return root
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val url = startUrl(intent)
        if (url.contains("go=next") || intent.data != null) web.loadUrl(url)
    }

    // roadplanner://next 또는 알림 탭 → 다음 일정 길안내 (?go=next)
    private fun startUrl(intent: Intent?): String {
        val base = BuildConfig.APP_URL
        val data = intent?.data
        val fromReminder = intent?.getStringExtra("open_url")
        return when {
            !fromReminder.isNullOrBlank() && fromReminder.startsWith(base) -> fromReminder
            intent?.component?.className?.endsWith(".NavGo") == true -> "$base?go=next"   // '로드플래너 길안내' 아이콘
            data != null && data.scheme == "roadplanner" && (data.host == "next" || data.path?.contains("next") == true) -> "$base?go=next"
            else -> base
        }
    }

    // 웹 주소는 앱 안에서, 그 밖(티맵·카카오·전화·문자·다른 사이트)은 해당 앱으로
    private fun handleUrl(url: String): Boolean {
        val uri = Uri.parse(url)
        val scheme = uri.scheme ?: return false
        if ((scheme == "https" || scheme == "http") && url.startsWith(BuildConfig.APP_URL)) return false
        if (scheme == "https" || scheme == "http") {
            // 같은 서비스의 다른 페이지(공유 링크 등)는 앱 안에서, 나머지 사이트는 브라우저로
            if (uri.host == Uri.parse(BuildConfig.APP_URL).host) return false
            return openExternal(Intent(Intent.ACTION_VIEW, uri))
        }
        if (scheme == "intent") {
            return try {
                val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                intent.addCategory(Intent.CATEGORY_BROWSABLE)
                intent.component = null
                intent.selector = null
                try { startActivity(intent); true } catch (e: ActivityNotFoundException) {
                    val fallback = intent.getStringExtra("browser_fallback_url")
                    val pkg = intent.`package`
                    when {
                        !fallback.isNullOrBlank() -> openExternal(Intent(Intent.ACTION_VIEW, Uri.parse(fallback)))
                        !pkg.isNullOrBlank() -> openExternal(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")))
                        else -> true
                    }
                }
            } catch (e: Exception) { true }
        }
        // tel:, sms:, tmap://, kakaomap://, kakaonavi:// 등
        val ok = openExternal(Intent(Intent.ACTION_VIEW, uri))
        if (!ok) {
            val market = when (scheme) {
                "tmap" -> "com.skt.tmap.ku"
                "kakaomap" -> "net.daum.android.map"
                "kakaonavi" -> "com.locnall.KimGiSa"
                else -> null
            }
            if (market != null) openExternal(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$market")))
        }
        return true
    }

    private fun openExternal(intent: Intent): Boolean = try {
        startActivity(intent); true
    } catch (e: ActivityNotFoundException) { false } catch (e: SecurityException) { false }

    /** 웹(autonav.js)에서 부르는 함수들 */
    inner class Bridge {
        @JavascriptInterface
        fun setReminders(json: String) {
            Reminders.replaceAll(this@MainActivity, json)
        }

        @JavascriptInterface
        fun version(): String = "1.0.0"
    }
}
