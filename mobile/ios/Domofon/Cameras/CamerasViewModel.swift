import Foundation

@MainActor
final class CamerasViewModel: ObservableObject {
    @Published var items: [CameraDto] = []
    @Published var loading = false
    @Published var error: String?
    @Published var playingId: String?
    @Published var playingUrl: URL?

    func refresh() {
        Task {
            loading = true
            error = nil
            do {
                items = try await APIClient.shared.cameras()
            } catch {
                self.error = "Не удалось загрузить камеры"
            }
            loading = false
        }
    }

    func play(_ camera: CameraDto) {
        Task {
            do {
                let info = try await APIClient.shared.cameraStream(camera.id)
                playingId = camera.id
                playingUrl = URL(string: info.hlsUrl)
            } catch {
                self.error = "Не удалось получить поток"
            }
        }
    }

    func stop() {
        playingId = nil
        playingUrl = nil
    }
}
