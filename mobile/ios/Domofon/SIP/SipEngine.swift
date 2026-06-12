import Foundation
import Combine

enum SipState {
    case idle
    case registering
    case registered
    case registrationFailed(String)
    case ringing(remoteName: String)
    case inCall
}

/// Заглушка под подключение linphonesw.
/// Когда подключите linphonesw (Belledonne SwiftPM), замените тело методов на:
///   - Core init / configure
///   - addAuthInfo + addAccount
///   - acceptCallWithParams / terminateCall
///
/// Для текущей сборки используется как «индикатор состояния SIP» в UI.
/// Реальный приём звонков начнёт работать сразу после интеграции linphonesw.
final class SipEngine: ObservableObject {
    static let shared = SipEngine()

    @Published private(set) var state: SipState = .idle
    @Published private(set) var currentRemote: String?

    func start(credentials: SipCredentials) {
        state = .registering
        // TODO: linphonesw
        //   let core = try Factory.Instance.createCore(...)
        //   let authInfo = try Factory.Instance.createAuthInfo(username: credentials.username,
        //                                                     userid: credentials.username,
        //                                                     passwd: credentials.password,
        //                                                     ha1: nil, realm: nil,
        //                                                     domain: credentials.domain)
        //   core.addAuthInfo(info: authInfo)
        //   let params = try core.createAccountParams()
        //   try params.setIdentityaddress(...); try params.setServeraddress(...)
        //   params.registerEnabled = true
        //   let account = try core.createAccount(params: params)
        //   try core.addAccount(account: account)
        //   try core.start()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.state = .registered
        }
    }

    func stop() {
        // TODO: core.stop()
        state = .idle
        currentRemote = nil
    }

    func answer() {
        // TODO: core.currentCall?.accept()
        state = .inCall
    }

    func decline() {
        // TODO: core.currentCall?.decline(reason: .declined)
        state = .registered
        currentRemote = nil
    }

    func hangup() {
        // TODO: core.currentCall?.terminate()
        state = .registered
        currentRemote = nil
    }

    /// Вызывается из PushService при WebSocket-событии call.incoming —
    /// показываем UI входящего, реальный INVITE придёт по SIP в активном
    /// linphone-Core (после интеграции linphonesw).
    func simulateIncoming(remoteName: String) {
        currentRemote = remoteName
        state = .ringing(remoteName: remoteName)
    }
}
