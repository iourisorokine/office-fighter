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
| SALES REP | brick phone       | **Mega Bullshit** `→ → C`: a cloud of pure bullshit from his mouth blows the opponent (and their projectiles) away | fast, light hits |
| INTERN    | none, just kicks  | **Coffee Splash** `↓ → X`: throws a hot coffee | all-rounder |

Each special recharges (gauge under the health bar, "SPECIAL" when ready).

## The rooms

| stage         | on the wall |
| ------------- | ----------- |
| Open Space    | MOONSHOT |
| Cafeteria     | WORK HARD, PLAY HARDER |
| Meeting Room  | DREAM BIG · FULL SPEED NO BRAKES |
| Boss's Office | WIN OR DIE |

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
- [ ] **Phase 3**: the Executive and the Accountant
- [ ] **Phase 4**: sound effects and chiptune music, more juice (hit flashes, camera zoom)
- [ ] **Phase 5**: local 2 players, gamepad and touch controls, longer combos
