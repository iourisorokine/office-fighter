import { VIEW_H, VIEW_W } from '../constants'
import { drawText } from './font'
import { disc, dither, rect, rng, type Ctx } from './stages/kit'

/**
 * The tower menu backdrop: a night skyline and a three-floor office
 * building. The opponents' windows are React buttons laid over it, using
 * the same coordinates (TOWER below).
 */

export const TOWER = {
  x: 120,
  w: 144,
  roofY: 20,
  /** y / height of each floor's band, by level */
  floors: { 3: { y: 36, h: 46 }, 2: { y: 84, h: 46 }, 1: { y: 132, h: 46 } } as Record<number, { y: number; h: number }>,
  lobbyY: 180,
  groundY: 204,
  /** opponent windows: 3 per floor, 1 wide one on top */
  cell: (level: number, i: number, count: number) => {
    const f = TOWER.floors[level]
    if (count === 1) return { x: 162, y: f.y + 3, w: 60, h: f.h - 6 }
    return { x: 126 + i * 46, y: f.y + 3, w: 40, h: f.h - 6 }
  },
}

function sky(ctx: Ctx) {
  const bands = ['#070918', '#0b0e24', '#111632', '#1a1c42', '#2a2050', '#3e2658']
  const bh = Math.ceil(VIEW_H / bands.length)
  bands.forEach((c, i) => rect(ctx, 0, i * bh, VIEW_W, bh, c))
  for (let i = 1; i < bands.length; i++) dither(ctx, 0, i * bh - 2, VIEW_W, 3, bands[i])
  const r = rng(99)
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(r() * VIEW_W)
    const y = Math.floor(r() * 120)
    ctx.fillStyle = r() > 0.8 ? '#ffffff' : '#8a90c0'
    ctx.fillRect(x, y, 1, 1)
  }
  disc(ctx, 330, 30, 9, '#f4f0d8')
  disc(ctx, 334, 27, 8, '#0b0e24')
}

function skyline(ctx: Ctx) {
  const r = rng(12)
  for (const [layer, col, win] of [
    [0, '#161a36', '#3a3a5a'],
    [1, '#10132a', '#6a5a3a'],
  ] as const) {
    let x = -4
    while (x < VIEW_W) {
      const w = 14 + Math.floor(r() * 22)
      const h = (layer === 0 ? 70 : 40) + Math.floor(r() * (layer === 0 ? 70 : 60))
      const top = TOWER.groundY - h
      rect(ctx, x, top, w, h, col)
      for (let wy = top + 4; wy < TOWER.groundY - 4; wy += 5) {
        for (let wx = x + 2; wx < x + w - 2; wx += 4) {
          if (r() > (layer === 0 ? 0.85 : 0.7)) {
            ctx.fillStyle = win
            ctx.fillRect(wx, wy, 2, 2)
          }
        }
      }
      x += w + 2
    }
  }
}

function facade(ctx: Ctx) {
  const { x, w } = TOWER
  // body
  rect(ctx, x - 2, TOWER.roofY + 14, w + 4, TOWER.lobbyY - TOWER.roofY - 14, '#10101c')
  rect(ctx, x, TOWER.roofY + 14, w, TOWER.lobbyY - TOWER.roofY - 14, '#3a4258')
  dither(ctx, x, TOWER.roofY + 14, 6, TOWER.lobbyY - TOWER.roofY - 14, '#4a5470')
  dither(ctx, x + w - 6, TOWER.roofY + 14, 6, TOWER.lobbyY - TOWER.roofY - 14, '#2a3044')
  // floor slabs
  for (const lvl of [3, 2, 1]) {
    const f = TOWER.floors[lvl]
    rect(ctx, x - 4, f.y + f.h, w + 8, 2, lvl === 3 ? '#c89a28' : '#6a7490')
    rect(ctx, x, f.y, w, f.h, lvl === 3 ? '#2e2a3a' : '#343c52')
  }
  // top floor: gold trim and decorative windows either side of the VC's
  const top = TOWER.floors[3]
  rect(ctx, x, top.y, w, 2, '#c89a28')
  for (const wx of [x + 8, x + 26, x + 108, x + 126]) {
    rect(ctx, wx, top.y + 8, 12, top.h - 16, '#10101c')
    rect(ctx, wx + 1, top.y + 9, 10, top.h - 18, '#f4c860')
    dither(ctx, wx + 1, top.y + 9, 10, top.h - 18, '#e0a840')
  }
}

function roof(ctx: Ctx) {
  const { x, w, roofY } = TOWER
  rect(ctx, x - 4, roofY + 10, w + 8, 4, '#10101c')
  rect(ctx, x - 3, roofY + 10, w + 6, 3, '#6a7490')
  // antenna with a red light
  rect(ctx, x + 20, roofY - 16, 2, 26, '#8a92a4')
  rect(ctx, x + 19, roofY - 18, 4, 3, '#ff2a2a')
  // water tower
  rect(ctx, x + w - 34, roofY - 4, 20, 12, '#5a3a24')
  for (let i = 0; i < 20; i += 4) rect(ctx, x + w - 34 + i, roofY - 4, 1, 12, '#3a2414')
  rect(ctx, x + w - 36, roofY - 6, 24, 2, '#3a2414')
  rect(ctx, x + w - 32, roofY + 8, 2, 3, '#3a2414')
  rect(ctx, x + w - 18, roofY + 8, 2, 3, '#3a2414')
  // company sign
  rect(ctx, x + 40, roofY - 2, 60, 12, '#10101c')
  rect(ctx, x + 41, roofY - 1, 58, 10, '#1a1a2a')
  drawText(ctx, 'HQ', x + 70, roofY + 1, { color: '#ffe135', shadow: '#8a5a10', align: 'center' })
}

function lobby(ctx: Ctx) {
  const { x, w, lobbyY, groundY } = TOWER
  rect(ctx, x - 6, lobbyY, w + 12, groundY - lobbyY, '#2a3044')
  rect(ctx, x - 6, lobbyY, w + 12, 3, '#10101c')
  // awning
  rect(ctx, x + 44, lobbyY + 2, 56, 5, '#d62828')
  for (let i = 0; i < 56; i += 8) rect(ctx, x + 44 + i, lobbyY + 2, 4, 5, '#f4f4ee')
  // glass doors, lit
  rect(ctx, x + 50, lobbyY + 8, 44, groundY - lobbyY - 8, '#10101c')
  rect(ctx, x + 51, lobbyY + 9, 20, groundY - lobbyY - 9, '#f4e39a')
  rect(ctx, x + 73, lobbyY + 9, 20, groundY - lobbyY - 9, '#f4e39a')
  dither(ctx, x + 51, lobbyY + 9, 42, groundY - lobbyY - 9, '#e0c060')
  // lobby windows
  for (const wx of [x + 4, x + 24, x + 104, x + 124]) {
    rect(ctx, wx, lobbyY + 8, 16, 12, '#10101c')
    rect(ctx, wx + 1, lobbyY + 9, 14, 10, '#9ab8e0')
  }
  // street
  rect(ctx, 0, groundY, VIEW_W, VIEW_H - groundY, '#1c1c28')
  rect(ctx, 0, groundY, VIEW_W, 2, '#4a4a5a')
  for (let sx = 6; sx < VIEW_W; sx += 24) rect(ctx, sx, groundY + 7, 12, 1, '#8a8a60')
}

let url: string | null = null

/** PNG data URL of the tower backdrop (drawn once, then cached). */
export function towerBackdropURL(): string {
  if (url) return url
  const canvas = document.createElement('canvas')
  canvas.width = VIEW_W
  canvas.height = VIEW_H
  const ctx = canvas.getContext('2d')!
  sky(ctx)
  skyline(ctx)
  facade(ctx)
  roof(ctx)
  lobby(ctx)
  url = canvas.toDataURL()
  return url
}
