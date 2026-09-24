import { REF_LEGS, REF_TORSO, type BodyDims, type Face, type Limb, type Look, type Palette, type Pose, type Vec2 } from '../types'

/**
 * The "puppet" renderer: turns a Pose (a few joint positions/angles) into a
 * small pixel-art sprite, drawn pixel by pixel into a palette-indexed buffer.
 * Every part gets its own 1px dark outline and a 1-2px shadow rim, which is
 * what gives the chunky 90s arcade look. A `Look` adds the caricature: hair
 * style, glasses, belly, skirt, heels, and the prop the character swings.
 * Sprites are cached, and poses are a handful of discrete key frames.
 */

export const SPR_W = 128
export const SPR_H = 104
/** Where the feet origin (0,0) sits inside the sprite. */
export const SPR_OX = 64
export const SPR_OY = 99

// palette indices
const T = 0
const OUT = 1
const SKIN = 2
const SKIN_S = 3
const HAIR = 4
const HAIR_S = 5
const TOP = 6
const TOP_S = 7
const JACK = 8
const JACK_S = 9
const LEGS = 10
const LEGS_S = 11
const SHOE = 12
const SHOE_H = 13
const TIE = 14
const TIE_S = 15
const EYE = 16
const BELT = 17
const ACC = 18
const PROP = 19
const PROP_S = 20
const PROP_B = 21
const PROP_D = 22

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
const dot = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1]
const norm = (a: Vec2): Vec2 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l]
}
/** unit vector for an absolute limb angle (0 = down, +90 = forward) */
const dirOf = (deg: number): Vec2 => [Math.sin(deg * D2R), -Math.cos(deg * D2R)]
/** perpendicular, rotated a quarter turn counter-clockwise */
const perp = (d: Vec2): Vec2 => [-d[1], d[0]]

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

/** oriented rectangle: from `a` along direction d for `length`, `half` wide on each side */
function box(a: Vec2, d: Vec2, length: number, half: number): Vec2[] {
  const n = perp(d)
  const b = add(a, mul(d, length))
  return [add(a, mul(n, half)), add(b, mul(n, half)), add(b, mul(n, -half)), add(a, mul(n, -half))]
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

/**
 * Palette-indexed pixel grid. `k` is the resolution: 1 for in-game sprites,
 * more for close-ups (same shapes, finer pixels and thinner outlines).
 */
class PixelBuffer {
  readonly k: number
  readonly w: number
  readonly h: number
  readonly data: Uint8Array

  constructor(k = 1) {
    this.k = k
    this.w = Math.round(SPR_W * k)
    this.h = Math.round(SPR_H * k)
    this.data = new Uint8Array(this.w * this.h)
  }

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
    outline = true,
  ) {
    const k = this.k
    const edge = 1 / k
    const px0 = Math.max(0, Math.floor((SPR_OX + b.x0) * k))
    const px1 = Math.min(this.w - 1, Math.ceil((SPR_OX + b.x1) * k))
    const py0 = Math.max(0, Math.floor((SPR_OY - b.y1) * k))
    const py1 = Math.min(this.h - 1, Math.ceil((SPR_OY - b.y0) * k))
    for (let py = py0; py <= py1; py++) {
      const wy = SPR_OY - (py + 0.5) / k
      for (let px = px0; px <= px1; px++) {
        const wx = (px + 0.5) / k - SPR_OX
        if (!shape(wx, wy, 0)) continue
        let c: number
        if (outline && !shape(wx, wy, edge)) c = OUT
        else {
          const shaded = shade !== null && !shape(wx, wy - shadeShift, edge)
          c = shaded ? (shade as number) : base
          if (colorAt) {
            const o = colorAt(wx, wy, shaded)
            if (o !== null) c = o
          }
        }
        this.data[py * this.w + px] = c
      }
    }
  }

  /** one "world pixel" (a k x k block at high resolution) */
  dot(p: Vec2, c: number) {
    const k = this.k
    const size = Math.max(1, Math.ceil(k))
    const px = Math.floor((SPR_OX + p[0]) * k)
    const py = Math.floor((SPR_OY - p[1]) * k)
    for (let y = py; y < py + size; y++) {
      for (let x = px; x < px + size; x++) {
        if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.data[y * this.w + x] = c
      }
    }
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

/**
 * The shared poses are authored for 30px legs and a 20px torso. Stretch them
 * to this body: hip height follows the legs, arm targets follow the shoulders.
 */
function adaptPose(pose: Pose, body: BodyDims): Pose {
  const k = (body.thigh + body.shin) / REF_LEGS
  const dt = body.torso - REF_TORSO
  if (k === 1 && dt === 0) return pose
  const hipY = pose.hip[1] * k
  const lean = pose.lean * D2R
  const shoulderShift: Vec2 = [dt * Math.sin(lean), hipY - pose.hip[1] + dt * Math.cos(lean)]
  const leg = (l: Limb): Limb =>
    l.ik ? { ik: [l.ik[0] * k, l.ik[1] <= 3 ? l.ik[1] : l.ik[1] * k] } : l
  const arm = (l: Limb): Limb => (l.ik ? { ik: add(l.ik, shoulderShift) } : l)
  return {
    ...pose,
    hip: [pose.hip[0], hipY],
    nearLeg: leg(pose.nearLeg),
    farLeg: leg(pose.farLeg),
    nearArm: arm(pose.nearArm),
    farArm: arm(pose.farArm),
  }
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
    '', p.outline, p.skin, p.skinShade, p.hair, p.hairShade, p.top, p.topShade, p.jacket, p.jacketShade,
    p.legs, p.legsShade, p.shoe, p.shoeShine, p.tie, p.tieShade, p.eye, p.belt, p.accent,
    p.prop, p.propShade, p.propB, p.propDark,
  ]
  return Uint32Array.from(order.map((c, i) => (i === T ? 0 : hexToABGR(c))))
}

// ---------------------------------------------------------------------------
// Body parts
// ---------------------------------------------------------------------------

interface Ctx {
  buf: PixelBuffer
  body: BodyDims
  look: Look
}

function drawLeg(c: Ctx, hip: Vec2, limb: Limb, far: boolean) {
  const { buf, body, look } = c
  const { joint: knee, end: ankle } = solveLimb(hip, limb, body.thigh, body.shin, 'leg')
  const shape = union(capsule(hip, knee, body.thighW / 2), capsule(knee, ankle, body.shinW / 2))
  buf.paint(shape, boundsOf([hip, knee, ankle], 7), far ? LEGS_S : LEGS, far ? null : LEGS_S)
  // planted feet stay flat on the floor; airborne/kicking feet follow the shin
  const s = norm(sub(ankle, knee))
  const planted = !!limb.ik && limb.ik[1] <= 3
  const f: Vec2 = planted ? [1, 0] : perp(s)
  if (look.shoes === 'heels') {
    const toe = add(add(ankle, mul(f, 4.5)), planted ? [0, -1.2] : mul(s, 1.2))
    const heelTop = add(ankle, mul(f, -1.2))
    const heelTip = add(heelTop, mul(planted ? [0, -1] : s, 2.6))
    buf.paint(capsule(heelTop, toe, 1.9), boundsOf([heelTop, toe], 4), SHOE, far ? null : SHOE_H, -1)
    buf.paint(capsule(heelTop, heelTip, 1), boundsOf([heelTop, heelTip], 3), SHOE, null)
  } else if (look.shoes === 'sneakers') {
    const heel = add(ankle, mul(f, -2))
    const toe = add(add(ankle, mul(f, 5.5)), planted ? [0, 0] : mul(s, 0.6))
    buf.paint(capsule(heel, toe, 2.9), boundsOf([heel, toe], 4), SHOE, far ? SHOE_H : null, 1, (x, y) => {
      // coloured stripe across the middle of the shoe
      const q = dot(sub([x, y], ankle), f)
      return q > 0.5 && q < 2.5 && !far ? ACC : null
    })
  } else {
    const heel = add(ankle, mul(f, -1.5))
    const toe = add(add(ankle, mul(f, 4.5)), planted ? [0, 0] : mul(s, 0.6))
    buf.paint(capsule(heel, toe, 2.4), boundsOf([heel, toe], 4), SHOE, far ? null : SHOE_H, -1)
  }
  return knee
}

function drawSkirt(c: Ctx, hip: Vec2, knees: Vec2[]) {
  const mid = mul(add(knees[0], knees[1]), 0.5)
  const d = norm(sub(mid, hip))
  const hw = c.body.hipW / 2
  const n = perp(d)
  const top = add(hip, mul(d, -2))
  const bottom = add(hip, mul(d, 14))
  const pts: Vec2[] = [add(top, mul(n, hw)), add(bottom, mul(n, hw + 2)), add(bottom, mul(n, -hw - 2)), add(top, mul(n, -hw))]
  c.buf.paint(polygon(pts), boundsOf(pts, 2), JACK, JACK_S, 2)
}

function drawArm(c: Ctx, shoulder: Vec2, limb: Limb, far: boolean) {
  const { buf, body, look } = c
  const { joint: elbow, end: hand } = solveLimb(shoulder, limb, body.upperArm, body.foreArm, 'arm')
  const sleeve = look.top === 'jacket' ? JACK : TOP
  const sleeveS = look.top === 'jacket' ? JACK_S : TOP_S
  const upper = capsule(shoulder, elbow, body.armW / 2)
  const fore = capsule(elbow, hand, body.foreW / 2)
  const bb = boundsOf([shoulder, elbow, hand], 5)
  const stripes = look.stripes && !far ? (_x: number, y: number) => (Math.floor(y / 2.5) % 2 === 0 ? ACC : null) : undefined
  if (look.top === 'tshirt') {
    // short sleeves: bare forearms
    buf.paint(fore, bb, far ? SKIN_S : SKIN, far ? null : SKIN_S)
    buf.paint(upper, bb, far ? TOP_S : TOP, far ? null : TOP_S, 1, stripes)
  } else {
    buf.paint(union(upper, fore), bb, far ? sleeveS : sleeve, far ? null : sleeveS, 1, stripes)
  }
  const dir = norm(sub(hand, elbow))
  const fist = add(hand, mul(dir, 1))
  return { fist, dir }
}

function drawFist(c: Ctx, fist: Vec2, far: boolean) {
  c.buf.paint(circle(fist, 2.8), boundsOf([fist], 4), far ? SKIN_S : SKIN, far ? null : SKIN_S)
}

function drawProp(c: Ctx, fist: Vec2, forearm: Vec2, pose: Pose) {
  const { buf, look } = c
  const pp = pose.prop ?? {}
  if (look.prop === 'none' || pp.hidden) return
  // neutral poses: each prop has its own resting angle (so it doesn't hide the face)
  const REST: Record<string, number> = { folder: 12, keyboard: 55, phone: 165, laptop: 20, whiteboard: 4, cash: 70 }
  const d = pp.angle !== undefined ? dirOf(pp.angle) : pp.follow ? forearm : dirOf(REST[look.prop])
  const n = perp(d)
  if (look.prop === 'laptop' && !pp.open) {
    // closed laptop: a slab with a glowing edge and a sticker
    const pts = box(add(fist, mul(d, -2)), d, 17, 2.8)
    buf.paint(polygon(pts), boundsOf(pts, 2), PROP, PROP_S, 1, (x, y) => {
      const rel = sub([x, y], fist)
      const along = dot(rel, d) + 2
      const across = dot(rel, n)
      if (across < -1.2) return PROP_S
      if (along > 9 && along < 12 && across > -0.5) return ACC
      return null
    })
    return
  }
  if (look.prop === 'laptop') {
    // open laptop: keyboard deck + screen at an angle, glowing inside
    const hinge = add(fist, mul(d, 1))
    const deck = box(hinge, d, 15, 1.4)
    buf.paint(polygon(deck), boundsOf(deck, 2), PROP, PROP_S, 1)
    const e = norm(add(mul(d, Math.cos(105 * D2R)), mul(n, Math.sin(105 * D2R))))
    const lid = box(hinge, e, 13, 1.4)
    buf.paint(polygon(lid), boundsOf(lid, 2), PROP, PROP_S, 1)
    for (let a = 2; a < 12; a++) buf.dot(add(add(hinge, mul(e, a)), mul(perp(e), -1.6)), PROP_B)
    buf.dot(add(add(hinge, mul(e, 7)), mul(perp(e), 0.8)), ACC)
    return
  }
  if (look.prop === 'whiteboard') {
    // a whole whiteboard: aluminium frame, boxes-and-arrows sketch
    const pts = box(add(fist, mul(d, -3)), d, 30, 11)
    buf.paint(polygon(pts), boundsOf(pts, 2), PROP_B, null, 1, (x, y) => {
      const rel = sub([x, y], fist)
      const along = dot(rel, d) + 3
      const across = dot(rel, n)
      if (along < 1.5 || along > 28.5 || Math.abs(across) > 9.5) return PROP
      const inBox = (a0: number, a1: number, c0: number, c1: number) =>
        along >= a0 && along <= a1 && across >= c0 && across <= c1 && !(along > a0 + 1 && along < a1 - 1 && across > c0 + 1 && across < c1 - 1)
      if (inBox(5, 11, 2, 7) || inBox(17, 24, -7, -2)) return PROP_D
      if (inBox(18, 25, 3, 7)) return ACC
      if (Math.abs(across - (4.5 - (along - 11) * 0.9)) < 0.6 && along > 11 && along < 17) return PROP_D
      return null
    })
    return
  }
  if (look.prop === 'cash') {
    const pts = box(add(fist, mul(d, -1)), d, 8, 3)
    buf.paint(polygon(pts), boundsOf(pts, 2), PROP, PROP_S, 1, (x, y) => {
      const along = dot(sub([x, y], fist), d) + 1
      return along > 3.2 && along < 4.8 ? PROP_B : null
    })
    return
  }
  if (look.prop === 'folder') {
    // thick legal binder, burgundy with a white label; opened = two panels + flying papers
    if (pp.open) {
      for (const tilt of [-38, 38]) {
        const dd = norm(add(mul(d, Math.cos(tilt * D2R)), mul(n, Math.sin(tilt * D2R))))
        const pts = box(add(fist, mul(dd, -1)), dd, 17, 1.8)
        buf.paint(polygon(pts), boundsOf(pts, 2), PROP, PROP_S, 1)
      }
      for (let i = 0; i < 3; i++) {
        const tilt = -16 + i * 16
        const dd = norm(add(mul(d, Math.cos(tilt * D2R)), mul(n, Math.sin(tilt * D2R))))
        const pts = box(add(fist, mul(dd, 1)), dd, 14, 3)
        buf.paint(polygon(pts), boundsOf(pts, 2), PROP_B, null)
      }
      return
    }
    const pts = box(add(fist, mul(d, -3)), d, 17, 6)
    buf.paint(polygon(pts), boundsOf(pts, 2), PROP, PROP_S, 1, (x, y) => {
      const rel = sub([x, y], fist)
      const along = dot(rel, d)
      const across = dot(rel, n)
      if (across < -3.8) return PROP_D // spine
      if (across > 3.8) return PROP_B // paper edge
      if (along > 7 && along < 11 && across > -2 && across < 2) return PROP_B // label
      return null
    })
  } else if (look.prop === 'keyboard') {
    // long beige 90s keyboard held like a club
    const pts = box(add(fist, mul(d, -4)), d, 26, 3)
    buf.paint(polygon(pts), boundsOf(pts, 2), PROP_B, PROP_S, 1)
    for (let a = 0; a < 20; a += 2) {
      for (const k of [-0.9, 1.1]) buf.dot(add(add(fist, mul(d, 2 + a)), mul(n, k)), PROP_D)
    }
    // the cable
    buf.dot(add(fist, mul(d, -5)), OUT)
    buf.dot(add(add(fist, mul(d, -6)), mul(n, -1)), OUT)
  } else if (look.prop === 'phone') {
    // brick phone with an antenna and a green screen
    const pts = box(add(fist, mul(d, -2)), d, 11, 2.6)
    buf.paint(polygon(pts), boundsOf(pts, 2), PROP, PROP_S, 1)
    const tip = add(fist, mul(d, 9))
    const ant0 = add(tip, mul(n, -1.2))
    const ant1 = add(ant0, mul(d, 5))
    buf.paint(capsule(ant0, ant1, 0.8), boundsOf([ant0, ant1], 2), OUT, null, 1, undefined, false)
    buf.dot(add(fist, mul(d, 6.5)), PROP_B)
    buf.dot(add(add(fist, mul(d, 6.5)), mul(n, 1)), PROP_B)
    buf.dot(add(fist, mul(d, 3.5)), PROP_D)
  }
}

function drawHead(c: Ctx, neckBase: Vec2, angle: number, face: Face) {
  const { buf, body, look } = c
  const hu: Vec2 = [Math.sin(angle * D2R), Math.cos(angle * D2R)] // head "up"
  const hp: Vec2 = [Math.cos(angle * D2R), -Math.sin(angle * D2R)] // head "forward"
  const r = body.headR
  const ctr = add(neckBase, mul(hu, body.neck + r - 1))
  const at = (lx: number, ly: number): Vec2 => add(ctr, add(mul(hp, lx), mul(hu, ly)))
  const local = (x: number, y: number): Vec2 => {
    const d: Vec2 = [x - ctr[0], y - ctr[1]]
    return [d[0] * hp[0] + d[1] * hp[1], d[0] * hu[0] + d[1] * hu[1]]
  }

  // neck
  const n0 = add(neckBase, mul(hu, -1))
  const n1 = add(neckBase, mul(hu, body.neck + 2))
  if (look.top === 'turtleneck') buf.paint(capsule(n0, n1, 3.3), boundsOf([n0, n1], 5), TOP, TOP_S)
  else buf.paint(capsule(n0, n1, 2.8), boundsOf([n0, n1], 4), SKIN_S, null)

  // hair behind the head
  if (look.hair === 'bun') {
    const bun = at(-r + 0.5, r - 1.5)
    buf.paint(circle(bun, 3.8), boundsOf([bun], 5), HAIR, HAIR_S, 1)
  }

  // skull + big caricature jaw
  const jaw = at(2.5, -3.5)
  const head = union(circle(ctr, r), circle(jaw, r * 0.7))
  buf.paint(head, boundsOf([ctr], r + 3), SKIN, SKIN_S, 2, (x, y) => {
    if (!look.beard) return null
    const [lx, ly] = local(x, y)
    return ly < -1.5 && lx > -3.5 ? (ly < -5 ? HAIR_S : HAIR) : null
  })

  // hair on top
  let hairC: Vec2
  let hairR: number
  let region: (lx: number, ly: number) => boolean
  switch (look.hair) {
    case 'bun':
      hairC = at(-0.5, 0.8)
      hairR = r + 0.5
      region = (lx, ly) => ly > 2.4 - lx * 0.12 || (lx < -3 && ly > -2.5)
      break
    case 'messy':
      hairC = at(-0.8, 1.6)
      hairR = r + 1.6
      region = (lx, ly) => ly > 1.2 - lx * 0.1 || (lx < -2.5 && ly > -5)
      break
    case 'bob':
      // chin-length bob with a straight fringe
      hairC = at(-0.4, 0.2)
      hairR = r + 1.5
      region = (lx, ly) => ly > 2 - lx * 0.05 || (lx < 1.2 && ly > -6.5)
      break
    case 'crew':
      hairC = at(-0.5, 0.8)
      hairR = r + 0.3
      region = (lx, ly) => ly > 3.4 - lx * 0.2 || (lx < -4 && ly > -1)
      break
    case 'slick':
      hairC = at(-0.6, 1)
      hairR = r + 0.6
      region = (lx, ly) => ly > 2.8 - lx * 0.18 || (lx < -3 && ly > -1.5)
      break
    default:
      hairC = at(-1, 1.2)
      hairR = r + 0.8
      region = (lx, ly) => ly > 2.2 - lx * 0.15 || (lx < -2.5 && ly > -3.5)
  }
  const tufts: Shape[] = []
  if (look.hair === 'messy') tufts.push(circle(at(-4, r + 0.6), 2.4), circle(at(0.5, r + 1.4), 2.4), circle(at(4, r), 2))
  if (look.hair === 'slick') tufts.push(circle(at(3.5, r - 0.8), 3))
  const hair: Shape = (x, y, i) => {
    if (tufts.some((t) => t(x, y, i))) return true
    if (!circle(hairC, hairR)(x, y, i)) return false
    const [lx, ly] = local(x, y)
    return region(lx, ly)
  }
  buf.paint(hair, boundsOf([hairC], hairR + 5), HAIR, HAIR_S, 2)
  if (look.hair === 'slick') {
    // gel shine
    for (let i = -2; i <= 1; i++) buf.dot(at(i, r - 0.2 + i * 0.15), EYE)
  }

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
  if (look.lipstick) {
    buf.dot(at(3.5, 1.6), OUT) // lashes
    buf.dot(at(5.5, 1.3), OUT)
  }
  // angry eyebrow
  buf.dot(at(2.5, 2.6), OUT)
  buf.dot(at(3.5, 2.6), OUT)
  buf.dot(at(4.5, 2.1), OUT)
  buf.dot(at(5.5, 1.6), OUT)
  if (look.glasses === 'normal') {
    for (let lx = 2; lx <= 6.5; lx += 1) {
      buf.dot(at(lx, 1.6), ACC)
      buf.dot(at(lx, -0.7), ACC)
    }
    buf.dot(at(2, 0.5), ACC)
    buf.dot(at(6.8, 0.5), ACC)
    buf.dot(at(1, 0.9), ACC)
    buf.dot(at(0, 0.9), ACC)
    if (face !== 'hurt' && face !== 'ko') buf.dot(at(5.5, 0.5), EYE)
  } else if (look.glasses === 'huge') {
    // enormous round lenses
    for (let lx = 0; lx <= 9; lx += 0.5) {
      for (let ly = -3.5; ly <= 4.5; ly += 0.5) {
        const d = Math.hypot(lx - 4.6, ly - 0.6)
        if (d > 2.6 && d <= 3.6) buf.dot(at(lx, ly), ACC)
      }
    }
    for (let lx = -0.5; lx <= 1.5; lx += 1) buf.dot(at(lx, 1.2), ACC)
    if (face !== 'hurt' && face !== 'ko') {
      buf.dot(at(3.5, 1.8), EYE)
      buf.dot(at(4.5, 0.5), OUT)
      buf.dot(at(5.5, 0.5), OUT)
    }
  } else if (look.glasses === 'shades') {
    for (let lx = 2; lx <= 7.5; lx += 1) {
      buf.dot(at(lx, 1.5), OUT)
      buf.dot(at(lx, 0.5), OUT)
      buf.dot(at(lx - 0.5, -0.5), OUT)
    }
    buf.dot(at(6.2, 1.3), EYE)
    for (let lx = -0.5; lx <= 1.5; lx += 1) buf.dot(at(lx, 1.2), OUT)
  }
  // nose
  buf.dot(at(r + 0.2, -0.8), SKIN)
  buf.dot(at(r + 0.2, -1.8), SKIN)
  buf.dot(at(r + 1.2, -1.3), OUT)
  // mouth
  const mouth = look.lipstick ? ACC : OUT
  if (face === 'shout' || face === 'hurt') {
    buf.dot(at(4.5, -4.2), OUT)
    buf.dot(at(5.5, -4.2), OUT)
    buf.dot(at(4.5, -5.2), mouth)
    buf.dot(at(5.5, -5.2), mouth)
    if (look.grin) {
      buf.dot(at(6.5, -4.2), OUT)
      buf.dot(at(6.5, -5.2), OUT)
      buf.dot(at(4.5, -6.2), OUT)
      buf.dot(at(5.5, -6.2), OUT)
    }
  } else if (look.grin) {
    // salesman smile: a row of very white teeth
    for (let lx = 3.5; lx <= 6.5; lx++) {
      buf.dot(at(lx, -3.6), OUT)
      buf.dot(at(lx, -4.5), EYE)
      buf.dot(at(lx, -5.4), OUT)
    }
  } else {
    buf.dot(at(4.5, -4.5), mouth)
    buf.dot(at(5.5, -4.2), mouth)
  }
}

function drawTorso(c: Ctx, hip: Vec2, lean: number) {
  const { buf, body, look } = c
  const u: Vec2 = [Math.sin(lean * D2R), Math.cos(lean * D2R)] // torso up
  const p: Vec2 = [Math.cos(lean * D2R), -Math.sin(lean * D2R)] // torso forward
  const neck = add(hip, mul(u, body.torso))
  const sw = body.shoulderW / 2
  const hw = body.hipW / 2
  const quad = polygon([add(hip, mul(p, -hw)), add(hip, mul(p, hw)), add(neck, mul(p, sw)), add(neck, mul(p, -sw))])
  const parts: Shape[] = [quad, circle(add(neck, mul(u, -3)), sw - 0.5)]
  if (look.belly > 0) {
    const bc = add(add(hip, mul(u, body.torso * 0.36)), mul(p, hw * 0.35 + look.belly * 0.5))
    parts.push(circle(bc, hw * 0.75 + look.belly * 0.55))
  }
  const torso = union(...parts)

  // tie strip on the chest side
  const tieTop = add(neck, mul(p, sw - 3))
  const tieBot = add(add(hip, mul(u, 6)), mul(p, hw - 1.5 + look.belly * 0.6))
  const tieShape = capsule(tieTop, tieBot, 1.4)
  // jacket V opening
  const vee = polygon([
    add(neck, mul(p, sw + 1)),
    add(neck, mul(p, sw - 7)),
    add(add(hip, mul(u, body.torso * 0.45)), mul(p, hw + 0.5)),
  ])
  const jacket = look.top === 'jacket'
  const vest = look.top === 'vest'
  const base = jacket || vest ? JACK : TOP
  const shade = jacket || vest ? JACK_S : TOP_S

  const zone = (x: number, y: number, shaded: boolean): number | null => {
    const rel = sub([x, y], hip)
    const h = dot(rel, u) // height along the torso
    const q = dot(rel, p) // forward/back across the torso
    if (h < 3.5) {
      if (look.skirt) return shaded ? JACK_S : JACK
      if (jacket) return shaded ? JACK_S : JACK
      return shaded ? LEGS_S : LEGS
    }
    if (h < 5.5 && !jacket && !look.skirt) return BELT
    if (vest) {
      // fleece vest over a shirt: collar and zipper
      if (h > body.torso - 3.5 && q > sw - 7) return shaded ? TOP_S : TOP
      if (Math.abs(q - (sw - 3)) < 0.6) return JACK_S
      return null
    }
    if (look.stripes && Math.floor(h / 3) % 2 === 0) return ACC
    if (jacket && vee(x, y, 0)) {
      if (look.tie && tieShape(x, y, 0)) return TIE
      return shaded ? TOP_S : TOP
    }
    if (!jacket && look.tie && tieShape(x, y, 0)) return h > body.torso - 3.5 ? TIE_S : shaded ? TIE_S : TIE
    if (look.logo) {
      // "</>" printed on the geek t-shirt
      const lx = Math.floor(q - (hw * 0.2 + look.belly * 0.4))
      const ly = Math.floor(h - body.torso * 0.62)
      const glyph = ['#...#.', '.#.#..', '#...#.']
      if (ly >= -1 && ly <= 1 && lx >= 0 && lx < 6) {
        const row = glyph[1 - ly]
        if (row[lx] === '#') return TIE
      }
    }
    if (jacket && Math.abs(h - body.torso * 0.28) < 0.6 && q > hw - 2) return OUT // pocket line
    return null
  }
  buf.paint(torso, boundsOf([hip, neck], sw + 4 + look.belly), base, shade, 2, zone)
  return { neck, u }
}

function renderPoseToCanvas(rawPose: Pose, body: BodyDims, look: Look, palette: Palette, k = 1): HTMLCanvasElement {
  const pose = adaptPose(rawPose, body)
  const c: Ctx = { buf: new PixelBuffer(k), body, look }
  const hip = pose.hip
  const u: Vec2 = [Math.sin(pose.lean * D2R), Math.cos(pose.lean * D2R)]
  const neckPt = add(hip, mul(u, body.torso))
  const shoulder = add(neckPt, mul(u, -3))

  // back to front: far arm, far leg, near leg, (skirt), torso, head, near arm + prop
  const far = drawArm(c, add(shoulder, [-1, 0]), pose.farArm, true)
  drawFist(c, far.fist, true)
  const kneeF = drawLeg(c, add(hip, [1, 0]), pose.farLeg, true)
  const kneeN = drawLeg(c, add(hip, [-1, 0]), pose.nearLeg, false)
  if (look.skirt) drawSkirt(c, hip, [kneeN, kneeF])
  const { neck } = drawTorso(c, hip, pose.lean)
  drawHead(c, neck, pose.lean + (pose.head ?? 0), pose.face ?? 'normal')
  const near = drawArm(c, shoulder, pose.nearArm, false)
  drawProp(c, near.fist, near.dir, pose)
  drawFist(c, near.fist, false)

  const canvas = document.createElement('canvas')
  canvas.width = c.buf.w
  canvas.height = c.buf.h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(c.buf.w, c.buf.h)
  const out = new Uint32Array(img.data.buffer)
  const table = paletteTable(palette)
  for (let i = 0; i < c.buf.data.length; i++) out[i] = table[c.buf.data[i]]
  ctx.putImageData(img, 0, 0)
  return canvas
}

const cache = new Map<string, HTMLCanvasElement>()

export function spriteFor(pose: Pose, body: BodyDims, look: Look, palette: Palette, charId: string): HTMLCanvasElement {
  const key = `${charId}|${palette.id}|${JSON.stringify(pose)}`
  let c = cache.get(key)
  if (!c) {
    if (cache.size > 900) cache.clear()
    c = renderPoseToCanvas(pose, body, look, palette)
    cache.set(key, c)
  }
  return c
}

/** A high-resolution render for cut-scenes (not cached). Origin is (SPR_OX*k, SPR_OY*k). */
export function closeUpSprite(pose: Pose, body: BodyDims, look: Look, palette: Palette, k: number): HTMLCanvasElement {
  return renderPoseToCanvas(pose, body, look, palette, k)
}

/** Where the head and hands end up for a pose (sprite space, y up), for drawing extras on top. */
export function skeletonOf(rawPose: Pose, body: BodyDims) {
  const pose = adaptPose(rawPose, body)
  const u: Vec2 = [Math.sin(pose.lean * D2R), Math.cos(pose.lean * D2R)]
  const neck = add(pose.hip, mul(u, body.torso))
  const shoulder = add(neck, mul(u, -3))
  const ha = (pose.lean + (pose.head ?? 0)) * D2R
  const hu: Vec2 = [Math.sin(ha), Math.cos(ha)]
  const hp: Vec2 = [Math.cos(ha), -Math.sin(ha)]
  const head = add(neck, mul(hu, body.neck + body.headR - 1))
  const near = solveLimb(shoulder, pose.nearArm, body.upperArm, body.foreArm, 'arm')
  const far = solveLimb(add(shoulder, [-1, 0]), pose.farArm, body.upperArm, body.foreArm, 'arm')
  return { neck, head, headUp: hu, headFwd: hp, nearHand: near.end, nearElbow: near.joint, farHand: far.end }
}
