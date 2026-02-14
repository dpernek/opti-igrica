import AVFoundation

final class GameAudio {
    static let shared = GameAudio()

    private var players: [String: AVAudioPlayer] = [:]
    var soundEnabled = true

    private init() {}

    func preloadVoice(_ name: String) {
        guard players[name] == nil else { return }
        guard let url = Bundle.main.url(forResource: name, withExtension: "mp3") else { return }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.prepareToPlay()
            players[name] = player
        } catch {
            // Ignore missing/invalid voice files.
        }
    }

    func playVoice(_ name: String) {
        guard soundEnabled else { return }
        if players[name] == nil {
            preloadVoice(name)
        }
        guard let player = players[name] else { return }
        player.currentTime = 0
        player.play()
    }
}
