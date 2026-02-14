# JAN: Čuvar Mega Grada

Web igra na hrvatskom u kojoj JAN s Transformerima i Autobotima patrolira gradom i pomaže građanima.

## Lokalno pokretanje

1. Otvori `index.html` u pregledniku.
2. Kontrole:
   - `W A S D` ili strelice: kretanje
   - `Shift`: sprint
   - `E`: rješavanje problema građana

## Objavi na GitHub Pages

1. Kreiraj novi repo na GitHubu (npr. `jan-transformers-game`).
2. U terminalu u ovoj mapi pokreni:

```bash
git init
git add .
git commit -m "Inicijalna verzija igre JAN"
git branch -M main
git remote add origin https://github.com/TVOJ_USERNAME/jan-transformers-game.git
git push -u origin main
```

3. Na GitHubu otvori `Settings > Pages`.
4. Pod `Build and deployment` odaberi:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` i `/ (root)`
5. Spremi i pričekaj 1-2 minute.

Link igre će biti:

`https://TVOJ_USERNAME.github.io/jan-transformers-game/`

