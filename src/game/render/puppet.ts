import type { BodyDims, Face, Limb, Palette, Pose, Vec2 } from '../types'

/**
 * The "puppet" renderer: turns a Pose (a few joint positions/angles) into a
 * small pixel-art sprite, drawn pixel by pixel into a palette-indexed buffer.
 * Every part gets its own 1px dark outline and a 1-2px shadow rim, which is
 * what gives the chunky 90s arcade look. Sprites are cached, and poses are
 * made of a handful of discrete key frames, so animation stays "steppy".
 */

export const SPR_W = 112
export const SPR_H = 100
/** Where the feet origin (0,0) sits inside the sprite. */
export const SPR_OX = 56
export const SPR_OY = 95

// palette indices
const T = 0
const OUT = 1
const SKIN = 2
const SKIN_S = 3
const HAIR = 4
const HAIR_S = 5
const SHIRT = 6
const SHIRT_S = 7
const PANTS = 8
const PANTS_S = 9
const SHOE = 10
const SHOE_H = 11
const TIE = 12
const TIE_S = 13
const EYE = 14
const BELT = 15

const D2R = Math.PI / 180

/** A shape answers "is world point (x,y) inside me, shrunk by `inset` pixels?" */
type Shape = (x: number, y: number, inset: number) => boolean
interface Bounds {
  x0: number
  y0: number
  x1: number
  y1: number
}

const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]]
const mul = (a: Vec2, s: number): Vec2 => [a[0] * s, a[1] * s]
const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]]
const len = (a: Vec2) => Math.hypot(a[0], a[1])
const norm = (a: Vec2): Vec2 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l]
}
/** unit vector for an absolute limb angle (0 = down, +90 = forward) */
const dirOf = (deg: number): Vec2 => [Math.sin(deg * D2R), -Math.cos(deg * D2R)]

function segDist(px: number, py: number, a: Vec2, b: Vec2) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  let t = l2 === 0 ? 0 : ((px - a[0]) * dx + (py - a[1]) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy))
}

const capsule =
  (a: Vec2, b: Vec2, r: number): Shape =>
  (x, y, i) =>
    segDist(x, y, a, b) <= r - i
const circle =
  (c: Vec2, r: number): Shape =>
  (x, y, i) =>
    Math.hypot(x - c[0], y - c[1]) <= r - i
const union =
  (...shapes: Shape[]): Shape =>
  (x, y, i) =>
    shapes.some((s) => s(x, y, i))

function polygon(pts: Vec2[]): Shape {
  return (x, y, inset) => {
    let inside = false
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i]
      const [xj, yj] = pts[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    if (!inside) return false
    if (inset <= 0) return true
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      if (segDist(x, y, pts[j], pts[i]) < inset) return false
    }
    return true
  }
}

function boundsOf(points: Vec2[], pad: number): Bounds {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [x, y] of points) {
    x0 = Math.min(x0, x)
    x1 = Math.max(x1, x)
    y0 = Math.min(y0, y)
    y1 = Math.max(y1, y)
  }
  return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad }
}

class PixelBuffer {
  readonly data = new Uint8Array(SPR_W * SPR_H)

  /**
   * Fill a shape: outline ring, then a shadow rim on the lower edge, then the
   * base colour. `colorAt` can override the colour per pixel (belt, tie...).
   */
  paint(
    shape: Shape,
    b: Bounds,
    base: number,
    shade: number | null,
    shadeShift = 1,
    colorAt?: (x: number, y: number, shaded: boolean) => number | null,
  ) {
    const px0 = Math.max(0, Math.floor(SPR_OX + b.x0))
    const px1 = Math.min(SPR_W - 1, Math.ceil(SPR_OX + b.x1))
    const py0 = Math.max(0, Math.floor(SPR_OY - b.y1))
    const py1 = Math.min(SPR_H - 1, Math.ceil(SPR_OY - b.y0))
    for (let py = py0; py <= py1; py++) {
      const wy = SPR_OY - (py + 0.5)
      for (let px = px0; px <= px1; px++) {
        const wx = px + 0.5 - SPR_OX
        if (!shape(wx, wy, 0)) continue
        let c: number
        if (!shape(wx, wy, 1)) c = OUT
        else {
          const shaded = shade !== null && !shape(wx, wy - shadeShift, 1)
          c = shaded ? (shade as number) : base
          if (colorAt) {
            const o = colorAt(wx, wy, shaded)
            if (o !== null) c = o
          }
        }
        this.data[py * SPR_W + px] = c
      }
    }
  }

  dot(p: Vec2, c: number) {
    const px = Math.floor(SPR_OX + p[0])
    const py = Math.floor(SPR_OY - p[1])
    if (px >= 0 && px < SPR_W && py >= 0 && py < SPR_H) this.data[py * SPR_W + px] = c
  }
}

interface SolvedLimb {
  root: Vec2
  joint: Vec2
  end: Vec2
}

/** Two-bone limb: angles (forward kinematics) or IK towards a target. */
function solveLimb(root: Vec2, limb: Limb, l1: number, l2: number, kind: 'leg' | 'arm'): SolvedLimb {
  if (limb.a) {
    const joint = add(root, mul(dirOf(limb.a[0]), l1))
    const end = add(joint, mul(dirOf(limb.a[1]), l2))
    return { root, joint, end }
  }
  const target = limb.ik ?? [root[0], root[1] - l1 - l2]
  const d0 = sub(target, root)
  const dist = len(d0)
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, dist))
  const dir = dist === 0 ? ([0, -1] as Vec2) : norm(d0)
  const end = add(root, mul(dir, d))
  const base = Math.atan2(dir[1], dir[0])
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosA)))
  const j1 = add(root, [Math.cos(base + alpha) * l1, Math.sin(base + alpha) * l1])
  const j2 = add(root, [Math.cos(base - alpha) * l1, Math.sin(base - alpha) * l1])
  // knees bend forward, elbows hang down
  const joint = kind === 'leg' ? (j1[0] > j2[0] ? j1 : j2) : j1[1] < j2[1] ? j1 : j2
  return { root, joint, end }
}

function hexToABGR(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}

function paletteTable(p: Palette): Uint32Array {
  const order = [
    '', p.outline, p.skin, p.skinShade, p.hair, p.hairShade, p.shirt, p.shirtShade,
    p.pants, p.pantsShade, p.shoe, p.shoeShine, p.tie, p.tieShade, p.eye, p.belt,
  ]
  return Uint32Array.from(order.map((c, i) => (i === T ? 0 : hexToABGR(c))))
}

function drawLeg(buf: PixelBuffer, body: BodyDims, hip: Vec2, limb: Limb, far: boolean) {
  const { joint: knee, end: ankle } = solveLimb(hip, limb, body.thigh, body.shin, 'leg')
  const shape = union(capsule(hip, knee, body.thighW / 2), capsule(knee, ankle, body.shinW / 2))
  buf.paint(shape, boundsOf([hip, knee, ankle], 6), far ? PANTS_S : PANTS, far ? null : PANTS_S)
  // shoe: perpendicular to the shin, pointing forward
  const s = norm(sub(ankle, knee))
  // planted feet stay flat on the floor; airborne/kicking feet follow the shin
  const planted = !!limb.ik && limb.ik[1] <= 3
  const f: Vec2 = planted ? [1, 0] : [-s[1], s[0]]
  const heel = add(ankle, mul(f, -1.5))
  const toe = add(add(ankle, mul(f, 4.5)), planted ? [0, 0] : mul(s, 0.6))
  buf.paint(capsule(heel, toe, 2.4), boundsOf([heel, toe], 4), SHOE, far ? null : SHOE_H, -1)
}

function drawArm(buf: PixelBuffer, body: BodyDims, shoulder: Vec2, limb: Limb, far: boolean) {
  const { joint: elbow, end: hand } = solveLimb(shoulder, limb, body.upperArm, body.foreArm, 'arm')
  const shape = union(capsule(shoulder, elbow, body.armW / 2), capsule(elbow, hand, body.foreW / 2))
  buf.paint(shape, boundsOf([shoulder, elbow, hand], 5), far ? SHIRT_S : SHIRT, far ? null : SHIRT_S)
  const fist = add(hand, mul(norm(sub(hand, elbow)), 1))
  buf.paint(circle(fist, 2.8), boundsOf([fist], 4), far ? SKIN_S : SKIN, far ? null : SKIN_S)
}

function drawHead(buf: PixelBuffer, body: BodyDims, neckBase: Vec2, angle: number, face: Face) {
  const hu: Vec2 = [Math.sin(angle * D2R), Math.cos(angle * D2R)] // head "up"
  const hp: Vec2 = [Math.cos(angle * D2R), -Math.sin(angle * D2R)] // head "forward"
  const r = body.headR
  const c = add(neckBase, mul(hu, body.neck + r - 1))
  const at = (lx: number, ly: number): Vec2 => add(c, add(mul(hp, lx), mul(hu, ly)))
  const local = (x: number, y: number): Vec2 => {
    const d: Vec2 = [x - c[0], y - c[1]]
    return [d[0] * hp[0] + d[1] * hp[1], d[0] * hu[0] + d[1] * hu[1]]
  }

  // neck
  const n0 = add(neckBase, mul(hu, -1))
  const n1 = add(neckBase, mul(hu, body.neck + 2))
  buf.paint(capsule(n0, n1, 2.6), boundsOf([n0, n1], 4), SKIN_S, null)

  // skull + big caricature jaw
  const jaw = at(2.5, -3.5)
  const head = union(circle(c, r), circle(jaw, r * 0.7))
  buf.paint(head, boundsOf([c], r + 3), SKIN, SKIN_S, 2)

  // hair: top and back of the head, slightly puffed up
  const hairC = at(-1, 1.2)
  const hair: Shape = (x, y, i) => {
    if (!circle(hairC, r + 0.8)(x, y, i)) return false
    const [lx, ly] = local(x, y)
    return ly > 2.2 - lx * 0.15 || (lx < -2.5 && ly > -3.5)
  }
  buf.paint(hair, boundsOf([hairC], r + 3), HAIR, HAIR_S, 2)

  // face details
  buf.dot(at(-0.8, -0.8), SKIN_S) // ear
  buf.dot(at(-0.8, -1.8), SKIN_S)
  if (face === 'hurt' || face === 'ko') {
    buf.dot(at(3.5, 0.5), OUT)
    buf.dot(at(4.5, 0.5), OUT)
    if (face === 'ko') buf.dot(at(4, 1.5), OUT)
  } else {
    buf.dot(at(3.5, 0.5), EYE)
    buf.dot(at(4.5, 0.5), OUT)
  }
  // angry eyebrow
  buf.dot(at(2.5, 2.6), OUT)
  buf.dot(at(3.5, 2.6), OUT)
  buf.dot(at(4.5, 2.1), OUT)
  buf.dot(at(5.5, 1.6), OUT)
  // nose
  buf.dot(at(r + 0.2, -0.8), SKIN)
  buf.dot(at(r + 0.2, -1.8), SKIN)
  buf.dot(at(r + 1.2, -1.3), OUT)
  // mouth
  if (face === 'shout' || face === 'hurt') {
    buf.dot(at(4.5, -4.2), OUT)
    buf.dot(at(5.5, -4.2), OUT)
    buf.dot(at(4.5, -5.2), OUT)
    buf.dot(at(5.5, -5.2), OUT)
  } else {
    buf.dot(at(4.5, -4.5), OUT)
    buf.dot(at(5.5, -4.2), OUT)
  }
}

function drawTorso(buf: PixelBuffer, body: BodyDims, hip: Vec2, lean: number) {
  const u: Vec2 = [Math.sin(lean * D2R), Math.cos(lean * D2R)] // torso up
  const p: Vec2 = [Math.cos(lean * D2R), -Math.sin(lean * D2R)] // torso forward
  const neck = add(hip, mul(u, body.torso))
  const sw = body.shoulderW / 2
  const hw = body.hipW / 2
  const quad = polygon([
    add(hip, mul(p, -hw)),
    add(hip, mul(p, hw)),
    add(neck, mul(p, sw)),
    add(neck, mul(p, -sw)),
  ])
  const shoulders = circle(add(neck, mul(u, -3)), sw - 0.5)
  const torso = union(quad, shoulders)

  // tie strip on the chest side
  const tieTop = add(neck, mul(p, sw - 3))
  const tieBot = add(add(hip, mul(u, 6)), mul(p, hw - 1.5))
  const tieShape = capsule(tieTop, tieBot, 1.4)

  const zone = (x: number, y: number, shaded: boolean): number | null => {
    const h = (x - hip[0]) * u[0] + (y - hip[1]) * u[1] // height along the torso
    if (h < 3.5) return shaded ? PANTS_S : PANTS
    if (h < 5.5) return BELT
    if (tieShape(x, y, 0)) return h > body.torso - 3.5 ? TIE_S : shaded ? TIE_S : TIE
    return null
  }
  buf.paint(torso, boundsOf([hip, neck], sw + 4), SHIRT, SHIRT_S, 2, zone)
  return { neck, u }
}

function renderPoseToCanvas(pose: Pose, body: BodyDims, palette: Palette): HTMLCanvasElement {
  const buf = new PixelBuffer()
  const hip = pose.hip
  const u: Vec2 = [Math.sin(pose.lean * D2R), Math.cos(pose.lean * D2R)]
  const neckPt = add(hip, mul(u, body.torso))
  const shoulder = add(neckPt, mul(u, -3))

  // back to front: far arm, far leg, torso, near leg, head, near arm
  drawArm(buf, body, add(shoulder, [-1, 0]), pose.farArm, true)
  drawLeg(buf, body, add(hip, [1, 0]), pose.farLeg, true)
  drawLeg(buf, body, add(hip, [-1, 0]), pose.nearLeg, false)
  const { neck } = drawTorso(buf, body, hip, pose.lean)
  drawHead(buf, body, neck, pose.lean + (pose.head ?? 0), pose.face ?? 'normal')
  drawArm(buf, body, shoulder, pose.nearArm, false)

  const canvas = document.createElement('canvas')
  canvas.width = SPR_W
  canvas.height = SPR_H
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(SPR_W, SPR_H)
  const out = new Uint32Array(img.data.buffer)
  const table = paletteTable(palette)
  for (let i = 0; i < buf.data.length; i++) out[i] = table[buf.data[i]]
  ctx.putImageData(img, 0, 0)
  return canvas
}

const cache = new Map<string, HTMLCanvasElement>()

export function spriteFor(pose: Pose, body: BodyDims, palette: Palette, charId: string): HTMLCanvasElement {
  const key = `${charId}|${palette.id}|${JSON.stringify(pose)}`
  let c = cache.get(key)
  if (!c) {
    if (cache.size > 600) cache.clear()
    c = renderPoseToCanvas(pose, body, palette)
    cache.set(key, c)
  }
  return c
}
