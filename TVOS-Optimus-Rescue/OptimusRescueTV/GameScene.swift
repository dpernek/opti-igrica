import SpriteKit

final class GameScene: SKScene {
    private var lastUpdateTime: TimeInterval = 0

    private var isGameStarted = false
    private var isGameOver = false
    private var isPausedByUser = false

    private var score = 0
    private var savedCitizens = 0

    private var mode: HeroMode = .robot {
        didSet { updateModeUI() }
    }

    private var laneTargetX: CGFloat = 0

    private let worldNode = SKNode()
    private let roadNodeA = SKShapeNode()
    private let roadNodeB = SKShapeNode()

    private let heroRoot = SKNode()
    private let heroRobot = SKNode()
    private let heroTruck = SKNode()
    private let bumblebee = SKNode()

    private var obstacles: [SKShapeNode] = []
    private var citizens: [SKNode] = []

    private let hudNode = SKNode()
    private let titleLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
    private let statusLabel = SKLabelNode(fontNamed: "AvenirNext-DemiBold")
    private let scoreLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
    private let savedLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
    private let modeLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
    private let helpLabel = SKLabelNode(fontNamed: "AvenirNext-Medium")

    private var swipeStartX: CGFloat?

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.55, green: 0.79, blue: 0.98, alpha: 1)
        anchorPoint = CGPoint(x: 0.5, y: 0.5)

        setupWorld()
        setupHero()
        setupBumblebee()
        setupHUD()
        preloadAudio()
        resetGame()
    }

    override func update(_ currentTime: TimeInterval) {
        guard isGameStarted, !isGameOver, !isPausedByUser else { return }

        let dt: CGFloat
        if lastUpdateTime == 0 {
            dt = 1.0 / 60.0
        } else {
            dt = CGFloat(min(currentTime - lastUpdateTime, 0.033))
        }
        lastUpdateTime = currentTime

        let speed = mode == .robot ? GameConfig.baseRobotSpeed : GameConfig.baseTruckSpeed

        updateRoad(speed: speed, dt: dt)
        updateHero(speed: speed, dt: dt, time: currentTime)
        updateBumblebee(dt: dt, time: currentTime)
        updateObstacles(speed: speed, dt: dt)
        updateCitizens(speed: speed, dt: dt, time: currentTime)

        score += Int(speed * dt * 0.08)
        scoreLabel.text = "Bodovi: \(score)"

        animateHero(mode: mode, time: currentTime)
    }

    override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
        for press in presses {
            switch press.type {
            case .leftArrow:
                startGameIfNeeded()
                laneTargetX -= 180
            case .rightArrow:
                startGameIfNeeded()
                laneTargetX += 180
            case .select:
                startGameIfNeeded()
                toggleTransform()
            case .playPause:
                togglePause()
            default:
                break
            }
        }

        laneTargetX = laneTargetX.clamped(to: -GameConfig.laneLimit...GameConfig.laneLimit)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        swipeStartX = touch.location(in: self).x
        startGameIfNeeded()
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first, let startX = swipeStartX else { return }
        let x = touch.location(in: self).x
        let delta = x - startX

        if abs(delta) > 24 {
            laneTargetX += delta > 0 ? 120 : -120
            laneTargetX = laneTargetX.clamped(to: -GameConfig.laneLimit...GameConfig.laneLimit)
            swipeStartX = x
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        swipeStartX = nil
    }

    private func setupWorld() {
        addChild(worldNode)

        roadNodeA.path = CGPath(rect: CGRect(x: -320, y: -1200, width: 640, height: 1200), transform: nil)
        roadNodeA.fillColor = SKColor(red: 0.17, green: 0.2, blue: 0.26, alpha: 1)
        roadNodeA.strokeColor = .clear
        roadNodeA.position = CGPoint(x: 0, y: -120)

        roadNodeB.path = CGPath(rect: CGRect(x: -320, y: -1200, width: 640, height: 1200), transform: nil)
        roadNodeB.fillColor = roadNodeA.fillColor
        roadNodeB.strokeColor = .clear
        roadNodeB.position = CGPoint(x: 0, y: 1080)

        worldNode.addChild(roadNodeA)
        worldNode.addChild(roadNodeB)

        for i in 0..<36 {
            let line = SKShapeNode(rectOf: CGSize(width: 10, height: 72), cornerRadius: 2)
            line.fillColor = SKColor(red: 0.95, green: 0.84, blue: 0.46, alpha: 1)
            line.strokeColor = .clear
            line.position = CGPoint(x: 0, y: CGFloat(i) * 120 - 1080)
            worldNode.addChild(line)
        }

        for side: CGFloat in [-1, 1] {
            let grass = SKShapeNode(rectOf: CGSize(width: 760, height: 2400))
            grass.fillColor = SKColor(red: 0.33, green: 0.62, blue: 0.34, alpha: 1)
            grass.strokeColor = .clear
            grass.position = CGPoint(x: side * 700, y: 0)
            worldNode.addChild(grass)
        }
    }

    private func setupHero() {
        addChild(heroRoot)
        heroRoot.position = CGPoint(x: 0, y: -320)

        heroRobot.addChild(makeRobotBody(color: .systemRed, secondary: .systemBlue))
        heroTruck.addChild(makeTruckBody())
        heroTruck.isHidden = true

        heroRoot.addChild(heroRobot)
        heroRoot.addChild(heroTruck)
    }

    private func setupBumblebee() {
        addChild(bumblebee)
        bumblebee.position = CGPoint(x: -220, y: -280)
        bumblebee.addChild(makeRobotBody(color: .systemYellow, secondary: .black, scale: 0.72))
    }

    private func setupHUD() {
        addChild(hudNode)

        titleLabel.text = "Optimus spašava grad"
        titleLabel.fontSize = 52
        titleLabel.fontColor = .white
        titleLabel.position = CGPoint(x: -640, y: 470)
        titleLabel.horizontalAlignmentMode = .left

        statusLabel.fontSize = 40
        statusLabel.fontColor = SKColor(red: 0.95, green: 0.98, blue: 1, alpha: 1)
        statusLabel.position = CGPoint(x: 0, y: 430)
        statusLabel.horizontalAlignmentMode = .center

        scoreLabel.fontSize = 36
        scoreLabel.fontColor = .white
        scoreLabel.position = CGPoint(x: 640, y: 470)
        scoreLabel.horizontalAlignmentMode = .right

        savedLabel.fontSize = 34
        savedLabel.fontColor = .white
        savedLabel.position = CGPoint(x: 640, y: 425)
        savedLabel.horizontalAlignmentMode = .right

        modeLabel.fontSize = 34
        modeLabel.fontColor = .white
        modeLabel.position = CGPoint(x: 640, y: 380)
        modeLabel.horizontalAlignmentMode = .right

        helpLabel.text = "Swipe lijevo/desno, Select transformacija, Play/Pause pauza"
        helpLabel.fontSize = 30
        helpLabel.fontColor = SKColor(red: 0.93, green: 0.97, blue: 1, alpha: 0.92)
        helpLabel.position = CGPoint(x: 0, y: -500)

        hudNode.addChild(titleLabel)
        hudNode.addChild(statusLabel)
        hudNode.addChild(scoreLabel)
        hudNode.addChild(savedLabel)
        hudNode.addChild(modeLabel)
        hudNode.addChild(helpLabel)
    }

    private func preloadAudio() {
        [
            "optimus-start",
            "optimus-transform-truck",
            "optimus-transform-robot",
            "bumblebee-support",
            "optimus-citizen-saved",
            "optimus-win",
            "optimus-retry"
        ].forEach { GameAudio.shared.preloadVoice($0) }
    }

    private func resetGame() {
        isGameStarted = false
        isGameOver = false
        isPausedByUser = false
        lastUpdateTime = 0

        score = 0
        savedCitizens = 0
        laneTargetX = 0

        heroRoot.position = CGPoint(x: 0, y: -320)
        bumblebee.position = CGPoint(x: -220, y: -280)

        mode = .robot
        heroRobot.isHidden = false
        heroTruck.isHidden = true

        obstacles.forEach { $0.removeFromParent() }
        obstacles.removeAll()
        citizens.forEach { $0.removeFromParent() }
        citizens.removeAll()

        spawnInitialObstacles()
        spawnInitialCitizens()

        scoreLabel.text = "Bodovi: 0"
        savedLabel.text = "Spašeni: 0/\(GameConfig.citizenTarget)"
        statusLabel.text = "Pritisni Select za početak"
        helpLabel.alpha = 1
    }

    private func startGameIfNeeded() {
        guard !isGameStarted && !isGameOver else { return }
        isGameStarted = true
        statusLabel.text = "Misija je krenula"
        helpLabel.run(.fadeOut(withDuration: 0.25))
        GameAudio.shared.playVoice("optimus-start")
    }

    private func toggleTransform() {
        guard !isGameOver else { return }
        if mode == .robot {
            mode = .truck
            heroRobot.isHidden = true
            heroTruck.isHidden = false
            statusLabel.text = "Transformacija: Kamion"
            GameAudio.shared.playVoice("optimus-transform-truck")
        } else {
            mode = .robot
            heroRobot.isHidden = false
            heroTruck.isHidden = true
            statusLabel.text = "Transformacija: Robot"
            GameAudio.shared.playVoice("optimus-transform-robot")
        }
    }

    private func togglePause() {
        guard isGameStarted, !isGameOver else { return }
        isPausedByUser.toggle()
        statusLabel.text = isPausedByUser ? "Pauza" : "Nastavak"
    }

    private func updateModeUI() {
        modeLabel.text = "Oblik: \(mode.rawValue)"
    }

    private func spawnInitialObstacles() {
        for i in 0..<GameConfig.obstacleCount {
            spawnObstacle(y: CGFloat(i) * 220 + 80)
        }
    }

    private func spawnInitialCitizens() {
        for i in 0..<GameConfig.citizenTarget {
            spawnCitizen(y: CGFloat(i) * 380 + 200)
        }
    }

    private func spawnObstacle(y: CGFloat) {
        let obstacle = SKShapeNode(rectOf: CGSize(width: 90, height: 90), cornerRadius: 16)
        obstacle.fillColor = .systemOrange
        obstacle.strokeColor = .clear
        obstacle.position = CGPoint(
            x: CGFloat.random(in: -GameConfig.laneLimit...GameConfig.laneLimit),
            y: y
        )
        obstacle.zPosition = 20
        worldNode.addChild(obstacle)
        obstacles.append(obstacle)
    }

    private func spawnCitizen(y: CGFloat) {
        let citizen = SKNode()

        let body = SKShapeNode(rectOf: CGSize(width: 48, height: 70), cornerRadius: 14)
        body.fillColor = [.systemTeal, .systemPink, .systemMint, .systemBlue].randomElement() ?? .systemMint
        body.strokeColor = .clear

        let head = SKShapeNode(circleOfRadius: 18)
        head.fillColor = SKColor(red: 1, green: 0.84, blue: 0.72, alpha: 1)
        head.strokeColor = .clear
        head.position.y = 52

        citizen.addChild(body)
        citizen.addChild(head)
        citizen.position = CGPoint(
            x: CGFloat.random(in: -GameConfig.laneLimit...GameConfig.laneLimit),
            y: y
        )
        citizen.zPosition = 18

        worldNode.addChild(citizen)
        citizens.append(citizen)
    }

    private func updateRoad(speed: CGFloat, dt: CGFloat) {
        roadNodeA.position.y -= speed * dt
        roadNodeB.position.y -= speed * dt

        if roadNodeA.position.y < -2280 { roadNodeA.position.y = roadNodeB.position.y + 2400 }
        if roadNodeB.position.y < -2280 { roadNodeB.position.y = roadNodeA.position.y + 2400 }

        worldNode.children.compactMap { $0 as? SKShapeNode }.forEach { line in
            guard line !== roadNodeA, line !== roadNodeB else { return }
            if line.frame.width < 40 {
                line.position.y -= speed * dt
                if line.position.y < -1200 { line.position.y += 4320 }
            }
        }
    }

    private func updateHero(speed: CGFloat, dt: CGFloat, time: TimeInterval) {
        heroRoot.position.x += (laneTargetX - heroRoot.position.x) * min(1, dt * 9)
        heroRoot.position.x = heroRoot.position.x.clamped(to: -GameConfig.laneLimit...GameConfig.laneLimit)

        let bounce = sin(time * (mode == .robot ? 16 : 22))
        heroRoot.position.y = -320 + CGFloat(bounce) * (mode == .robot ? 6 : 3)

        if mode == .truck {
            heroTruck.zRotation = CGFloat(sin(time * 5)) * 0.02
        }

        if speed > 0 && Int(time * 1.4) % 10 == 0 {
            if Int(time * 10) % 97 == 0 {
                GameAudio.shared.playVoice("bumblebee-support")
            }
        }
    }

    private func updateBumblebee(dt: CGFloat, time: TimeInterval) {
        let targetX = heroRoot.position.x - 220
        bumblebee.position.x += (targetX - bumblebee.position.x) * min(1, dt * 4.5)
        bumblebee.position.y = -280 + CGFloat(sin(time * 14)) * 4
    }

    private func updateObstacles(speed: CGFloat, dt: CGFloat) {
        for obstacle in obstacles {
            obstacle.position.y -= speed * dt

            if obstacle.frame.intersects(heroRoot.calculateAccumulatedFrame().insetBy(dx: 24, dy: 20)) {
                endGame(win: false)
                return
            }

            if obstacle.position.y < -760 {
                obstacle.position.y = CGFloat.random(in: 900...1600)
                obstacle.position.x = CGFloat.random(in: -GameConfig.laneLimit...GameConfig.laneLimit)
            }
        }
    }

    private func updateCitizens(speed: CGFloat, dt: CGFloat, time: TimeInterval) {
        for citizen in citizens {
            citizen.position.y -= speed * dt
            citizen.position.y += CGFloat(sin(time * 8)) * 0.3

            if citizen.calculateAccumulatedFrame().intersects(heroRoot.calculateAccumulatedFrame().insetBy(dx: -20, dy: -20)) {
                savedCitizens += 1
                savedLabel.text = "Spašeni: \(savedCitizens)/\(GameConfig.citizenTarget)"
                score += 80
                GameAudio.shared.playVoice("optimus-citizen-saved")

                citizen.position.y = CGFloat.random(in: 1200...2200)
                citizen.position.x = CGFloat.random(in: -GameConfig.laneLimit...GameConfig.laneLimit)

                if savedCitizens >= GameConfig.citizenTarget {
                    endGame(win: true)
                    return
                }
            } else if citizen.position.y < -760 {
                citizen.position.y = CGFloat.random(in: 900...2000)
                citizen.position.x = CGFloat.random(in: -GameConfig.laneLimit...GameConfig.laneLimit)
            }
        }
    }

    private func endGame(win: Bool) {
        guard !isGameOver else { return }
        isGameOver = true

        if win {
            statusLabel.text = "Bravo! Grad je spašen. Select za novu rundu."
            GameAudio.shared.playVoice("optimus-win")
        } else {
            statusLabel.text = "Sudar! Select za pokušaj opet."
            GameAudio.shared.playVoice("optimus-retry")
        }

        let wait = SKAction.wait(forDuration: 0.6)
        run(wait) { [weak self] in
            self?.isGameStarted = false
            self?.isGameOver = false
            self?.resetGame()
        }
    }

    private func animateHero(mode: HeroMode, time: TimeInterval) {
        guard let robotBody = heroRobot.children.first as? SKNode else { return }
        if mode == .robot {
            robotBody.zRotation = CGFloat(sin(time * 6)) * 0.03
        } else {
            robotBody.zRotation = 0
        }
    }

    private func makeRobotBody(color: SKColor, secondary: SKColor, scale: CGFloat = 1.0) -> SKNode {
        let root = SKNode()

        let chest = SKShapeNode(rectOf: CGSize(width: 120 * scale, height: 110 * scale), cornerRadius: 18 * scale)
        chest.fillColor = color
        chest.strokeColor = .clear
        chest.position.y = 96 * scale

        let head = SKShapeNode(rectOf: CGSize(width: 48 * scale, height: 44 * scale), cornerRadius: 8 * scale)
        head.fillColor = secondary
        head.strokeColor = .clear
        head.position.y = 166 * scale

        let legL = SKShapeNode(rectOf: CGSize(width: 42 * scale, height: 90 * scale), cornerRadius: 10 * scale)
        legL.fillColor = secondary
        legL.strokeColor = .clear
        legL.position = CGPoint(x: -24 * scale, y: 15 * scale)

        let legR = legL.copy() as! SKShapeNode
        legR.position.x = 24 * scale

        let armL = SKShapeNode(rectOf: CGSize(width: 34 * scale, height: 78 * scale), cornerRadius: 10 * scale)
        armL.fillColor = color
        armL.strokeColor = .clear
        armL.position = CGPoint(x: -84 * scale, y: 90 * scale)

        let armR = armL.copy() as! SKShapeNode
        armR.position.x = 84 * scale

        root.addChild(chest)
        root.addChild(head)
        root.addChild(legL)
        root.addChild(legR)
        root.addChild(armL)
        root.addChild(armR)

        return root
    }

    private func makeTruckBody() -> SKNode {
        let root = SKNode()

        let trailer = SKShapeNode(rectOf: CGSize(width: 150, height: 120), cornerRadius: 16)
        trailer.fillColor = .systemBlue
        trailer.strokeColor = .clear
        trailer.position = CGPoint(x: 0, y: 86)

        let cab = SKShapeNode(rectOf: CGSize(width: 130, height: 90), cornerRadius: 14)
        cab.fillColor = .systemRed
        cab.strokeColor = .clear
        cab.position = CGPoint(x: 0, y: 164)

        let wheelOffsets: [CGPoint] = [
            CGPoint(x: -58, y: 24), CGPoint(x: 58, y: 24),
            CGPoint(x: -58, y: 118), CGPoint(x: 58, y: 118)
        ]

        for p in wheelOffsets {
            let wheel = SKShapeNode(circleOfRadius: 18)
            wheel.fillColor = .black
            wheel.strokeColor = .clear
            wheel.position = p
            root.addChild(wheel)
        }

        root.addChild(trailer)
        root.addChild(cab)
        return root
    }
}

private extension Comparable {
    func clamped(to limits: ClosedRange<Self>) -> Self {
        min(max(self, limits.lowerBound), limits.upperBound)
    }
}
