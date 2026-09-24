import { FLOOR_Y, VIEW_H, VIEW_W } from '../constants'
import type { Fighter } from '../fighter/Fighter'
import { INCIDENT_END, INCIDENT_WARNING, TOWER_HALF_W, TOWER_LAND, type Incident, type Projectile, type Tower } from '../specials'
import { drawText } from './font'

type Ctx = CanvasRenderingContext2D

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function blob(ctx: Ctx, cx: number, cy: number, r: number, fill: string, edge: string) {
  for (let y = -r - 1; y <= r + 1; y++) {
    for (let x = -r - 1; x <= r + 1; x++) {
      const d = x * x + y * y
      if (d <= r * r) rect(ctx, cx + x, cy + y, 1, 1, fill)
      else if (d <= (r + 1) * (r + 1)) rect(ctx, cx + x, cy + y, 1, 1, edge)
    }
  }
}

function drawCoffee(ctx: Ctx, p: Projectile) {
  const x = Math.round(p.x)
  const y = Math.round(FLOOR_Y - p.y)
  const dir = Math.sign(p.vx)
  // trail of drops
  for (let i = 1; i <= 3; i++) rect(ctx, x - dir * (6 + i * 4), y + ((p.t + i) % 3) - 1, 2, 2, i % 2 ? '#6b3a1e' : '#a86a3a')
  // spinning paper cup: 4 frames
  const f = Math.floor(p.t / 4) % 4
  const tall = f % 2 === 0
  const w = tall ? 7 : 9
  const h = tall ? 9 : 7
  rect(ctx, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, '#1a1020')
  rect(ctx, x - w / 2, y - h / 2, w, h, '#f4f4ee')
  if (tall) {
    rect(ctx, x - w / 2, y - h / 2 + (f === 0 ? 0 : h - 2), w, 2, '#6b3a1e')
    rect(ctx, x - w / 2, y, w, 2, '#d62828')
  } else {
    rect(ctx, x - w / 2 + (f === 1 ? 0 : w - 2), y - h / 2, 2, h, '#6b3a1e')
    rect(ctx, x - 1, y - h / 2, 2, h, '#d62828')
  }
  if (p.t % 6 < 3) rect(ctx, x - 1, y - h / 2 - 3, 1, 2, '#e8e8e8')
}

function drawComplaint(ctx: Ctx, p: Projectile) {
  const x = Math.round(p.x)
  const y = Math.round(FLOOR_Y - p.y)
  const flutter = Math.floor(p.t / 5) % 2
  const w = 12
  const h = 15 - flutter
  rect(ctx, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, '#1a1020')
  rect(ctx, x - w / 2, y - h / 2, w, h, '#ffffff')
  rect(ctx, x + w / 2 - 3, y - h / 2, 3, 3, '#c8c8d8')
  for (let i = 0; i < 4; i++) rect(ctx, x - w / 2 + 2, y - h / 2 + 3 + i * 2, 7 - (i % 2) * 2, 1, '#8a8aa0')
  // red "COMPLAINT" stamp
  rect(ctx, x - 4, y + 3, 9, 3, '#d62828')
  // a few extra forms flying behind
  const dir = Math.sign(p.vx)
  for (let i = 1; i <= 2; i++) {
    const bx = x - dir * i * 12
    const by = y + (i % 2 ? -5 : 4) + ((p.t + i * 3) % 6 < 3 ? 1 : 0)
    rect(ctx, bx - 3, by - 4, 7, 8, '#1a1020')
    rect(ctx, bx - 2, by - 3, 5, 6, '#f0f0f4')
  }
}

function drawBullshit(ctx: Ctx, p: Projectile) {
  const x = Math.round(p.x)
  const y = Math.round(FLOOR_Y - p.y)
  const dir = Math.sign(p.vx)
  const k = p.w / 40
  // wind lines behind
  for (let i = 0; i < 5; i++) {
    const ly = y - p.h / 2 + 6 + i * (p.h / 5)
    const lx = x - dir * (p.w / 2 + 6 + ((p.t * 3 + i * 7) % 18))
    rect(ctx, dir > 0 ? lx - 10 : lx, ly, 10, 1, '#f4efd8')
  }
  // puffy cloud made of blobs that wobble
  const puffs: [number, number, number][] = [
    [0, 0, 13],
    [-10, -9, 9],
    [9, -11, 10],
    [-11, 8, 9],
    [10, 9, 9],
    [0, -18, 8],
    [0, 17, 8],
    [15, 0, 8],
    [-15, 0, 7],
  ]
  for (const [dx, dy, r] of puffs) {
    const wob = Math.round(Math.sin((p.t + dx) * 0.3))
    blob(ctx, x + dx * k + wob, y + dy * k, Math.max(3, Math.round(r * k)), '#c8a86a', '#5a3a1a')
  }
  for (const [dx, dy, r] of puffs.slice(0, 5)) {
    blob(ctx, x + dx * k - 1, y + dy * k - 1, Math.max(2, Math.round(r * k) - 3), '#e8d4a0', '#e8d4a0')
  }
  const words = ['BLAH', 'SYNERGY', 'BLAH', 'WIN-WIN', 'BLAH', '10X']
  if (k > 0.6) {
    drawText(ctx, words[Math.floor(p.t / 12) % words.length], x, y - 8, { color: '#5a3a1a', align: 'center' })
    drawText(ctx, words[(Math.floor(p.t / 12) + 3) % words.length], x, y + 4, { color: '#8a1c2a', align: 'center' })
  }
  // the flies
  for (let i = 0; i < 3; i++) {
    const a = p.t * 0.25 + i * 2.1
    rect(ctx, x + Math.cos(a) * (p.w / 2 + 3), y + Math.sin(a * 1.3) * (p.h / 2), 1, 1, '#10101c')
  }
}

/** A yellow "NEW REQ" sticky ticket, spinning a little. */
function drawRequirement(ctx: Ctx, p: Projectile) {
  const x = Math.round(p.x)
  const y = Math.round(FLOOR_Y - p.y)
  const tilt = Math.floor(p.t / 4) % 2
  rect(ctx, x - 7, y - 7 + tilt, 14, 14, '#1a1020')
  rect(ctx, x - 6, y - 6 + tilt, 12, 12, '#ffe135')
  rect(ctx, x - 6, y - 6 + tilt, 12, 3, '#ffb81e')
  rect(ctx, x - 4, y - 1 + tilt, 8, 1, '#8a6a10')
  rect(ctx, x - 4, y + 1 + tilt, 6, 1, '#8a6a10')
  rect(ctx, x - 4, y + 3 + tilt, 7, 1, '#8a6a10')
  const dir = Math.sign(p.vx)
  for (let i = 1; i <= 3; i++) rect(ctx, x - dir * (8 + i * 5), y + ((i * 3) % 5) - 2, 3, 1, '#fff6a8')
}

function drawBill(ctx: Ctx, x: number, y: number, t: number, big = false) {
  const flip = Math.floor(t / 5) % 2
  const w = big ? 12 : flip ? 10 : 7
  const h = big ? 7 : flip ? 5 : 6
  rect(ctx, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, '#123a1a')
  rect(ctx, x - w / 2, y - h / 2, w, h, '#6cc05a')
  rect(ctx, x - 1, y - h / 2 + 1, 2, h - 2, '#d8f0c0')
  if (big) rect(ctx, x - w / 2 + 1, y - h / 2 + 1, 2, 2, '#1e5a2a')
}

export function drawProjectiles(ctx: Ctx, list: readonly Projectile[]) {
  for (const p of list) {
    if (p.kind === 'coffee') drawCoffee(ctx, p)
    else if (p.kind === 'complaint') drawComplaint(ctx, p)
    else if (p.kind === 'requirement') drawRequirement(ctx, p)
    else if (p.kind === 'cash') {
      // a fanned wad of bills
      const x = Math.round(p.x)
      const y = Math.round(FLOOR_Y - p.y)
      drawBill(ctx, x - 4, y + 2, p.t, true)
      drawBill(ctx, x, y - 1, p.t + 3, true)
      drawBill(ctx, x + 4, y + 1, p.t + 5, true)
    } else if (p.kind === 'bill') drawBill(ctx, Math.round(p.x), Math.round(FLOOR_Y - p.y), p.t)
    else drawBullshit(ctx, p)
  }
}

/** Ivory Tower: a warning shadow, then a stack of architecture boxes falls from the sky. */
export function drawTowers(ctx: Ctx, towers: readonly Tower[]) {
  for (const tw of towers) {
    const x = Math.round(tw.x)
    if (tw.t < TOWER_LAND) {
      const k = Math.min(1, tw.t / 30)
      const w = Math.round(TOWER_HALF_W * (0.4 + 0.6 * k))
      ctx.fillStyle = `rgba(10, 10, 30, ${0.25 + 0.3 * k})`
      ctx.fillRect(x - w, FLOOR_Y - 2, w * 2, 5)
      if (Math.floor(tw.t / 5) % 2 === 0) {
        rect(ctx, x - w - 2, FLOOR_Y - 3, 2, 7, '#ff4a2a')
        rect(ctx, x + w, FLOOR_Y - 3, 2, 7, '#ff4a2a')
      }
    }
    // the stack falls in the last 12 frames before landing, then sits there and fades
    const fall = tw.t < TOWER_LAND - 12 ? null : Math.max(0, (TOWER_LAND - tw.t) / 12)
    if (fall === null) continue
    if (tw.t > TOWER_LAND + 20 && tw.t % 4 < 2) continue
    const drop = Math.round(fall * 190)
    const labels = ['API', 'SVC', 'DB']
    labels.forEach((label, i) => {
      const bw = 34 - i * 4
      const bh = 16
      const by = FLOOR_Y - (i + 1) * (bh + 4) - drop
      rect(ctx, x - bw / 2 - 1, by - 1, bw + 2, bh + 2, '#10101c')
      rect(ctx, x - bw / 2, by, bw, bh, i === 2 ? '#3a7bd5' : '#f4f4ee')
      rect(ctx, x - bw / 2, by + bh - 3, bw, 3, i === 2 ? '#2a5aa8' : '#c8ccd4')
      drawText(ctx, label, x, by + 4, { color: i === 2 ? '#ffffff' : '#10101c', align: 'center' })
      if (i < 2) {
        // arrow to the next box
        rect(ctx, x, by - 4, 1, 4, '#10101c')
        rect(ctx, x - 1, by - 2, 3, 1, '#10101c')
      }
    })
  }
}

/** The complaint form stuck on the victim's face. */
export function drawSticker(ctx: Ctx, f: Fighter) {
  if (f.sticker <= 0 || (f.sticker < 15 && f.sticker % 4 < 2)) return
  const [hx, hy] = f.headPos()
  const x = Math.round(hx + f.facing * 3)
  const y = Math.round(FLOOR_Y - hy)
  const ticket = f.stickerKind === 'ticket'
  rect(ctx, x - 7, y - 8, 14, 16, '#1a1020')
  rect(ctx, x - 6, y - 7, 12, 14, ticket ? '#ffe135' : '#ffffff')
  for (let i = 0; i < 3; i++) rect(ctx, x - 4, y - 5 + i * 2, 8, 1, ticket ? '#8a6a10' : '#8a8aa0')
  rect(ctx, x - 4, y + 2, 8, 3, ticket ? '#ffb81e' : '#d62828')
}

/** SEV-1: everything turns red, sirens flash, then the damage lands. */
export function drawIncidentOverlay(ctx: Ctx, inc: Incident) {
  const t = inc.t
  let strength: number
  if (t < INCIDENT_WARNING) strength = 0.45 + (Math.floor(t / 6) % 2) * 0.25
  else strength = Math.max(0, 0.85 * (1 - (t - INCIDENT_WARNING) / (INCIDENT_END - INCIDENT_WARNING)))
  if (t === INCIDENT_WARNING || t === INCIDENT_WARNING + 1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = strength
  ctx.fillStyle = '#ff2a2a'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  ctx.restore()
  ctx.fillStyle = `rgba(255, 30, 30, ${strength * 0.18})`
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  if (t < INCIDENT_WARNING) {
    // hazard stripes top and bottom
    for (let x = -16; x < VIEW_W; x += 16) {
      const o = (t * 2) % 16
      for (const y of [30, VIEW_H - 8]) {
        rect(ctx, x + o, y, 8, 6, '#ffd23c')
        rect(ctx, x + o + 8, y, 8, 6, '#10101c')
      }
    }
    // rotating beacons
    for (const bx of [16, VIEW_W - 16]) {
      const on = Math.floor(t / 4) % 2 === 0
      rect(ctx, bx - 5, 40, 10, 8, '#10101c')
      rect(ctx, bx - 4, 41, 8, 6, on ? '#ff4a2a' : '#7a1010')
      if (on) rect(ctx, bx - 8, 43, 16, 2, '#ffae9e')
    }
    if (Math.floor(t / 8) % 2 === 0 || t > 30) {
      drawText(ctx, 'INCIDENT DECLARED!', VIEW_W / 2, 70, { scale: 2, color: '#ffffff', outline: '#10101c', shadow: '#7a1010', align: 'center' })
    }
    drawText(ctx, 'SEV-1 - ALL HANDS ON DECK', VIEW_W / 2, 92, { color: '#ffe135', outline: '#10101c', align: 'center' })
    drawText(ctx, `IMPACT IN ${Math.ceil((INCIDENT_WARNING - t) / 15)}`, VIEW_W / 2, 104, { color: '#ffffff', outline: '#10101c', align: 'center' })
  }
}
