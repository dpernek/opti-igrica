import SwiftUI
import SpriteKit

struct ContentView: View {
    private let scene = GameScene(size: CGSize(width: 1920, height: 1080))

    var body: some View {
        SpriteView(scene: scene, options: [.allowsTransparency])
            .ignoresSafeArea()
            .background(Color.black)
            .onAppear {
                scene.scaleMode = .resizeFill
            }
    }
}
