import Foundation
import SocketIO

/// Socket.IO-клиент для получения событий звонков с backend (`/ws`).
/// На iOS у нас нет VoIP-push в этой сборке, поэтому события приходят
/// по WebSocket, пока приложение активно.
final class CallSocket {
    static let shared = CallSocket()

    private var manager: SocketManager?
    private var socket: SocketIOClient?

    var onIncoming: ((_ callId: String, _ intercomName: String) -> Void)?
    var onEnded: ((_ callId: String) -> Void)?

    func connect(baseURL: URL, token: String) {
        manager = SocketManager(
            socketURL: baseURL,
            config: [
                .log(false),
                .compress,
                .path("/ws"),
                .connectParams(["token": token]),
                .reconnects(true)
            ]
        )
        socket = manager?.defaultSocket
        socket?.on("call") { data, _ in
            guard let payload = data.first as? [String: Any],
                  let type = payload["type"] as? String,
                  let callId = payload["callId"] as? String else { return }
            switch type {
            case "call.incoming":
                let name = (payload["intercomName"] as? String) ?? "Домофон"
                self.onIncoming?(callId, name)
            case "call.ended":
                self.onEnded?(callId)
            default: break
            }
        }
        socket?.connect()
    }

    func disconnect() {
        socket?.disconnect()
        socket = nil
        manager = nil
    }
}
