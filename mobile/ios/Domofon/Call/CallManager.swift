import Foundation
import CallKit
import AVFoundation

struct IncomingCallPayload {
    let callId: String
    let intercomId: String
    let intercomName: String
    let sipUri: String
    let buildingAddress: String

    init?(_ dictionary: [AnyHashable: Any]) {
        guard
            let callId = dictionary["callId"] as? String,
            let intercomId = dictionary["intercomId"] as? String,
            let intercomName = dictionary["intercomName"] as? String,
            let sipUri = dictionary["sipUri"] as? String,
            let buildingAddress = dictionary["buildingAddress"] as? String
        else { return nil }
        self.callId = callId
        self.intercomId = intercomId
        self.intercomName = intercomName
        self.sipUri = sipUri
        self.buildingAddress = buildingAddress
    }
}

/// Связывает PushKit, CallKit и SIP-стек.
final class CallManager: NSObject {
    static let shared = CallManager()

    let provider: CXProvider
    let controller = CXCallController()

    private var activePayload: IncomingCallPayload?
    private var activeCallUuid: UUID?

    private override init() {
        let config = CXProviderConfiguration()
        config.supportsVideo = true
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.generic]
        config.iconTemplateImageData = nil
        self.provider = CXProvider(configuration: config)
        super.init()
        provider.setDelegate(self, queue: nil)
    }

    func reportIncomingCall(payload: IncomingCallPayload, completion: @escaping () -> Void) {
        let uuid = UUID()
        activeCallUuid = uuid
        activePayload = payload

        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: payload.intercomName)
        update.hasVideo = true
        update.supportsHolding = false
        update.supportsGrouping = false
        update.supportsUngrouping = false
        update.supportsDTMF = false
        update.localizedCallerName = payload.intercomName

        provider.reportNewIncomingCall(with: uuid, update: update) { error in
            if let error = error {
                NSLog("CallKit reportNewIncomingCall failed: \(error)")
            }
            completion()
        }
    }

    func endCurrentCall() {
        guard let uuid = activeCallUuid else { return }
        let end = CXEndCallAction(call: uuid)
        controller.requestTransaction(with: end) { _ in }
    }
}

extension CallManager: CXProviderDelegate {
    func providerDidReset(_ provider: CXProvider) {
        SipEngine.shared.hangup()
        activeCallUuid = nil
        activePayload = nil
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        guard let payload = activePayload else {
            action.fail()
            return
        }
        Task {
            try? await APIClient.shared.answerCall(payload.callId)
            await SipEngine.shared.answer(sipUri: payload.sipUri)
            action.fulfill()
        }
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        if let payload = activePayload {
            Task { try? await APIClient.shared.declineCall(payload.callId) }
        }
        SipEngine.shared.hangup()
        activeCallUuid = nil
        activePayload = nil
        action.fulfill()
    }

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        // SIP-стек выйдет в звуковую сессию после accept.
    }
}
