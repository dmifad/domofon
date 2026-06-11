import SwiftUI
import AVKit

struct ActiveCallView: View {
    let payload: IncomingCallPayload
    @ObservedObject private var sip = SipEngine.shared
    @State private var doorOpened = false

    var body: some View {
        VStack(spacing: 16) {
            Text(payload.intercomName)
                .font(.title.bold())
            Text(payload.buildingAddress)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text(statusText)
                .font(.callout)

            if let preview = payload.previewUrl, let url = URL(string: preview) {
                VideoPlayer(player: AVPlayer(url: url))
                    .frame(height: 260)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            HStack(spacing: 16) {
                Button(doorOpened ? "Дверь открыта" : "Открыть дверь") {
                    Task {
                        _ = try? await APIClient.shared.openDoor(intercomId: payload.intercomId)
                        doorOpened = true
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(doorOpened)

                Button("Завершить", role: .destructive) {
                    CallManager.shared.endCurrentCall()
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(24)
    }

    private var statusText: String {
        switch sip.state {
        case .connecting: return "Соединение…"
        case .connected: return "В разговоре"
        case .ended: return "Завершено"
        default: return ""
        }
    }
}
