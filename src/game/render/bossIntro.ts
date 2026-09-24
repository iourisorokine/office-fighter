import { VIEW_H, VIEW_W } from '../constants'
import { BOSS_INTRO_FRAMES } from '../Match'
import type { CharacterDef, Pose } from '../types'
import { drawText } from './font'
import { closeUpSprite, skeletonOf, SPR_OX, SPR_OY } from './puppet'

/**
 * The VC's entrance: a night skyline, a spotlight, a mountain of cash, and
 * the VC on top of it, drawn at 1.6x resolution with extra details (cigar,
 * gold chain, watch, a glint on the shades). About 5.5 seconds, skippable.
 */

type Ctx = CanvasRenderingContext2D

const K = 1.6
const FEET_X = 262
const FEET_Y = 152

const legs = { nearLeg: { ik: [-10, 2] as [number, number] }, farLeg: { ik: [10, 2] as [number, number] } }

const POSES: Record<'count' | 'raise' | 'point', Pose> = {
  count: { hip: [0, 27], lean: 4, ...legs, nearArm: { ik: [12, 44] }, farArm: { ik: [4, 31] }, prop: { angle: 150 } },
  raise: {
    hip: [0, 28],
    lean: -4,
    head: 10,
    face: 'shout',
    ...legs,
    nearArm: { a: [120, 140] },
    farArm: { a: [165, 178] },
    prop: { angle: 150 },
  },
  point: { hip: [1, 27], lean: 8, head: 4, ...legs, nearArm: { a: [95, 92] }, farArm: { ik: [4, 31] }, prop: { hidden: true } },
}

const spriteCache = new Map<string, HTMLCanvasElement>()
function sprite(char: CharacterDef, key: keyof typeof POSES) {
  const id = `${char.id}|${key}`
  let c = spriteCache.get(id)
  if (!c) {
    c = closeUpSprite(POSES[key], char.body, char.look, char.palettes[0], K)
    spriteCache.set(id, c)
  }
  return c
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function disc(ctx: Ctx, cx: number, cy: number, r: number, c: string) {
  ctx.fillStyle = c
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y))
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1)
  }
}

function skyline(ctx: Ctx) {
  const bands = ['#07041a', '#0e0828', '#170c36', '#241044', '#35144e', '#4a1a52']
  bands.forEach((c, i) => rect(ctx, 0, i * 30, VIEW_W, 30, c))
  rect(ctx, 0, 180, VIEW_W, 36, '#4a1a52')
  // stars + moon
  for (let i = 0; i < 40; i++) rect(ctx, (i * 97) % VIEW_W, (i * 53) % 90, 1, 1, i % 5 ? '#8a7aa8' : '#ffffff')
  disc(ctx, 60, 36, 12, '#f4ecc8')
  disc(ctx, 64, 32, 11, '#07041a')
  // towers with lit windows
  let x = 0
  let i = 0
  while (x < VIEW_W) {
    const w = 18 + ((i * 13) % 22)
    const h = 60 + ((i * 37) % 70)
    rect(ctx, x, VIEW_H - h, w, h, i % 2 ? '#150a26' : '#1c0e30')
    for (let wy = VIEW_H - h + 4; wy < VIEW_H - 4; wy += 6) {
      for (let wx = x + 3; wx < x + w - 3; wx += 5) {
        if ((wx * 7 + wy * 13 + i) % 5 === 0) rect(ctx, wx, wy, 2, 3, '#f4c86a')
      }
    }
    x += w + 2
    i++
  }
}

function spotlight(ctx: Ctx, on: boolean) {
  if (!on) return
  ctx.fillStyle = 'rgba(255, 240, 190, 0.10)'
  ctx.beginPath()
  ctx.moveTo(FEET_X - 8, 0)
  ctx.lineTo(FEET_X + 8, 0)
  ctx.lineTo(FEET_X + 110, VIEW_H)
  ctx.lineTo(FEET_X - 110, VIEW_H)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 240, 190, 0.08)'
  ctx.beginPath()
  ctx.moveTo(FEET_X - 3, 0)
  ctx.lineTo(FEET_X + 3, 0)
  ctx.lineTo(FEET_X + 60, VIEW_H)
  ctx.lineTo(FEET_X - 60, VIEW_H)
  ctx.closePath()
  ctx.fill()
}

/** a mountain of banknote bricks, gold bars and coin stacks */
function cashPile(ctx: Ctx, dy: number, frame: number) {
  const top = FEET_Y + dy
  for (let row = 0; top + row * 6 < VIEW_H + 6; row++) {
    const y = top + row * 6
    const half = 34 + row * 13
    const off = row % 2 ? 7 : 0
    for (let x = FEET_X - half + off; x < FEET_X + half; x += 14) {
      const seed = (x * 31 + row * 17) % 23
      if (seed === 3 && row > 1) {
        // gold bar
        rect(ctx, x, y, 14, 6, '#5a3a08')
        rect(ctx, x + 1, y + 1, 12, 4, '#ffd23c')
        rect(ctx, x + 1, y + 1, 12, 1, '#fff4a8')
        continue
      }
      rect(ctx, x, y, 14, 6, '#123a1a')
      rect(ctx, x + 1, y + 1, 12, 4, seed % 2 ? '#4e9a3e' : '#5fb04a')
      rect(ctx, x + 1, y + 1, 12, 1, '#8ad87a')
      rect(ctx, x + 6, y + 1, 2, 4, seed % 3 ? '#f4f4ee' : '#f4e39a')
    }
  }
  // coin stacks on the slopes
  for (const [cx, cy, n] of [[FEET_X - 60, 178, 4], [FEET_X + 56, 172, 5], [FEET_X - 96, 200, 3], [FEET_X + 100, 198, 4]]) {
    for (let j = 0; j < n; j++) {
      rect(ctx, cx - 6, cy + dy - j * 3, 12, 3, '#5a3a08')
      rect(ctx, cx - 5, cy + dy - j * 3, 10, 2, '#ffd23c')
    }
  }
  // sparkles
  for (let s = 0; s < 6; s++) {
    const phase = (frame + s * 17) % 50
    if (phase > 12) continue
    const sx = FEET_X - 90 + ((s * 67) % 180)
    const sy = top + 10 + ((s * 29) % 50)
    const r = phase < 6 ? phase / 2 : (12 - phase) / 2
    rect(ctx, sx - r, sy, r * 2 + 1, 1, '#ffffff')
    rect(ctx, sx, sy - r, 1, r * 2 + 1, '#ffffff')
  }
}

function fallingBills(ctx: Ctx, t: number) {
  for (let i = 0; i < 22; i++) {
    const speed = 0.6 + (i % 4) * 0.25
    const x = (i * 53 + Math.sin((t + i * 20) * 0.05) * 12 + 400) % VIEW_W
    const y = ((i * 41 + t * speed) % (VIEW_H + 30)) - 20
    const flip = Math.floor((t + i * 3) / 6) % 2
    rect(ctx, x - 1, y - 1, flip ? 9 : 6, flip ? 5 : 7, '#123a1a')
    rect(ctx, x, y, flip ? 7 : 4, flip ? 3 : 5, '#6cc05a')
  }
}

/** sprite-space point (y up, facing right) -> screen, for a sprite facing left */
function toScreen(p: [number, number], dy: number): [number, number] {
  return [FEET_X - p[0] * K, FEET_Y + dy - p[1] * K]
}

function drawVC(ctx: Ctx, char: CharacterDef, t: number, dy: number) {
  const key: keyof typeof POSES = t < 160 ? 'count' : t < 235 ? 'raise' : 'point'
  const img = sprite(char, key)
  // facing left (towards where the player stands)
  ctx.save()
  ctx.translate(FEET_X, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(img, -Math.round(SPR_OX * K), Math.round(FEET_Y + dy - SPR_OY * K))
  ctx.restore()

  const sk = skeletonOf(POSES[key], char.body)
  const r = char.body.headR
  const at = (lx: number, ly: number): [number, number] => [
    sk.head[0] + sk.headFwd[0] * lx + sk.headUp[0] * ly,
    sk.head[1] + sk.headFwd[1] * lx + sk.headUp[1] * ly,
  ]
  // gold chain under the collar
  for (let i = 0; i <= 8; i++) {
    const [x, y] = toScreen([sk.neck[0] + 1 + i * 0.9, sk.neck[1] - 1.5 - Math.pow(i - 4, 2) * -0.12 - 2], dy)
    rect(ctx, x, y, 1, 1, i % 2 ? '#ffd23c' : '#fff4a8')
  }
  // big gold watch on the near wrist
  const wrist = toScreen([sk.nearHand[0] - (sk.nearHand[0] - sk.nearElbow[0]) * 0.18, sk.nearHand[1] - (sk.nearHand[1] - sk.nearElbow[1]) * 0.18], dy)
  rect(ctx, wrist[0] - 2, wrist[1] - 2, 5, 4, '#5a3a08')
  rect(ctx, wrist[0] - 1, wrist[1] - 1, 3, 2, '#ffd23c')
  // cigar with a glowing tip and a trail of smoke
  if (key !== 'raise') {
    const [cx, cy] = toScreen(at(r - 0.5, -4.4), dy)
    rect(ctx, cx - 8, cy - 1, 8, 3, '#1a1020')
    rect(ctx, cx - 7, cy, 7, 1, '#8a5a30')
    rect(ctx, cx - 9, cy - 1, 2, 3, t % 20 < 10 ? '#ff6a1e' : '#ffae1e')
    for (let s = 0; s < 5; s++) {
      const age = (t + s * 9) % 45
      rect(ctx, cx - 9 + Math.sin((age + s) * 0.3) * 3 - age * 0.15, cy - 3 - age * 0.7, 2, 2, `rgba(220, 220, 230, ${0.55 - age / 90})`)
    }
  }
  // a glint travelling across the shades
  const glint = t % 150
  if (glint > 100 && glint < 116) {
    const [gx, gy] = toScreen(at(2 + (glint - 100) * 0.35, 1), dy)
    rect(ctx, gx - 3, gy, 7, 1, '#ffffff')
    rect(ctx, gx, gy - 3, 1, 7, '#ffffff')
  }
}

function typewriter(text: string, t: number, start: number) {
  return text.slice(0, Math.max(0, Math.floor((t - start) / 2)))
}

export function drawBossIntro(ctx: Ctx, t: number, char: CharacterDef, frame: number) {
  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)
  const dy = Math.round(90 * (1 - ease(t / 80)))

  skyline(ctx)
  spotlight(ctx, t > 24 && !(t > 30 && t < 34))
  fallingBills(ctx, t)
  cashPile(ctx, dy, frame)
  drawVC(ctx, char, t, dy)

  // title card slides in from the left
  if (t >= 100) {
    const x = Math.min(14, -220 + (t - 100) * 14)
    rect(ctx, x - 6, 30, 176, 88, 'rgba(8, 6, 20, 0.8)')
    rect(ctx, x - 6, 30, 176, 2, '#ffd23c')
    rect(ctx, x - 6, 116, 176, 2, '#ffd23c')
    drawText(ctx, 'BONUS ROUND', x, 37, { color: '#5fe08a' })
    drawText(ctx, char.name, x, 50, { scale: 4, color: '#ffd23c', outline: '#8e1616' })
    drawText(ctx, 'MANAGING PARTNER', x, 84, { color: '#ffffff' })
    drawText(ctx, 'MOONSHOT CAPITAL', x, 94, { color: '#ffffff' })
    drawText(ctx, 'NET WORTH: $4.2B (ON PAPER)', x, 106, { color: '#9fd0f0' })
  }

  // dialogue box with typewriter text
  if (t >= 170) {
    rect(ctx, 8, 176, VIEW_W - 16, 32, '#10101c')
    rect(ctx, 9, 177, VIEW_W - 18, 30, '#1b1f3a')
    rect(ctx, 9, 177, VIEW_W - 18, 1, '#ffd23c')
    drawText(ctx, typewriter('SO YOU WON 2-0. CUTE.', t, 176), 18, 182, { color: '#ffffff' })
    drawText(ctx, typewriter("LET'S TALK VALUATION.", t, 236), 18, 194, { color: '#ffd23c' })
  }

  if (t > 45 && t < BOSS_INTRO_FRAMES - 20 && frame % 40 < 26) {
    drawText(ctx, 'X / C: SKIP', VIEW_W - 8, 6, { color: '#aab0d0', align: 'right' })
  }

  // fade in from black, flash out to white
  if (t < 26) {
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - t / 26})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
  const out = BOSS_INTRO_FRAMES - 22
  if (t > out) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, (t - out) / 20)})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
}
