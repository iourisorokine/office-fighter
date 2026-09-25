import { VIEW_H, VIEW_W } from '../../constants'
import { drawText } from '../font'
import { CEIL_H, dither, drawBanner, drawMug, FLOOR_TOP, newCanvas, rect, rng, WALL_BOTTOM, type Ctx } from './kit'

/**
 * "The Server Room": cold air, humming racks, blinking LEDs, a raised floor,
 * and MOVE FAST AND BREAK THINGS over the door. The developer's home turf.
 */

const RACK_Y = 30
const RACK_H = WALL_BOTTOM - RACK_Y
const RACK_W = 34
/** x of every rack on the back wall (a gap in the middle for the door) */
const RACKS = [8, 46, 84, 122, 228, 266, 304, 342]

interface Led {
  x: number
  y: number
  color: string
  period: number
  phase: number
}

/** LED positions are fixed (seeded), the blinking is done every frame in `serverAmbient`. */
const LEDS: Led[] = (() => {
  const r = rng(404)
  const out: Led[] = []
  for (const rx of RACKS) {
    for (let y = RACK_Y + 8; y < RACK_Y + RACK_H - 10; y += 6) {
      if (r() < 0.25) continue
      const c = r()
      out.push({
        x: rx + RACK_W - 7 - Math.floor(r() * 3) * 2,
        y: y + 2,
        color: c < 0.7 ? '#5fe08a' : c < 0.9 ? '#ffb02a' : '#4ab8ff',
        period: 12 + Math.floor(r() * 50),
        phase: Math.floor(r() * 60),
      })
    }
  }
  return out
})()

function rack(ctx: Ctx, x: number, seed: number) {
  const r = rng(seed)
  rect(ctx, x, RACK_Y, RACK_W, RACK_H, '#0a0c12')
  rect(ctx, x + 1, RACK_Y + 1, RACK_W - 2, RACK_H - 2, '#1c212c')
  rect(ctx, x + 1, RACK_Y + 1, RACK_W - 2, 4, '#2a3140')
  drawText(ctx, `R${Math.floor(seed % 90) + 10}`, x + 3, RACK_Y + 1, { color: '#6a7488' })
  // 1U / 2U servers
  for (let y = RACK_Y + 7; y < RACK_Y + RACK_H - 8; ) {
    const u = r() < 0.7 ? 6 : 12
    const empty = r() < 0.08
    if (!empty) {
      rect(ctx, x + 3, y, RACK_W - 6, u - 1, '#3a4252')
      rect(ctx, x + 3, y, RACK_W - 6, 1, '#56607a')
      // vents
      ctx.fillStyle = '#262c38'
      for (let vx = x + 5; vx < x + RACK_W - 12; vx += 2) ctx.fillRect(vx, y + 2, 1, u - 4)
    } else {
      rect(ctx, x + 3, y, RACK_W - 6, u - 1, '#10131a')
    }
    y += u
  }
  // cable spaghetti at the bottom
  ctx.fillStyle = '#3a7bd5'
  for (let i = 0; i < 10; i++) ctx.fillRect(x + 4 + Math.floor(r() * (RACK_W - 8)), RACK_Y + RACK_H - 8 + Math.floor(r() * 5), 2, 1)
  ctx.fillStyle = '#d6c040'
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 4 + Math.floor(r() * (RACK_W - 8)), RACK_Y + RACK_H - 8 + Math.floor(r() * 5), 2, 1)
}

function ceiling(ctx: Ctx) {
  rect(ctx, 0, 0, VIEW_W, CEIL_H, '#12151d')
  // cable tray running across the room
  rect(ctx, 0, 9, VIEW_W, 4, '#4a5060')
  rect(ctx, 0, 9, VIEW_W, 1, '#6a7284')
  for (let x = 4; x < VIEW_W; x += 12) rect(ctx, x, 9, 1, 4, '#2a2e38')
  // cables drooping from the tray
  const cols = ['#3a7bd5', '#d6c040', '#d62828', '#5fe08a']
  cols.forEach((c, i) => {
    ctx.fillStyle = c
    const x0 = 150 + i * 6
    for (let t = 0; t <= 40; t++) {
      const x = x0 + t
      const y = 13 + Math.round(Math.sin((t / 40) * Math.PI) * (8 + i * 2))
      ctx.fillRect(x, y, 1, 1)
    }
  })
  // cold LED strips
  for (const x of [30, 250]) {
    rect(ctx, x, 3, 100, 3, '#9fe8ff')
    rect(ctx, x, 3, 100, 1, '#e8fbff')
  }
}

function door(ctx: Ctx) {
  const x = 166
  const w = 52
  rect(ctx, x - 3, 40, w + 6, WALL_BOTTOM - 40, '#3a4252')
  rect(ctx, x, 44, w, WALL_BOTTOM - 44, '#262c38')
  // glass pane with the corridor glowing behind it
  rect(ctx, x + 8, 54, w - 16, 44, '#0a0c12')
  rect(ctx, x + 9, 55, w - 18, 42, '#2a4a5a')
  dither(ctx, x + 9, 55, w - 18, 42, '#34606e')
  rect(ctx, x + 9, 55, 4, 42, '#4a7a88')
  // badge reader + push bar
  rect(ctx, x + w + 6, 96, 7, 11, '#10131a')
  rect(ctx, x + w + 8, 99, 3, 2, '#d62828')
  rect(ctx, x + 6, 110, w - 12, 3, '#8a92a4')
  // warning sign
  rect(ctx, x + 6, 118, w - 12, 18, '#ffd23c')
  rect(ctx, x + 7, 119, w - 14, 16, '#10101c')
  drawText(ctx, 'NO', x + w / 2, 121, { color: '#ffd23c', align: 'center' })
  drawText(ctx, 'ENTRY', x + w / 2, 128, { color: '#ffd23c', align: 'center' })
}

function crashCart(ctx: Ctx) {
  // crash cart with a terminal and a mug
  const x = 116
  const y = 128
  rect(ctx, x, y, 44, 4, '#8a92a4')
  rect(ctx, x + 2, y + 4, 2, WALL_BOTTOM + 4 - y - 4, '#4a5060')
  rect(ctx, x + 40, y + 4, 2, WALL_BOTTOM + 4 - y - 4, '#4a5060')
  rect(ctx, x + 4, y - 22, 26, 22, '#10131a')
  rect(ctx, x + 6, y - 20, 22, 16, '#062010')
  ctx.fillStyle = '#5fe08a'
  const lines = [14, 8, 18, 6, 11]
  lines.forEach((len, i) => ctx.fillRect(x + 8, y - 18 + i * 3, len, 1))
  rect(ctx, x + 8, y - 3, 4, 1, '#5fe08a')
  drawMug(ctx, x + 33, y - 7, '#f4f4ee')
}

function extinguisher(ctx: Ctx, x: number) {
  rect(ctx, x, 120, 8, 30, '#8a1010')
  rect(ctx, x + 1, 121, 6, 28, '#d62828')
  rect(ctx, x + 2, 122, 1, 26, '#ff6a5a')
  rect(ctx, x + 2, 114, 4, 6, '#2a2a2e')
  rect(ctx, x + 6, 115, 5, 2, '#2a2a2e')
}

/** raised-floor tiles in perspective, a few of them perforated */
function raisedFloor(ctx: Ctx) {
  const H = VIEW_H - FLOOR_TOP
  for (let y = FLOOR_TOP; y < VIEW_H; y++) {
    const t = (y - FLOOR_TOP + 1) / H
    const depth = 1 / (t + 0.35)
    const row = Math.floor(depth * 3.2)
    const rowEdge = Math.floor(depth * 3.2 + 0.05) !== row
    const tile = 18 + t * 36
    for (let x = 0; x < VIEW_W; x++) {
      const u = (x - VIEW_W / 2) / tile + 100
      const col = Math.floor(u)
      const colEdge = u - col < 0.04
      const perforated = (row * 7 + col * 3) % 5 === 0
      let c = (row + col) % 2 ? '#8f98a8' : '#98a1b0'
      if (perforated && (x + y) % 2 === 0) c = '#5a6272'
      if (rowEdge || colEdge) c = '#5a6272'
      ctx.fillStyle = c
      ctx.fillRect(x, y, 1, 1)
    }
  }
  dither(ctx, 0, FLOOR_TOP, VIEW_W, 4, '#1c212c')
}

export function createServerRoom(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  ceiling(ctx)
  rect(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#1a1f2a')
  dither(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#1e2430', 4)
  RACKS.forEach((x, i) => rack(ctx, x, 31 + i * 17))
  door(ctx)
  crashCart(ctx)
  extinguisher(ctx, 222)
  drawBanner(ctx, VIEW_W / 2, 30, 'MOVE FAST AND BREAK THINGS', '#10131a', '#5fe08a')
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 6, '#0a0c12')
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 1, '#3a4252')
  raisedFloor(ctx)
  return canvas
}

/** Every LED blinks at its own pace; now and then a whole rack flashes amber. */
export function serverAmbient(ctx: Ctx, frame: number) {
  for (const l of LEDS) {
    const on = (frame + l.phase) % l.period < l.period * 0.6
    ctx.fillStyle = on ? l.color : '#262c38'
    ctx.fillRect(l.x, l.y, 2, 1)
  }
  // a busy disk: fast flicker on one rack
  const busy = RACKS[(Math.floor(frame / 180) * 3) % RACKS.length]
  if (frame % 4 < 2) {
    ctx.fillStyle = '#ffb02a'
    ctx.fillRect(busy + 5, RACK_Y + 9, 2, 1)
    ctx.fillRect(busy + 5, RACK_Y + 15, 2, 1)
  }
}
