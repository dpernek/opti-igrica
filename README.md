# JAN: 3D Čuvar Mega Grada

Web 3D igra na hrvatskom: JAN patrolira velikim gradom s Autobotima i rješava probleme građana.

## Tehnologija

- Three.js (`WebGL`)
- GLTF modeli (online)
- Mission gameplay u 3D prostoru

## Kontrole

- `W A S D` ili strelice: kretanje
- `Shift`: sprint
- `E`: rješavanje problema građana
- miš: rotacija kamere

## Modeli (free)

Igra koristi javno dostupne free GLTF modele iz Three.js primjera:

- Soldier (JAN): `https://threejs.org/examples/models/gltf/Soldier.glb`
- RobotExpressive (Autoboti): `https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb`

Ako model ne može biti učitan (mreža/CDN), igra automatski prebacuje na lokalne fallback 3D modele i nastavlja bez blokiranja.

## GitHub Pages

Nakon pusha na `main`, stranica je dostupna na:

`https://dpernek.github.io/opti-igrica/`

Ako se stara verzija cacheira, napravi hard refresh (`Cmd+Shift+R`).
