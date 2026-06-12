import SwiftUI
import UIKit
import MobileVLCKit

/// VLCKit-плеер для RTSP-потока панели DNAKE.
/// AVPlayer не умеет RTSP, поэтому используем VLC.
struct RTSPPlayer: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> UIView {
        let container = UIView()
        container.backgroundColor = .black

        let player = VLCMediaPlayer()
        let media = VLCMedia(url: url)
        media.addOptions([
            "network-caching": 200,
            "rtsp-tcp": "true"
        ])
        player.media = media
        player.drawable = container
        player.play()
        context.coordinator.player = player
        return container
    }

    func updateUIView(_ uiView: UIView, context: Context) {}

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        coordinator.player?.stop()
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator {
        var player: VLCMediaPlayer?
    }
}
