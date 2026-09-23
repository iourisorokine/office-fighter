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
| X                 | light kick (stand / crouch / in the air)      |
| C                 | heavy kick (crouching = sweep, knocks down)   |
| hold back         | block (crouch-block lows, stand-block jump-ins) |
| Esc / P           | pause                                         |
| F2                | show hit boxes (red) and hurt boxes (green)   |

X and C sit at the same place on QWERTY, QWERTZ and AZERTY keyboards.

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
    characters/intern.ts  THE INTERN: stats, body, palettes, moves
    ai/CpuController.ts   CPU opponent (easy / normal / hard)
    render/puppet.ts      draws a Pose as a pixel sprite (outline + shading)
    render/stage.ts       the office background
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
- [x] **Phase 1**: generic fighter (walk, jump, crouch, 2 kicks, block, hit, knockdown, KO), CPU opponent, rounds, HUD, office stage
- [ ] **Phase 2**: sound effects and chiptune music, more juice (hit flashes, camera zoom)
- [ ] **Phase 3**: the 5 office characters (HR lady, executive, accountant, sales rep, developer): own look, stats and a signature move
- [ ] **Phase 4**: character select, local 2 players, gamepad support
- [ ] **Phase 5**: special-move motions (e.g. ↓↘→ + kick), combos, touch controls, more stages
