import SwiftUI
import AVKit

struct CamerasView: View {
    @StateObject private var viewModel = CamerasViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.loading && viewModel.items.isEmpty {
                    ProgressView()
                } else if viewModel.items.isEmpty {
                    ContentUnavailableView(
                        "Нет камер",
                        systemImage: "video.slash",
                        description: Text("Камеры появятся после привязки квартиры")
                    )
                } else {
                    List(viewModel.items) { camera in
                        CameraRow(
                            camera: camera,
                            playingUrl: viewModel.playingId == camera.id ? viewModel.playingUrl : nil,
                            onPlay: { viewModel.play(camera) },
                            onStop: { viewModel.stop() }
                        )
                    }
                    .refreshable { viewModel.refresh() }
                }
            }
            .navigationTitle("Камеры")
            .onAppear { viewModel.refresh() }
            .overlay(alignment: .bottom) {
                if let error = viewModel.error {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .padding(.bottom, 8)
                }
            }
        }
    }
}

private struct CameraRow: View {
    let camera: CameraDto
    let playingUrl: URL?
    let onPlay: () -> Void
    let onStop: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(camera.name)
                .font(.headline)
            Text("\(camera.building.city), \(camera.building.address)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if let url = playingUrl {
                VideoPlayer(player: AVPlayer(url: url))
                    .frame(height: 200)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                Button("Остановить", action: onStop)
                    .buttonStyle(.bordered)
            } else {
                Button("Смотреть", action: onPlay)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    CamerasView()
}
