import SwiftUI

struct RootView: View {
    @StateObject private var auth = LoginViewModel()
    @ObservedObject private var sip = SipEngine.shared

    var body: some View {
        ZStack {
            if auth.loggedIn {
                HomeView()
            } else {
                LoginView(viewModel: auth)
            }

            // Поверх — экран звонка (входящий / активный)
            switch sip.state {
            case .ringing(let name):
                IncomingCallView(
                    remoteName: name,
                    onAnswer: { sip.answer() },
                    onDecline: { sip.decline() }
                )
                .transition(.opacity)
            case .inCall:
                InCallView(
                    onOpenDoor: { openFirstDoor() },
                    onHangup: { sip.hangup() }
                )
            default:
                EmptyView()
            }
        }
        .animation(.easeInOut, value: stateKey)
        .onChange(of: auth.loggedIn) { _, loggedIn in
            if loggedIn, let sipCreds = APIClient.shared.sip {
                sip.start(credentials: sipCreds)
                connectSocket()
            }
        }
        .onAppear {
            if auth.loggedIn, let sipCreds = APIClient.shared.sip {
                sip.start(credentials: sipCreds)
                connectSocket()
            }
        }
    }

    private var stateKey: Int {
        switch sip.state {
        case .idle: return 0
        case .registering: return 1
        case .registered: return 2
        case .registrationFailed: return 3
        case .ringing: return 4
        case .inCall: return 5
        }
    }

    private func openFirstDoor() {
        Task {
            if let first = try? await APIClient.shared.intercoms().first {
                _ = try? await APIClient.shared.openDoor(id: first.id)
            }
        }
    }

    private func connectSocket() {
        guard let base = APIClient.shared.baseURL,
              let token = APIClient.shared.token else { return }
        // path /ws сидит на корне сервера, не под /api/v1
        var components = URLComponents(url: base, resolvingAgainstBaseURL: false)
        components?.path = ""
        guard let socketURL = components?.url else { return }

        CallSocket.shared.onIncoming = { _, name in
            sip.simulateIncoming(remoteName: name)
        }
        CallSocket.shared.onEnded = { _ in
            sip.hangup()
        }
        CallSocket.shared.connect(baseURL: socketURL, token: token)
    }
}
