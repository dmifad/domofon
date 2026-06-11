import UIKit
import PushKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    private let voipRegistry = PKPushRegistry(queue: .main)

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        _ = CallManager.shared
        voipRegistry.delegate = self
        voipRegistry.desiredPushTypes = [.voIP]
        application.registerForRemoteNotifications()
        return true
    }
}

extension AppDelegate: PKPushRegistryDelegate {
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        let voipToken = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
        guard TokenStore.shared.isLoggedIn else { return }
        Task {
            try? await APIClient.shared.registerDevice(pushToken: voipToken, voipToken: voipToken)
        }
    }

    func pushRegistry(
        _ registry: PKPushRegistry,
        didReceiveIncomingPushWith payload: PKPushPayload,
        for type: PKPushType,
        completion: @escaping () -> Void
    ) {
        // APNs требует репортить входящий звонок до возврата из этого callback,
        // иначе iOS убьёт процесс. Поэтому reportIncomingCall — синхронно,
        // а completion вызывается после.
        guard let callPayload = IncomingCallPayload(payload.dictionaryPayload) else {
            completion()
            return
        }
        CallManager.shared.reportIncomingCall(payload: callPayload) {
            completion()
        }
    }
}
