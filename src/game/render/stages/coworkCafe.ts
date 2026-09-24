import { VIEW_H, VIEW_W } from '../../constants'
import { drawText } from '../font'
import { disc, dither, FLOOR_TOP, newCanvas, rect, rng, WALL_BOTTOM, type Ctx } from './kit'

/**
 * "The Cowork Café": exposed brick, Edison bulbs, a pink neon sign, baristas
 * behind the espresso bar, coworkers glued to their laptops, a hanging egg
 * chair and a mustard velvet sofa.
 */

const NEON = '#ff4fd8'

function brickWall(ctx: Ctx) {
  rect(ctx, 0, 0, VIEW_W, 14, '#2a2426')
  // exposed ducts
  rect(ctx, 0, 4, VIEW_W, 6, '#8a929a')
  rect(ctx, 0, 4, VIEW_W, 1, '#c8ccd4')
  rect(ctx, 0, 9, VIEW_W, 1, '#5a6068')
  for (let x = 20; x < VIEW_W; x += 60) rect(ctx, x, 3, 3, 8, '#6a7078')
  rect(ctx, 0, 14, VIEW_W, WALL_BOTTOM - 14, '#9a4a36')
  const r = rng(5)
  for (let y = 14; y < WALL_BOTTOM; y += 5) {
    const off = ((y - 14) / 5) % 2 ? 6 : 0
    rect(ctx, 0, y, VIEW_W, 1, '#6e3024')
    for (let x = off; x < VIEW_W; x += 12) {
      rect(ctx, x, y, 1, 5, '#6e3024')
      if (r() > 0.7) rect(ctx, x + 1, y + 1, 11, 4, r() > 0.5 ? '#a8563e' : '#8a4030')
    }
  }
  // whitewashed patch behind the bar
  dither(ctx, 0, 14, 150, WALL_BOTTOM - 14, '#b8a898', 4)
}

function neonSign(ctx: Ctx, cx: number, y: number) {
  const text = 'DO WHAT YOU LOVE'
  // glow: darker copies around the tube
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    drawText(ctx, text, cx + dx, y + dy, { color: '#7a1e6a', align: 'center' })
  }
  drawText(ctx, text, cx, y, { color: NEON, align: 'center' })
  // a little heart after the text
  const hx = cx + 52
  ctx.fillStyle = NEON
  for (const [x, yy] of [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1], [1, 2], [2, 3], [3, 2], [0, 2], [4, 2]]) ctx.fillRect(hx + x, y + yy + 1, 1, 1)
}

function plantHanging(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, 0, 1, y, '#3a3a3a')
  rect(ctx, x - 5, y, 11, 7, '#10101c')
  rect(ctx, x - 4, y + 1, 9, 5, '#e8e0d0')
  for (let i = 0; i < 6; i++) {
    const vx = x - 6 + i * 2 + (i % 2)
    const len = 6 + ((i * 7) % 9)
    for (let j = 0; j < len; j++) rect(ctx, vx + (j % 3 === 0 ? 1 : 0), y + 6 + j, 2, 1, j % 2 ? '#3f8a3f' : '#6cc05a')
  }
}

/** a small background person: standing barista or seated coworker */
function person(
  ctx: Ctx,
  x: number,
  y: number,
  o: { skin: string; hair: string; top: string; apron?: string; beanie?: string; headphones?: boolean; bun?: boolean },
) {
  // torso
  rect(ctx, x - 6, y, 12, 13, '#10101c')
  rect(ctx, x - 5, y + 1, 10, 12, o.top)
  if (o.apron) {
    rect(ctx, x - 4, y + 4, 8, 9, o.apron)
    rect(ctx, x - 2, y + 1, 1, 3, o.apron)
    rect(ctx, x + 1, y + 1, 1, 3, o.apron)
  }
  // head
  disc(ctx, x, y - 5, 5, '#10101c')
  disc(ctx, x, y - 5, 4, o.skin)
  rect(ctx, x - 4, y - 10, 9, 3, o.hair)
  rect(ctx, x - 5, y - 8, 2, 4, o.hair)
  if (o.bun) disc(ctx, x - 1, y - 11, 2, o.hair)
  if (o.beanie) {
    rect(ctx, x - 5, y - 11, 11, 4, o.beanie)
    rect(ctx, x - 1, y - 13, 3, 2, o.beanie)
  }
  if (o.headphones) {
    rect(ctx, x - 5, y - 11, 11, 2, '#2a2a30')
    rect(ctx, x - 6, y - 7, 2, 4, '#e8742a')
    rect(ctx, x + 4, y - 7, 2, 4, '#e8742a')
  }
  rect(ctx, x + 2, y - 5, 1, 1, '#10101c')
}

function espressoBar(ctx: Ctx) {
  const top = 118
  // back shelf with jars and cups
  rect(ctx, 6, 78, 130, 3, '#5a3a22')
  for (let i = 0; i < 9; i++) {
    const jx = 12 + i * 14
    rect(ctx, jx, 68, 8, 10, '#10101c')
    rect(ctx, jx + 1, 69, 6, 9, i % 3 === 0 ? '#e8e0d0' : '#c8d8d0')
    rect(ctx, jx + 1, 73, 6, 5, i % 2 ? '#6b3a1e' : '#3a2a1a')
  }
  // chalk menu
  rect(ctx, 30, 42, 80, 23, '#4a3020')
  rect(ctx, 32, 44, 76, 19, '#23302a')
  drawText(ctx, 'OAT LATTE $7', 70, 45, { color: '#f4f4ee', align: 'center' })
  drawText(ctx, 'COLD BREW $9', 70, 54, { color: '#ffe135', align: 'center' })
  // baristas
  person(ctx, 40, 98, { skin: '#f0c49a', hair: '#3a2418', top: '#2a2a30', apron: '#8a5a3a', beanie: '#d62828' })
  person(ctx, 96, 98, { skin: '#a8704a', hair: '#1a1014', top: '#e8e0d0', apron: '#2a4a3a', bun: true })
  // milk pitcher in a hand
  rect(ctx, 102, 104, 4, 5, '#c8ccd4')
  // counter
  rect(ctx, 0, top, 140, WALL_BOTTOM + 4 - top, '#10101c')
  rect(ctx, 0, top + 1, 139, 4, '#d8d4c8')
  rect(ctx, 0, top + 5, 139, WALL_BOTTOM - top - 2, '#6a4a30')
  for (let x = 6; x < 139; x += 8) rect(ctx, x, top + 7, 4, WALL_BOTTOM - top - 6, '#7a5a3a')
  // chrome espresso machine
  rect(ctx, 56, top - 22, 34, 22, '#10101c')
  rect(ctx, 57, top - 21, 32, 20, '#c8ccd4')
  rect(ctx, 57, top - 21, 32, 3, '#f4f4ee')
  rect(ctx, 60, top - 14, 26, 1, '#8a929a')
  for (const gx of [62, 76]) {
    rect(ctx, gx, top - 8, 8, 3, '#2a2a30')
    rect(ctx, gx + 2, top - 5, 4, 4, '#f4f4ee')
  }
  // pastry dome
  rect(ctx, 110, top - 10, 20, 10, '#10101c')
  rect(ctx, 111, top - 9, 18, 9, '#d8eef4')
  rect(ctx, 114, top - 4, 5, 3, '#e8a84a')
  rect(ctx, 121, top - 4, 5, 3, '#c87a3a')
}

function coworkTable(ctx: Ctx) {
  const top = 124
  // three coworkers glued to their laptops
  person(ctx, 250, 104, { skin: '#f4d0b0', hair: '#e0c050', top: '#5fa04a', headphones: true })
  person(ctx, 290, 104, { skin: '#8a5a3a', hair: '#101014', top: '#e8742a', beanie: '#1f3b8c' })
  person(ctx, 330, 104, { skin: '#f0c49a', hair: '#b0662a', top: '#9fd0f0', bun: true })
  // long high table
  rect(ctx, 224, top, 140, 5, '#10101c')
  rect(ctx, 225, top + 1, 138, 2, '#d8b888')
  rect(ctx, 225, top + 3, 138, 1, '#a88858')
  for (const lx of [232, 356]) rect(ctx, lx, top + 5, 3, WALL_BOTTOM + 4 - top - 5, '#2a2a30')
  // laptops with glowing screens, facing the people (backs to us)
  for (const lx of [244, 284, 324]) {
    rect(ctx, lx, top - 10, 14, 10, '#10101c')
    rect(ctx, lx + 1, top - 9, 12, 9, '#c8ccd4')
    rect(ctx, lx + 6, top - 6, 2, 2, '#f4f4ee')
  }
  // flat whites
  for (const cx of [262, 302, 342]) {
    rect(ctx, cx, top - 4, 5, 4, '#10101c')
    rect(ctx, cx + 1, top - 3, 3, 3, '#f4f4ee')
  }
}

function eggChair(ctx: Ctx, cx: number, top: number) {
  rect(ctx, cx, 12, 1, top - 12, '#2a2a30')
  // rattan shell
  for (let y = 0; y < 34; y++) {
    const t = y / 34
    const half = Math.round(13 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)))
    rect(ctx, cx - half - 1, top + y, half * 2 + 2, 1, '#10101c')
    rect(ctx, cx - half, top + y, half * 2, 1, (y + Math.floor(cx / 3)) % 3 === 0 ? '#b8884a' : '#d8a860')
  }
  // cushion + opening
  disc(ctx, cx + 2, top + 18, 8, '#5a3a22')
  disc(ctx, cx + 2, top + 19, 6, '#f4e8d0')
}

function sofa(ctx: Ctx, x: number, top: number) {
  const w = 64
  rect(ctx, x, top, w, WALL_BOTTOM + 4 - top, '#10101c')
  rect(ctx, x + 1, top + 1, w - 2, 14, '#d8a020')
  rect(ctx, x + 1, top + 15, w - 2, 8, '#b88410')
  rect(ctx, x + 1, top + 23, w - 2, 2, '#8a6210')
  for (let i = 1; i < 3; i++) rect(ctx, x + (w * i) / 3, top + 2, 1, 13, '#b88410')
  rect(ctx, x - 3, top + 8, 6, 17, '#10101c')
  rect(ctx, x - 2, top + 9, 4, 15, '#c89418')
  rect(ctx, x + w - 3, top + 8, 6, 17, '#10101c')
  rect(ctx, x + w - 2, top + 9, 4, 15, '#c89418')
  // cushion
  rect(ctx, x + 8, top + 5, 12, 9, '#1fb8a8')
  rect(ctx, x + 8, top + 5, 12, 1, '#5fd8c8')
}

function monstera(ctx: Ctx, x: number, y: number) {
  const leaves: [number, number, number][] = [
    [0, -26, 7], [-10, -18, 6], [10, -20, 6], [-4, -34, 5], [8, -32, 5], [-13, -30, 4],
  ]
  for (const [dx, dy, r] of leaves) {
    rect(ctx, x, y + dy + r, 1, -dy - r, '#2f6b2f')
    disc(ctx, x + dx, y + dy, r, '#244f24')
    disc(ctx, x + dx, y + dy, r - 1, '#3f8a3f')
    rect(ctx, x + dx - r + 2, y + dy, r, 1, '#244f24')
  }
  rect(ctx, x - 7, y, 15, 12, '#10101c')
  rect(ctx, x - 6, y + 1, 13, 11, '#f4f4ee')
  rect(ctx, x - 6, y + 1, 13, 2, '#d8d4c8')
}

function concreteFloor(ctx: Ctx) {
  const r = rng(77)
  rect(ctx, 0, FLOOR_TOP, VIEW_W, VIEW_H - FLOOR_TOP, '#8a8680')
  for (let i = 0; i < 1100; i++) {
    ctx.fillStyle = r() > 0.5 ? '#97938c' : '#7a766f'
    ctx.fillRect(Math.floor(r() * VIEW_W), FLOOR_TOP + Math.floor(r() * (VIEW_H - FLOOR_TOP)), 1, 1)
  }
  // polished reflection band + expansion joints in perspective
  dither(ctx, 0, FLOOR_TOP + 2, VIEW_W, 4, '#a8a49c')
  ctx.fillStyle = '#6e6a64'
  for (let i = -6; i <= 6; i++) {
    for (let y = FLOOR_TOP; y < VIEW_H; y++) {
      const t = (y - FLOOR_TOP) / (VIEW_H - FLOOR_TOP)
      ctx.fillRect(Math.round(VIEW_W / 2 + i * (34 + t * 44)), y, 1, 1)
    }
  }
  rect(ctx, 0, FLOOR_TOP + 22, VIEW_W, 1, '#6e6a64')
  // round jute rug
  for (let y = -8; y <= 8; y++) {
    for (let x = -60; x <= 60; x++) {
      if ((x * x) / 3600 + (y * y) / 64 <= 1) {
        ctx.fillStyle = (Math.abs(x) + Math.abs(y * 4)) % 12 < 2 ? '#a88858' : '#c8a878'
        ctx.fillRect(250 + x, 200 + y, 1, 1)
      }
    }
  }
}

export function createCoworkCafe(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  brickWall(ctx)
  neonSign(ctx, 232, 38)
  // bike hung on the wall, obviously
  for (const wx of [196, 226]) {
    for (let a = 0; a < 40; a++) {
      const t = (a / 40) * Math.PI * 2
      rect(ctx, Math.round(wx + Math.cos(t) * 9), Math.round(76 + Math.sin(t) * 9), 1, 1, '#10101c')
    }
  }
  rect(ctx, 196, 70, 30, 1, '#e8742a')
  rect(ctx, 206, 66, 2, 10, '#e8742a')
  rect(ctx, 203, 65, 8, 2, '#10101c')
  espressoBar(ctx)
  plantHanging(ctx, 160, 30)
  plantHanging(ctx, 372, 22)
  eggChair(ctx, 176, 96)
  coworkTable(ctx)
  sofa(ctx, 150, 136)
  monstera(ctx, 368, 146)
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 6, '#3a3430')
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 1, '#5a524c')
  concreteFloor(ctx)
  return canvas
}

/** Edison bulbs that glow, a neon that buzzes, and steam from the machine. */
export function cafeAmbient(ctx: Ctx, frame: number) {
  for (const [i, x] of [40, 120, 280, 340].entries()) {
    const len = 18 + (i % 2) * 8
    rect(ctx, x, 10, 1, len, '#1a1a1a')
    const flick = frame % 300 < 4 && i === 2
    rect(ctx, x - 2, 10 + len, 5, 6, flick ? '#8a6a30' : '#ffcf6a')
    rect(ctx, x - 1, 11 + len, 3, 4, flick ? '#6a5020' : '#fff4c0')
    if (!flick) {
      ctx.fillStyle = 'rgba(255, 200, 100, 0.12)'
      ctx.fillRect(x - 7, 6 + len, 15, 14)
    }
  }
  // the neon buzzes off for a moment now and then
  if (frame % 420 < 5) {
    ctx.fillStyle = 'rgba(154, 74, 54, 0.85)'
    ctx.fillRect(180, 36, 110, 11)
  }
  // steam from the espresso machine
  const s = frame % 60
  if (s < 40) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    for (let i = 0; i < 3; i++) ctx.fillRect(66 + i * 6 + ((s + i * 5) % 3), 92 - ((s + i * 13) % 20), 2, 2)
  }
}
