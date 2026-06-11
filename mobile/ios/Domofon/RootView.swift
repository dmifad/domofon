import SwiftUI

struct RootView: View {
    @StateObject private var auth = AuthViewModel()
    @ObservedObject private var callManager = CallManager.shared

    var body: some View {
        if auth.loggedIn {
            TabView {
                IntercomsView()
                    .tabItem { Label("Дом", systemImage: "house.fill") }
                CamerasView()
                    .tabItem { Label("Камеры", systemImage: "video.fill") }
                EventsView()
                    .tabItem { Label("События", systemImage: "clock.fill") }
                BillingView()
                    .tabItem { Label("ЖКХ", systemImage: "creditcard.fill") }
                ChatView()
                    .tabItem { Label("Чат", systemImage: "bubble.left.fill") }
            }
            .fullScreenCover(item: Binding(
                get: { callManager.answeredCall.map(ActiveCallItem.init) },
                set: { if $0 == nil { callManager.answeredCall = nil } }
            )) { item in
                ActiveCallView(payload: item.payload)
            }
        } else {
            LoginView(viewModel: auth)
        }
    }
}

private struct ActiveCallItem: Identifiable {
    let payload: IncomingCallPayload
    var id: String { payload.callId }
}

#Preview {
    RootView()
}
