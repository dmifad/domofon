import UIKit
import PushKit
import CallKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    private let voipRegistry = PKPushRegistry(queue: .main)
    let callController = CXCallController()
    let callProvider: CXProvider = {
        let config = CXProviderConfiguration()
        config.supportsVideo = true
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.generic]
        return CXProvider(configuration: config)
    }()

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        voipRegistry.delegate = self
        voipRegistry.desiredPushTypes = [.voIP]
        application.registerForRemoteNotifications()
        return true
    }
}

extension AppDelegate: PKPushRegistryDelegate {
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
        // TODO: POST /devices with voipToken
        _ = token
    }

    func pushRegistry(
        _ registry: PKPushRegistry,
        didReceiveIncomingPushWith payload: PKPushPayload,
        for type: PKPushType,
        completion: @escaping () -> Void
    ) {
        // TODO: start CXCallUpdate via callProvider, start SIP call
        completion()
    }
}
