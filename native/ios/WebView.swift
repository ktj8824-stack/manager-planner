import SwiftUI
import WebKit
import AuthenticationServices

/// 웹앱을 담는 화면.
/// - 티맵·카카오내비·전화(tel:) 같은 앱 주소는 아이폰에서 해당 앱으로 엽니다.
/// - 웹의 알림창(alert/confirm/prompt)을 아이폰 알림창으로 보여 줍니다.
/// - 화면을 아래로 당기면 새로고침합니다.
struct RoadWebView: UIViewRepresentable {
    let url: URL
    @ObservedObject var router = Router.shared      // 알림·roadplanner://next 로 들어온 주소

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.websiteDataStore = .default()          // 로그인·설정 유지
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        // 웹 → 앱: 출발 알림 목록 (window.webkit.messageHandlers.roadplanner)
        config.userContentController.add(context.coordinator, name: "roadplanner")
        // 웹에 "이 앱은 Apple 로그인을 할 수 있어요" 표시 (예전 앱에는 없어서 버튼이 안 보임)
        config.userContentController.addUserScript(WKUserScript(source: "window.__rpNative = { apple: true, v: 2 };",
                                                                injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.allowsBackForwardNavigationGestures = true
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 0.078, green: 0.071, blue: 0.239, alpha: 1)
        web.scrollView.contentInsetAdjustmentBehavior = .never
        #if DEBUG
        if #available(iOS 16.4, *) { web.isInspectable = true }   // 개발용 빌드에서만 맥 Safari 개발자 메뉴로 디버깅 (출시 빌드에서는 꺼짐)
        #endif

        let refresh = UIRefreshControl()
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.reload(_:)), for: .valueChanged)
        web.scrollView.refreshControl = refresh
        context.coordinator.webView = web

        web.load(URLRequest(url: router.pending ?? url))
        if router.pending != nil { DispatchQueue.main.async { router.pending = nil } }
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        if let next = router.pending {
            DispatchQueue.main.async { router.pending = nil }
            uiView.load(URLRequest(url: next))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        weak var webView: WKWebView?
        private let apple = AppleSignIn()

        // 웹이 보낸 출발 알림 목록을 아이폰 알림으로 예약
        func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
            if type == "reminders", let items = body["items"] as? [[String: Any]] { Reminders.replaceAll(items) }
            if type == "appleLogin" {
                apple.webView = webView
                apple.start(nonce: body["nonce"] as? String, wantNameEmail: (body["scopes"] as? Bool) ?? true)
            }
        }

        @objc func reload(_ sender: UIRefreshControl) {
            webView?.reload()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { sender.endRefreshing() }
        }

        // 웹 주소가 아닌 앱 주소(tmap://, kakaomap://, kakaonavi-sdk://, tel: 등)는 아이폰 앱으로 연다
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let target = action.request.url, let scheme = target.scheme?.lowercased() else {
                decisionHandler(.allow); return
            }
            if scheme == "roadplanner" { Router.shared.handle(target); decisionHandler(.cancel); return }
            let webSchemes: Set<String> = ["http", "https", "about", "data", "blob", "javascript"]
            if !webSchemes.contains(scheme) {
                UIApplication.shared.open(target, options: [:]) { ok in
                    if !ok, scheme == "tmap" || scheme == "kakaomap" || scheme.hasPrefix("kakaonavi") {
                        // 앱이 없으면 앱스토어로 안내
                        let store = scheme == "tmap" ? "https://apps.apple.com/kr/app/id431589174"
                                  : scheme == "kakaomap" ? "https://apps.apple.com/kr/app/id304608425"
                                  : "https://apps.apple.com/kr/app/id417698849"
                        if let u = URL(string: store) { UIApplication.shared.open(u) }
                    }
                }
                decisionHandler(.cancel); return
            }
            // 앱스토어 링크는 앱스토어로
            if let host = target.host, host.contains("apps.apple.com") || host.contains("itunes.apple.com") {
                UIApplication.shared.open(target); decisionHandler(.cancel); return
            }
            decisionHandler(.allow)
        }

        // 새 창(target=_blank, window.open)은 사파리로 연다
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let u = action.request.url { UIApplication.shared.open(u) }
            return nil
        }

        // ── 웹 알림창을 아이폰 알림창으로 ──
        private func present(_ alert: UIAlertController) {
            guard let root = webView?.window?.rootViewController else { return }
            var top = root
            while let next = top.presentedViewController { top = next }
            top.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler() })
            present(a)
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(false) })
            a.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(true) })
            present(a)
        }

        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                     defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (String?) -> Void) {
            let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
            a.addTextField { $0.text = defaultText }
            a.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(nil) })
            a.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(a.textFields?.first?.text) })
            present(a)
        }

        // 카메라·마이크 권한 요청은 앱 권한으로 처리 (사진 첨부 등)
        @available(iOS 15.0, *)
        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            // 우리 앱 화면(로드플래너 주소)이면 아이폰 권한만 물어보고, 웹 확인 창은 한 번 더 띄우지 않음 (AI 비서 말로 하기)
            let appHost = APP_URL.host ?? ""
            decisionHandler(!appHost.isEmpty && origin.host == appHost ? .grant : .prompt)
        }

        // 네트워크 오류 시 다시 시도 화면
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            // 티맵·전화 등 앱으로 넘긴 경우(취소됨)는 오류가 아니므로 무시하고, 실제 인터넷 오류일 때만 안내
            let ns = error as NSError
            let offline: Set<Int> = [NSURLErrorNotConnectedToInternet, NSURLErrorTimedOut, NSURLErrorCannotFindHost,
                                     NSURLErrorCannotConnectToHost, NSURLErrorNetworkConnectionLost, NSURLErrorDNSLookupFailed]
            guard ns.domain == NSURLErrorDomain, offline.contains(ns.code) else { return }
            let html = """
            <html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head>
            <body style='margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#14123d;color:#fff;font-family:-apple-system'>
            <div style='font-size:20px;font-weight:700'>인터넷 연결을 확인해 주세요</div>
            <div style='margin-top:8px;opacity:.7;font-size:15px'>연결되면 아래 버튼을 눌러 주세요</div>
            <a href='\(APP_URL.absoluteString)' style='margin-top:22px;padding:12px 26px;border-radius:12px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700'>다시 시도</a>
            </body></html>
            """
            webView.loadHTMLString(html, baseURL: nil)
        }
    }
}

// MARK: - Apple 로그인
/// 웹이 { type: "appleLogin", nonce, scopes } 를 보내면 Apple 확인 창을 띄우고,
/// 결과를 window.__rpAppleDone({ idToken, code, name, email } 또는 { error }) 로 돌려줌
final class AppleSignIn: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    weak var webView: WKWebView?

    func start(nonce: String?, wantNameEmail: Bool) {
        let req = ASAuthorizationAppleIDProvider().createRequest()
        if wantNameEmail { req.requestedScopes = [.fullName, .email] }
        if let n = nonce, !n.isEmpty { req.nonce = n }
        let c = ASAuthorizationController(authorizationRequests: [req])
        c.delegate = self
        c.presentationContextProvider = self
        c.performRequests()
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let w = webView?.window { return w }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap { $0.windows }.first { $0.isKeyWindow } ?? scenes.first!.windows.first!
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential else { send(["error": "fail"]); return }
        var r: [String: Any] = [:]
        if let t = cred.identityToken, let s = String(data: t, encoding: .utf8) { r["idToken"] = s }
        if let c = cred.authorizationCode, let s = String(data: c, encoding: .utf8) { r["code"] = s }
        // 한글 이름은 성+이름 붙여서(공진문), 영어 이름은 이름 성 띄워서(Jinmoon Kong)
        let family = cred.fullName?.familyName ?? "", given = cred.fullName?.givenName ?? ""
        let korean = (family + given).range(of: "[가-힣]", options: .regularExpression) != nil
        let name = korean ? family + given : [given, family].filter { !$0.isEmpty }.joined(separator: " ")
        if !name.isEmpty { r["name"] = name }
        if let e = cred.email { r["email"] = e }
        send(r)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let canceled = (error as? ASAuthorizationError)?.code == .canceled
        send(["error": canceled ? "cancel" : "fail"])
    }

    private func send(_ r: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: r),
              let json = String(data: data, encoding: .utf8) else { return }
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript("window.__rpAppleDone && window.__rpAppleDone(\(json))", completionHandler: nil)
        }
    }
}
