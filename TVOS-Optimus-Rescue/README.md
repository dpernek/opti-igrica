# Optimus Rescue TV (tvOS)

Ovo je native tvOS igra (Apple TV) za Xcode, napravljena u SpriteKit-u.

## Što dobiješ
- Igrivi endless-run stil gameplay
- Optimus (robot) koji hoda
- Transformacija u kamion (`Select` na daljinskom)
- Bumblebee prijatelj koji prati igrača
- Hrvatski UI
- Podrška za hrvatske voice-over datoteke (ako ih dodaš)

## Kontrole (Siri Remote)
- `Swipe Left / Left`: kretanje lijevo
- `Swipe Right / Right`: kretanje desno
- `Select`: transformacija robot <-> kamion
- `Play/Pause`: pauza ili nastavak

## Kako otvoriti u Xcode-u
1. Otvori Xcode
2. `File > New > Project > tvOS App`
3. Name: `OptimusRescueTV`
4. Interface: `Storyboard` ili `SwiftUI` (preporuka: `UIKit App Delegate`, Language `Swift`)
5. Nakon kreiranja projekta, zamijeni sadržaj datotekama iz mape `OptimusRescueTV/`

## Voice-over datoteke (opcionalno)
Dodaj ove `.mp3` u app bundle:
- `optimus-start.mp3`
- `optimus-transform-truck.mp3`
- `optimus-transform-robot.mp3`
- `bumblebee-support.mp3`
- `optimus-citizen-saved.mp3`
- `optimus-win.mp3`
- `optimus-retry.mp3`

Ako datoteke ne postoje, igra radi bez njih (samo efekti i UI poruke).
