import SwiftUI
import UserNotifications

// RoadPlanner 아이폰 앱: 웹앱(매니저용)을 앱 안에서 그대로 엽니다.
// + 출발 15분 전 알림 예약 (앱이 꺼져 있어도 폰이 알림)
// + roadplanner://next 주소로 열면 다음 목적지로 바로 길안내 (단축어 자동화용)

let APP_URL = URL(string: "https://ktj8824-stack.github.io/manager-planner-app/")!   // 도메인 바꾸면 여기 한 줄

@main
struct RoadPlannerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate

    var body: some Scene {
        WindowGroup {
            ZStack {
                // 상단 상태바 뒤 배경을 웹앱 헤더 색과 맞춤
                Color(red: 0.173, green: 0.173, blue: 0.180).ignoresSafeArea()
                RoadWebView(url: APP_URL)
                    .ignoresSafeArea(edges: .bottom)
            }
            .onOpenURL { url in Router.shared.handle(url) }   // roadplanner://next
        }
    }
}

// 다른 곳(주소·알림)에서 웹 화면에 "이 주소 열어" 를 전달
final class Router: ObservableObject {
    static let shared = Router()
    @Published var pending: URL? = nil

    func handle(_ url: URL) {
        if url.scheme?.lowercased() == "roadplanner" {
            pending = URL(string: APP_URL.absoluteString + "?go=next")
        } else if url.host == APP_URL.host {
            pending = url
        }
    }
}

// MARK: - 알림
final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
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
