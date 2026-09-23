import { VIEW_W } from '../constants'
import type { Match } from '../Match'
import { drawText } from './font'

const BAR_W = 150
const BAR_H = 9
const BAR_Y = 10

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(x, y, w, h)
}

function drawBar(ctx: CanvasRenderingContext2D, x: number, ratio: number, trail: number, flip: boolean, low: boolean) {
  rect(ctx, x - 2, BAR_Y - 2, BAR_W + 4, BAR_H + 4, '#10101c')
  rect(ctx, x - 1, BAR_Y - 1, BAR_W + 2, BAR_H + 2, '#e8e0c8')
  rect(ctx, x, BAR_Y, BAR_W, BAR_H, '#5a1020')
  // bars are anchored to the outer edges; damage eats in from the centre
  const draw = (r: number, c: string) => {
    const w = Math.round(BAR_W * Math.max(0, r))
    rect(ctx, flip ? x + BAR_W - w : x, BAR_Y, w, BAR_H, c)
  }
  draw(trail, '#ff4a2a')
  draw(ratio, low ? '#ffae1e' : '#ffe135')
  const w = Math.round(BAR_W * Math.max(0, ratio))
  if (w > 0) rect(ctx, flip ? x + BAR_W - w : x, BAR_Y + 1, w, 2, low ? '#ffd07a' : '#fff6a8')
  rect(ctx, flip ? x + BAR_W - w : x, BAR_Y + BAR_H - 2, w, 2, low ? '#d98a10' : '#e0b21a')
}

function drawMug(ctx: CanvasRenderingContext2D, x: number, y: number, full: boolean) {
  rect(ctx, x, y, 7, 7, '#10101c')
  rect(ctx, x + 1, y + 1, 5, 5, full ? '#f4f4ee' : '#50506a')
  if (full) rect(ctx, x + 1, y + 1, 5, 2, '#6b3a1e')
  rect(ctx, x + 7, y + 2, 2, 3, '#10101c')
  rect(ctx, x + 7, y + 3, 1, 1, full ? '#f4f4ee' : '#50506a')
}

export function drawHud(ctx: CanvasRenderingContext2D, m: Match, frame: number) {
  const [a, b] = m.fighters
  const leftX = 14
  const rightX = VIEW_W - 14 - BAR_W
  const blink = frame % 16 < 8
  drawBar(ctx, leftX, a.health / a.maxHealth, m.trail[0], false, a.health / a.maxHealth < 0.25 && blink)
  drawBar(ctx, rightX, b.health / b.maxHealth, m.trail[1], true, b.health / b.maxHealth < 0.25 && blink)

  // names
  drawText(ctx, m.names[0], leftX, BAR_Y + BAR_H + 4, { color: '#ffffff', shadow: '#10101c' })
  drawText(ctx, m.names[1], rightX + BAR_W, BAR_Y + BAR_H + 4, { color: '#ffffff', shadow: '#10101c', align: 'right' })

  // round wins = cups of coffee
  for (let i = 0; i < 2; i++) {
    drawMug(ctx, leftX + BAR_W - 20 + i * 11, BAR_Y + BAR_H + 3, m.wins[0] > i)
    drawMug(ctx, rightX + 12 - i * 11, BAR_Y + BAR_H + 3, m.wins[1] > i)
  }

  // timer
  const tx = VIEW_W / 2
  rect(ctx, tx - 15, 4, 30, 21, '#10101c')
  rect(ctx, tx - 14, 5, 28, 19, '#2a2a4a')
  const tcol = m.timer <= 10 && blink ? '#ff4a2a' : '#ffe135'
  drawText(ctx, String(Math.max(0, m.timer)).padStart(2, '0'), tx, 8, { scale: 2, color: tcol, shadow: '#10101c', align: 'center' })

  // combo counter
  if (m.combo && m.combo.t > 0) {
    const side = m.combo.player
    const x = side === 0 ? 14 : VIEW_W - 14
    const txt = `${m.combo.count} HITS`
    drawText(ctx, txt, x, 46, { scale: 2, color: '#ffe135', outline: '#8e1616', align: side === 0 ? 'left' : 'right' })
    drawText(ctx, 'COMBO!', x, 64, { color: '#ffffff', outline: '#10101c', align: side === 0 ? 'left' : 'right' })
  }
}

export function drawAnnouncer(ctx: CanvasRenderingContext2D, m: Match) {
  const a = m.announce
  if (!a) return
  // pop in: small for 2 frames, then full size
  const scale = a.t < 2 ? Math.max(1, a.scale - 2) : a.scale
  const y = 78 - Math.floor((7 * scale) / 2)
  drawText(ctx, a.text, VIEW_W / 2, y, { scale, color: a.color, outline: '#10101c', shadow: '#10101c', align: 'center' })
  if (a.sub) drawText(ctx, a.sub, VIEW_W / 2, y + 7 * scale + 8, { scale: 1, color: '#ffffff', outline: '#10101c', align: 'center' })
}
