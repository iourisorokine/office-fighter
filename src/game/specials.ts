import { VIEW_W } from './constants'
import type { Fighter } from './fighter/Fighter'
import type { HitProps, SpawnKind } from './types'
import {
  CHARACTER_SIZE_MULTIPLIER as SIZE,
  INCIDENT_TOTAL_FRAMES,
  INCIDENT_WARNING_FRAMES,
  MONEY_RAIN_FRAMES,
  PROJECTILE_SIZE_MULTIPLIER as PSIZE,
  PROJECTILE_SPEED_MULTIPLIER,
  MICROSERVICES_WAVE_HEIGHT,
} from './tuning'

/**
 * Special-move objects that live outside the fighters: projectiles
 * (coffee cup, formal complaint, mega bullshit, new requirement, cash,
 * the architect's microservices), and area effects (SEV-1 incident, the VC's raise).
 */

export type ProjectileKind = Exclude<SpawnKind, 'incident' | 'swarm' | 'raise'> | 'bill' | 'service'

export interface Projectile {
  id: number
  owner: 0 | 1
  kind: ProjectileKind
  x: number
  /** centre height above the floor */
  y: number
  vx: number
  /** only falling bills move vertically */
  vy: number
  /** microservices: height they weave around, and their wave phase */
  baseY?: number
  phase?: number
  /** frames to wait (invisible, not moving) before flying */
  delay?: number
  w: number
  h: number
  t: number
  life: number
  hit: HitProps
  dead: boolean
}

interface ProjectileDef {
  speed: number
  w: number
  h: number
  life: number
  /** spawn offset from the thrower: forward, height */
  at: [number, number]
  hit: HitProps
}

export const PROJECTILES: Record<ProjectileKind, ProjectileDef> = {
  requirement: {
    speed: 3,
    w: 14,
    h: 14,
    life: 150,
    at: [28, 48],
    hit: { damage: 9, hitstun: 20, blockstun: 12, pushHit: 3, pushBlock: 3.5, hitstop: 9, level: 'mid', chip: 1 },
  },
  cash: {
    speed: 4.4,
    w: 10,
    h: 8,
    life: 30,
    at: [24, 46],
    hit: { damage: 4, hitstun: 12, blockstun: 8, pushHit: 2, pushBlock: 2.5, hitstop: 6, level: 'mid' },
  },
  bill: {
    speed: 0,
    w: 10,
    h: 6,
    life: 200,
    at: [0, 0],
    hit: { damage: 2, hitstun: 10, blockstun: 6, pushHit: 1, pushBlock: 1, hitstop: 4, level: 'overhead', chip: 1 },
  },
  coffee: {
    speed: 3.4,
    w: 10,
    h: 10,
    life: 140,
    at: [22, 46],
    hit: { damage: 8, hitstun: 16, blockstun: 12, pushHit: 2.5, pushBlock: 3, hitstop: 8, level: 'mid', chip: 1 },
  },
  complaint: {
    speed: 2.8,
    w: 14,
    h: 16,
    life: 160,
    at: [28, 50],
    hit: { damage: 10, hitstun: 22, blockstun: 14, pushHit: 3, pushBlock: 3.5, hitstop: 10, level: 'mid', chip: 2 },
  },
  service: {
    speed: 3.3,
    w: 9,
    h: 8,
    life: 170,
    at: [18, 46],
    hit: { damage: 3, hitstun: 11, blockstun: 7, pushHit: 0.7, pushBlock: 0.9, hitstop: 3, level: 'mid', chip: 1 },
  },
  bullshit: {
    speed: 2.4,
    w: 40,
    h: 52,
    life: 150,
    at: [30, 40],
    hit: {
      damage: 14,
      hitstun: 0,
      blockstun: 18,
      pushHit: 0,
      pushBlock: 7,
      hitstop: 12,
      level: 'mid',
      heavy: true,
      knockdown: true,
      chip: 4,
      launch: [4.4, 4.6],
    },
  },
}

let nextId = 1

export function spawnProjectile(kind: ProjectileKind, owner: 0 | 1, f: Fighter): Projectile {
  const d = PROJECTILES[kind]
  return {
    id: nextId++,
    owner,
    kind,
    // spawn offsets are at size 1: they grow with the fighter
    x: f.x + f.facing * d.at[0] * SIZE,
    y: f.y + d.at[1] * SIZE,
    vx: f.facing * d.speed * PROJECTILE_SPEED_MULTIPLIER,
    vy: 0,
    w: (kind === 'bullshit' ? 16 : d.w) * PSIZE,
    h: (kind === 'bullshit' ? 24 : d.h) * PSIZE,
    t: 0,
    life: d.life,
    hit: d.hit,
    dead: false,
  }
}

/** A banknote falling from the ceiling (the VC's raise). */
export function spawnBill(owner: 0 | 1, x: number): Projectile {
  const d = PROJECTILES.bill
  return {
    id: nextId++,
    owner,
    kind: 'bill',
    x,
    y: 200,
    vx: (Math.random() - 0.5) * 0.8,
    vy: -2.2 - Math.random() * 0.8,
    w: d.w,
    h: d.h,
    t: Math.floor(Math.random() * 20),
    life: 400,
    hit: d.hit,
    dead: false,
  }
}

/** The architect's special: a wave of little service boxes, leaving one after another. */
export function spawnSwarm(owner: 0 | 1, f: Fighter, count: number, spacing: number): Projectile[] {
  const out: Projectile[] = []
  for (let i = 0; i < count; i++) {
    const p = spawnProjectile('service', owner, f)
    p.baseY = p.y + (i % 2 ? 6 : -4)
    p.phase = i * 1.3
    p.delay = i * spacing
    out.push(p)
  }
  return out
}

export function moveProjectile(p: Projectile) {
  if (p.delay && p.delay > 0) {
    p.delay--
    return
  }
  p.t++
  p.x += p.vx
  if (p.kind === 'service' && p.baseY !== undefined) {
    p.y = p.baseY + Math.sin(p.t * 0.16 + (p.phase ?? 0)) * MICROSERVICES_WAVE_HEIGHT
  }
  if (p.kind === 'bill') {
    p.y += p.vy
    p.x += Math.sin(p.t * 0.2) * 0.6
    if (p.y < 2) p.dead = true
  }
  if (p.kind === 'bullshit') {
    // the cloud swells as it travels
    const k = Math.min(1, p.t / 18)
    p.w = (16 + (PROJECTILES.bullshit.w - 16) * k) * PSIZE
    p.h = (24 + (PROJECTILES.bullshit.h - 24) * k) * PSIZE
    p.y = Math.max(p.h / 2, p.y)
  }
  if (p.t > p.life || p.x < -60 || p.x > VIEW_W + 60) p.dead = true
}

export function projectileRect(p: Projectile) {
  return { x0: p.x - p.w / 2, x1: p.x + p.w / 2, y0: p.y - p.h / 2, y1: p.y + p.h / 2 }
}

/** The developer's special: a warning phase, then everyone on the ground gets hit. */
export interface Incident {
  owner: 0 | 1
  t: number
  fired: boolean
}

export const INCIDENT_WARNING = INCIDENT_WARNING_FRAMES
export const INCIDENT_END = INCIDENT_TOTAL_FRAMES

export const INCIDENT_HIT: HitProps = {
  damage: 20,
  hitstun: 30,
  blockstun: 0,
  pushHit: 2,
  pushBlock: 0,
  hitstop: 14,
  level: 'unblockable',
  heavy: true,
}

/** The VC's special: it rains money for a while. */
export interface Rain {
  owner: 0 | 1
  t: number
}

export const RAIN_DURATION = MONEY_RAIN_FRAMES
