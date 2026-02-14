# JAN: 3D Patrolna Vožnja

Web 3D igra na hrvatskom: JAN vozi kroz veliki grad s Autobotima i rješava probleme građana.

## Tehnologija

- Three.js (`WebGL`)
- GLTF modeli (online)
- Mission gameplay u 3D prostoru
- Third-person vožnja autom kroz grad
- Više tipova misija (građani + incident zone)
- Transformacija svih likova (JAN + 2 Autobota)

## Kontrole

- `W`: gas
- `S`: kočnica / rikverc
- `A D`: skretanje
- `Shift`: ručna kočnica
- `Space`: transformacija svih (JAN + oba Autobota) robot <-> auto
- `E`: rješavanje problema građana

## Modeli (free)

Igra koristi javno dostupne free GLTF modele iz Three.js primjera:

- Ferrari (JAN vozilo): `https://threejs.org/examples/models/gltf/ferrari.glb`
- Soldier (građani): `https://threejs.org/examples/models/gltf/Soldier.glb`
- RobotExpressive (Autoboti): `https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb`

Ako model ne može biti učitan (mreža/CDN), igra automatski prebacuje na lokalne fallback 3D modele i nastavlja bez blokiranja.

## GitHub Pages

Nakon pusha na `main`, stranica je dostupna na:

`https://dpernek.github.io/opti-igrica/`

Ako se stara verzija cacheira, napravi hard refresh (`Cmd+Shift+R`).
