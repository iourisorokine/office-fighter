# Office Fighter

A 90s-style 2D pixel fighting game set in an office. It runs entirely in the browser
(React + TypeScript + Canvas, built with Vite). There is no backend.

## Run it

```bash
npm install
npm run dev          # opens on http://localhost:5173
```

Other scripts:

| command                | what it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run build`        | production build in `dist/`                               |
| `npm run build:single` | the whole game as **one** HTML file in `dist-single/`     |
| `npm run typecheck`    | TypeScript check only                                     |

Dev tool: with `npm run dev` running, open **/sprites.html** to see every pose of every
character side by side (useful when tuning poses).

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes the game on every push to `main`.
One-time setup in the repo: **Settings → Pages → Source: GitHub Actions**.
The build uses relative paths, so it works under `https://<user>.github.io/<repo>/`.

## Controls (player 1)

| key               | action                                        |
| ----------------- | --------------------------------------------- |
| ← →               | walk back / forward                           |
| ↑                 | jump (hold ← or → for a diagonal jump)         |
| ↓                 | crouch                                        |
| X                 | light attack (weapon strike / quick kick)     |
| C                 | heavy attack (crouching = sweep, knocks down) |
| hold back         | block (crouch-block lows, stand-block jump-ins) |
| Esc / P           | pause                                         |
| F2                | show hit boxes (red), hurt boxes (green), projectiles (orange) |

X and C sit at the same place on QWERTY, QWERTZ and AZERTY keyboards.
Directions in special moves are relative to where you face (→ = forward).

## The staff

| fighter   | weapon            | special (press in order)                  | style |
| --------- | ----------------- | ----------------------------------------- | ----- |
| HR LADY   | legal folder, stilettos | **Formal Complaint** `← → X`: opens the folder, a complaint flies into the face | long reach, zoning |
| DEVELOPER | mechanical keyboard | **Incident Declared** `↓ ↓ C`: SEV-1, the office turns red, the opponent loses health (jump to dodge; hit him while he types to cancel it) | slow, tanky, hits hard |
| PRODUCT MANAGER | laptop | **New Requirement** `← → C`: a sticky ticket in the face; scope creep halves the victim's speed for 3 s | quick, annoying |
| ARCHITECT | a whole whiteboard | **Ivory Tower** `↓ ← X`: a shadow marks the opponent's spot, then a stack of API/SVC/DB boxes crashes down (walk out!) | slow, huge reach |
| SALES REP | brick phone       | **Mega Bullshit** `→ → C`: a cloud of pure bullshit blows the opponent (and their projectiles) away | fast, light hits |
| PINGU THE INTERN | none, just kicks | **Coffee Splash** `↓ → X`: throws a hot coffee | eager but weak |
| THE VC (secret boss) | cash, lots of it | **Raise** `↓ ↓ X`: money rains from the ceiling, every bill hurts | big, throws cash constantly |

Each special recharges (gauge under the health bar, "SPECIAL" when ready).
A new, random opponent steps in at every round, and the room is picked at random.
Win the match **2-0** and the VC shows up for a bonus round in the boss's office:
beat him and you're funded (CEO ending); lose and you're still promoted.

## The rooms

| stage         | on the wall |
| ------------- | ----------- |
| Open Space    | MOONSHOT |
| Cafeteria     | WORK HARD, PLAY HARDER |
| Meeting Room  | DREAM BIG · FULL SPEED NO BRAKES |
| Boss's Office | WIN OR DIE |
| Cowork Café   | DO WHAT YOU LOVE (neon) |

## How it's built

```
src/
  App.tsx, ui/            React: title, pause and result screens, scaling
  game/
    Game.ts               bridge React <-> canvas: loop, rendering
    Match.ts              rounds, timer, hit detection, hit-stop, effects
    loop.ts               fixed 60 fps timestep
    input.ts              keyboard -> buttons (physical key codes)
    constants.ts          resolution (384x216), floor, gravity...
    types.ts              Pose, MoveDef, CharacterDef...
    fighter/Fighter.ts    fighter state machine + physics + boxes
    fighter/poses.ts      generic key poses (idle, walk, jump, hit...)
    characters/           one file per fighter (+ common.ts shared kicks, index.ts roster)
    specials.ts           projectiles and the incident
    ai/CpuController.ts   CPU opponent (easy / normal / hard)
    render/puppet.ts      draws a Pose as a pixel sprite, with the character's Look
    render/stages/        the 4 rooms (kit.ts = shared painting helpers)
    render/specialsFx.ts  projectiles, complaint sticker, incident red alert
    render/hud.ts         health bars, timer, announcer
    render/font.ts        5x7 pixel font
    render/effects.ts     hit sparks, dust, shadows
```

Fighters are pixel "puppets": each pose is a few joints (hip, lean, 4 limbs given by
angles or IK targets) that `render/puppet.ts` rasterises into a sprite with a 1-pixel
outline and shading. Sprites are cached. A new character is mostly data: body proportions,
palettes, poses and moves.

Frame data lives in each move (`startup / active / recovery`, damage, hit-stun, block-stun,
push-back, hit level `mid / low / overhead`, hitbox).

## Roadmap

- [x] **Phase 0**: project setup, pixel-perfect canvas, fixed timestep, input
- [x] **Phase 1**: generic fighter, CPU opponent, rounds, HUD, office stage
- [x] **Phase 2**: HR Lady, Developer, Sales Rep with weapons + one special each, character & room select, VS screen, 4 rooms with slogans
- [x] **Phase 3**: Product Manager, Architect, the VC bonus boss, the Cowork Café
- [ ] **Phase 3b**: the Executive and the Accountant
- [ ] **Phase 4**: sound effects and chiptune music, more juice (hit flashes, camera zoom)
- [ ] **Phase 5**: local 2 players, gamepad and touch controls, longer combos
