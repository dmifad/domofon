import Foundation
import Combine

enum SipCallState {
    case idle, connecting, connected, ended, error
}

/// Минимальный интерфейс SIP-стека. Реальная реализация — linphone-sdk-swift
/// (linphonesw / Belledonne Communications SDK), подключается отдельным таргетом
/// чтобы не таскать ~80 МБ нативного кода в основной бандл.
///
/// В этом спринте — заглушка для тестирования CallKit без зависимости от железа.
final class SipEngine: ObservableObject {
    static let shared = SipEngine()

    @Published private(set) var state: SipCallState = .idle
    @Published private(set) var currentSipUri: String?

    func answer(sipUri: String) async {
        currentSipUri = sipUri
        state = .connecting
        try? await Task.sleep(nanoseconds: 500_000_000)
        state = .connected
        // TODO: linphone Core.acceptCall
    }

    func hangup() {
        state = .ended
        currentSipUri = nil
        // TODO: linphone Call.terminate
    }
}
