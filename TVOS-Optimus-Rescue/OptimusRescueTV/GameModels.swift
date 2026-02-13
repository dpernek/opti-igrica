import Foundation

enum HeroMode: String {
    case robot = "Robot"
    case truck = "Kamion"
}

struct GameConfig {
    static let laneLimit: CGFloat = 520
    static let baseRobotSpeed: CGFloat = 460
    static let baseTruckSpeed: CGFloat = 620
    static let obstacleCount = 14
    static let citizenTarget = 8
}
