# LAKSHMANA VS INDRAJIT (ANCESTRA)

A 3D battle game built with Three.js r147. Five stages: the Opening Exchange, the Celestial Weapons,
the Warrior's Challenge, the Final Confrontation (a free duel of arrows) and the Fall of Indrajit.

## Run it
- Open `index.html` in a modern desktop or mobile browser. It is one self-contained file and needs no server.
  (Fonts load from Google Fonts when online; the game falls back to system serif fonts offline.)
- `dev.html` loads the same game from the separate files in `lib/` and `src/`. Edit the files in `src/`
  and reload `dev.html`. Browsers allow this from `file://`, but a local server also works.
- Needs WebGL. If the screen is black, turn on hardware acceleration in your browser.

## Controls
- Pointer: aim. Click, hold or Space: shoot. W / S (or arrow keys): sidestep and move between ranks.
- Astra dock on the right (keys 1 to 6): Varuna, Garuda, Surya, Vayavya, Agneya, Aindra.
- Stage II: Agneya is answered by Varuna (1), Naga by Garuda (2), Tamasa by Surya (3).

## Files
- `src/01-engine.js` renderer, bloom and colour grade, sky, lights, camera, particles, audio
- `src/02-world-forest.js` terrain, forest, undergrowth, sunbeams, debris
- `src/03-characters.js` Lakshmana, Indrajit and Vibhishana, bows, chariot and horses
- `src/04-effects-astras.js` arrows, every astra, lightning, shockwaves
- `src/05-game-state-ui-briefings.js` stage flow, HUD, astra dock, briefing cards, input, main loop
- `src/06-stages-1-to-3.js` stages I to III
- `src/07-final-duel-and-fall.js` stages IV (final duel) and V (the fall)
- `LakshmanaVsIndrajitGame.jsx` and `.css`: a small React wrapper for your ANCESTRA app. It shows the game in
  a full-screen iframe with an exit button. Put this folder in `public/games/lakshmana-vs-indrajit/`.

Three.js is MIT licensed (https://github.com/mrdoob/three.js).

## ANCESTRA integration (no public folder needed)
Keep this whole folder at `src/pages/Ramayana/interactions/lakshmana-vs-indrajit/`.
`LakshmanaVsIndrajitGame.jsx` imports `./index.html?raw` and renders it with iframe `srcDoc` (Vite).
