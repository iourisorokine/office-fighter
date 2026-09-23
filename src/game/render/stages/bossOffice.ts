import { VIEW_H, VIEW_W } from '../../constants'
import { drawText } from '../font'
import { CEIL_H, disc, dither, drawWindow, FLOOR_TOP, newCanvas, rect, rng, WALL_BOTTOM, type Ctx } from './kit'

/** "The Corner Office": mahogany, a sunset skyline, trophies, and WIN OR DIE in gold. */

function woodWall(ctx: Ctx) {
  rect(ctx, 0, 0, VIEW_W, CEIL_H, '#2a160c')
  for (let x = 0; x < VIEW_W; x += 48) rect(ctx, x, 0, 2, CEIL_H, '#1a0c06')
  rect(ctx, 0, CEIL_H - 2, VIEW_W, 2, '#6e4228')
  rect(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#5a3420')
  // raised panels
  for (let x = 4; x < VIEW_W; x += 46) {
    for (const [y, h] of [[24, 70], [104, 50]]) {
      rect(ctx, x, y, 40, h, '#4a2818')
      rect(ctx, x + 2, y + 2, 36, h - 4, '#6a3e26')
      rect(ctx, x + 2, y + 2, 36, 1, '#80503a')
    }
  }
  rect(ctx, 0, 98, VIEW_W, 3, '#80503a')
  rect(ctx, 0, 101, VIEW_W, 1, '#2a160c')
}

function plaque(ctx: Ctx, x: number, y: number) {
  const w = 76
  const h = 40
  rect(ctx, x, y, w, h, '#6a4a10')
  rect(ctx, x + 1, y + 1, w - 2, h - 2, '#e0b030')
  dither(ctx, x + 1, y + 1, w - 2, 2, '#fff0a0')
  rect(ctx, x + 4, y + 4, w - 8, h - 8, '#1f3a2a')
  drawText(ctx, 'WIN OR DIE', x + w / 2, y + 11, { color: '#ffd84a', shadow: '#0a1a10', align: 'center' })
  rect(ctx, x + 14, y + 22, w - 28, 1, '#c89a28')
  drawText(ctx, '- THE BOSS', x + w / 2, y + 26, { color: '#c8b070', align: 'center' })
}

function trophyShelf(ctx: Ctx, x: number, y: number) {
  for (const sy of [y + 20, y + 44]) {
    rect(ctx, x, sy, 60, 4, '#2a160c')
    rect(ctx, x, sy, 60, 1, '#80503a')
  }
  const trophy = (tx: number, by: number, big: boolean) => {
    const h = big ? 16 : 11
    rect(ctx, tx - 4, by - 3, 9, 3, '#3a2a10')
    rect(ctx, tx - 1, by - 7, 3, 4, '#c89a28')
    rect(ctx, tx - 4, by - h, 9, h - 7, '#e0b030')
    rect(ctx, tx - 4, by - h, 2, h - 7, '#fff0a0')
    rect(ctx, tx - 6, by - h + 1, 2, 4, '#c89a28')
    rect(ctx, tx + 5, by - h + 1, 2, 4, '#c89a28')
  }
  trophy(x + 10, y + 20, true)
  trophy(x + 28, y + 20, false)
  trophy(x + 46, y + 20, true)
  trophy(x + 16, y + 44, false)
  // a golf ball on a tee and a stack of books
  disc(ctx, x + 36, y + 40, 2, '#f4f4ee')
  rect(ctx, x + 42, y + 34, 14, 4, '#8a1c2a')
  rect(ctx, x + 43, y + 38, 13, 6, '#1f3b6b')
}

function desk(ctx: Ctx) {
  const top = 126
  // huge leather chair behind the desk
  rect(ctx, 168, 84, 48, 44, '#10101c')
  rect(ctx, 170, 86, 44, 42, '#7a1c2a')
  for (let i = 0; i < 3; i++) rect(ctx, 176 + i * 12, 90, 8, 30, '#8e2636')
  for (const [bx, by] of [[180, 94], [192, 94], [204, 94], [186, 108], [198, 108]]) rect(ctx, bx, by, 2, 2, '#e0b030')
  // the desk
  rect(ctx, 104, top, 176, WALL_BOTTOM + 4 - top, '#10101c')
  rect(ctx, 105, top + 1, 174, 5, '#8a4a22')
  rect(ctx, 105, top + 1, 174, 1, '#b86a3a')
  rect(ctx, 105, top + 6, 174, WALL_BOTTOM + 2 - top - 6, '#5e2e14')
  for (const px of [116, 232]) {
    rect(ctx, px, top + 10, 36, 22, '#4a220e')
    rect(ctx, px + 1, top + 11, 34, 1, '#7a3e1c')
    rect(ctx, px + 15, top + 20, 6, 2, '#e0b030')
  }
  // desk items: gold nameplate, lamp, cigar box, pen set
  rect(ctx, 164, top - 8, 56, 9, '#3a2a10')
  rect(ctx, 165, top - 7, 54, 7, '#e0b030')
  drawText(ctx, 'THE BOSS', 192, top - 7, { color: '#3a2a10', align: 'center' })
  rect(ctx, 124, top - 3, 12, 3, '#2a4a2a')
  rect(ctx, 129, top - 18, 2, 15, '#c89a28')
  rect(ctx, 122, top - 22, 14, 5, '#2f8a3f')
  rect(ctx, 123, top - 21, 12, 1, '#6cc05a')
  rect(ctx, 240, top - 5, 18, 5, '#6a3a1a')
  rect(ctx, 241, top - 4, 16, 1, '#e0b030')
  rect(ctx, 264, top - 8, 2, 8, '#10101c')
  rect(ctx, 268, top - 9, 2, 9, '#e0b030')
}

function globe(ctx: Ctx, x: number, y: number) {
  rect(ctx, x - 1, y + 10, 3, 22, '#3a2a10')
  rect(ctx, x - 8, y + 32, 17, 3, '#3a2a10')
  disc(ctx, x, y, 10, '#3a6ab8')
  disc(ctx, x - 3, y - 2, 4, '#5fa04a')
  disc(ctx, x + 4, y + 4, 3, '#5fa04a')
  ctx.fillStyle = '#c89a28'
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2
    ctx.fillRect(Math.round(x + Math.cos(t) * 11), Math.round(y + Math.sin(t) * 11), 1, 1)
  }
}

function plushCarpet(ctx: Ctx) {
  const r = rng(31)
  rect(ctx, 0, FLOOR_TOP, VIEW_W, VIEW_H - FLOOR_TOP, '#5a1a24')
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = r() > 0.5 ? '#6a2230' : '#4a141c'
    ctx.fillRect(Math.floor(r() * VIEW_W), FLOOR_TOP + Math.floor(r() * (VIEW_H - FLOOR_TOP)), 1, 1)
  }
  // Persian rug in perspective
  const y0 = FLOOR_TOP + 10
  const y1 = VIEW_H - 3
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / (y1 - y0)
    const half = 80 + t * 50
    for (let x = Math.round(192 - half); x < 192 + half; x++) {
      const u = (x - (192 - half)) / (2 * half)
      const edge = y === y0 || y === y1 - 1 || u < 0.03 || u > 0.97
      const border = u < 0.1 || u > 0.9 || t < 0.14 || t > 0.86
      let c = '#1f3b6b'
      if (edge) c = '#10101c'
      else if (border) c = (Math.floor(u * 60) + y) % 3 === 0 ? '#e0b030' : '#8a1c2a'
      else if ((Math.floor(u * 16) + Math.floor(t * 6)) % 2 === 0 && (x + y) % 2 === 0) c = '#2e5090'
      ctx.fillStyle = c
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

export function createBossOffice(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  woodWall(ctx)
  drawWindow(ctx, 110, 26, 164, 66, 47, 'sunset', false)
  plaque(ctx, 18, 40)
  trophyShelf(ctx, 306, 36)
  globe(ctx, 60, 118)
  desk(ctx)
  // golf bag in the corner
  rect(ctx, 344, 108, 14, 52, '#10101c')
  rect(ctx, 345, 109, 12, 50, '#e8e0c8')
  rect(ctx, 345, 124, 12, 3, '#8a1c2a')
  for (const [cx, h] of [[347, 12], [351, 16], [355, 10]]) {
    rect(ctx, cx, 108 - h, 1, h, '#c8ccd4')
    rect(ctx, cx - 1, 106 - h, 3, 3, '#5a5a64')
  }
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 6, '#2a160c')
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 1, '#80503a')
  plushCarpet(ctx)
  return canvas
}

/** Brass ceiling spotlights instead of fluorescent tubes. */
export function bossLights(ctx: Ctx, frame: number) {
  for (const x of [80, 192, 304]) {
    rect(ctx, x - 5, 2, 10, 5, '#c89a28')
    rect(ctx, x - 3, 7, 6, 2, frame % 600 < 3 && x === 304 ? '#8a7a50' : '#fff4c0')
  }
}
