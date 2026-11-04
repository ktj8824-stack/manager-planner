// 로드플래너 아이폰 앱 — 웹앱 화면 + 출발 알림 예약 + roadplanner://next
// 맥의 Xcode 프로젝트(바탕화면 RoadPlanner)에 넣어 쓰는 파일입니다. (기존 웹뷰 코드를 이것으로 교체)
//
// 필요한 Info.plist 항목 (README.md 참고)
//  - CFBundleURLTypes: roadplanner
//  - NSLocationWhenInUseUsageDescription: 이동 중 도착 예상 시간을 계산하려고 현재 위치를 사용합니다.

import SwiftUI
import WebKit
import UserNotifications

let APP_URL = URL(string: "https://ktj8824-stack.github.io/manager-planner-app/")!   // 도메인 바꾸면 여기 한 줄

// MARK: - 앱 진입점
@main
struct RoadPlannerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var router = Router.shared

    var body: some Scene {
        WindowGroup {
            WebScreen(router: router)
                .ignoresSafeArea(.container, edges: .bottom)
                .onOpenURL { url in router.handle(url) }      // roadplanner://next
        }
    }
}

// 다른 곳(주소·알림)에서 웹뷰에 "이 주소 열어" 를 전달
final class Router: ObservableObject {
    static let shared = Router()
    @Published var pending: URL? = nil

    func handle(_ url: URL) {
        if url.scheme == "roadplanner" {
            pending = URL(string: APP_URL.absoluteString + "?go=next")
        } else if url.absoluteString.hasPrefix(APP_URL.absoluteString) {
            pending = url
        }
    }
}

// MARK: - 알림 (출발 15분 전)
final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }
    // 앱을 보고 있을 때도 배너 표시
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .list])
    }
    // 알림을 누르면 그 주소(?go=next → 바로 길안내)로
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        if let s = response.notification.request.content.userInfo["url"] as? String, let u = URL(string: s) {
            DispatchQueue.main.async { Router.shared.handle(u) }
        }
        completionHandler()
    }
}

enum Reminders {
    static let prefix = "rp-dep-"

    // 웹이 넘긴 목록으로 예약을 통째로 바꿈: [{ id, fireAt(ISO), title, body, url }]
    static func replaceAll(_ items: [[String: Any]]) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            center.getPendingNotificationRequests { reqs in
                center.removePendingNotificationRequests(withIdentifiers: reqs.map { $0.identifier }.filter { $0.hasPrefix(prefix) })
                let iso = ISO8601DateFormatter()
                iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let iso2 = ISO8601DateFormatter()
                for item in items.prefix(40) {
                    guard let id = item["id"] as? String, let at = item["fireAt"] as? String,
                          let date = iso.date(from: at) ?? iso2.date(from: at), date > Date() else { continue }
                    let content = UNMutableNotificationContent()
                    content.title = (item["title"] as? String) ?? "출발 알림"
                    content.body = (item["body"] as? String) ?? ""
                    content.sound = .default
                    content.userInfo = ["url": (item["url"] as? String) ?? APP_URL.absoluteString]
                    if #available(iOS 15.0, *) { content.interruptionLevel = .timeSensitive }
                    let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
                    let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
                    center.add(UNNotificationRequest(identifier: prefix + id, content: content, trigger: trigger))
                }
            }
        }
    }
}

// MARK: - 웹 화면
struct WebScreen: UIViewRepresentable {
    @ObservedObject var router: Router

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.websiteDataStore = .default()
        let ucc = WKUserContentController()
        ucc.add(context.coordinator, name: "roadplanner")          // window.webkit.messageHandlers.roadplanner
        // 확대 방지 (입력칸 누를 때 화면이 커지는 문제)
        let noZoom = "var m=document.querySelector('meta[name=viewport]');if(m){m.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';}"
        ucc.addUserScript(WKUserScript(source: noZoom, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        config.userContentController = ucc

        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.allowsBackForwardNavigationGestures = true
        web.scrollView.bounces = false
        web.scrollView.pinchGestureRecognizer?.isEnabled = false
        web.customUserAgent = nil
        if #available(iOS 16.4, *) { web.isInspectable = true }
        context.coordinator.web = web
        web.load(URLRequest(url: router.pending ?? APP_URL))
        router.pending = nil
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {
        if let url = router.pending {
            DispatchQueue.main.async { router.pending = nil }
            web.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        weak var web: WKWebView?

        // 웹 → 앱: 출발 알림 목록
        func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
            if type == "reminders", let items = body["items"] as? [[String: Any]] { Reminders.replaceAll(items) }
        }

        // 앱 주소는 안에서, 티맵·카카오·전화·다른 사이트는 밖에서
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url, let scheme = url.scheme?.lowercased() else { decisionHandler(.allow); return }
            if scheme == "http" || scheme == "https" {
                if url.host == APP_URL.host || action.targetFrame?.isMainFrame == false { decisionHandler(.allow); return }
                if action.navigationType == .linkActivated || action.targetFrame == nil {
                    UIApplication.shared.open(url); decisionHandler(.cancel); return
                }
                decisionHandler(.allow); return
            }
            if scheme == "about" || scheme == "blob" || scheme == "data" { decisionHandler(.allow); return }
            // tmap://, kakaomap://, kakaonavi-sdk://, tel:, sms:, itms-apps:// 등
            UIApplication.shared.open(url, options: [:]) { ok in
                if !ok, let store = Coordinator.storeURL(for: scheme) { UIApplication.shared.open(store) }
            }
            decisionHandler(.cancel)
        }

        static func storeURL(for scheme: String) -> URL? {
            switch scheme {
            case "tmap": return URL(string: "itms-apps://apps.apple.com/kr/app/id431589174")
            case "kakaomap": return URL(string: "itms-apps://apps.apple.com/kr/app/id304608425")
            case "kakaonavi", "kakaonavi-sdk": return URL(string: "itms-apps://apps.apple.com/kr/app/id417698849")
            default: return nil
            }
        }

        // target=_blank 링크
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url {
                if url.host == APP_URL.host { webView.load(action.request) } else { UIApplication.shared.open(url) }
            }
            return nil
        }

        // alert / confirm / prompt (현장 메모 입력 등에 필요)
        private func top() -> UIViewController? {
            UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first?.rootViewController
        }
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler() })
            top()?.present(a, animated: true) ?? completionHandler()
        }
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(false) })
            a.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(true) })
            top()?.present(a, animated: true) ?? completionHandler(false)
        }
        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
            let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
            a.addTextField { $0.text = defaultText }
            a.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(nil) })
            a.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(a.textFields?.first?.text) })
            top()?.present(a, animated: true) ?? completionHandler(nil)
        }
    }
}
