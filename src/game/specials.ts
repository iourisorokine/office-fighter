import { VIEW_W } from './constants'
import type { Fighter } from './fighter/Fighter'
import type { HitProps, SpawnKind } from './types'

/**
 * Special-move objects that live outside the fighters: projectiles
 * (coffee cup, formal complaint, mega bullshit) and the SEV-1 incident.
 */

export type ProjectileKind = Exclude<SpawnKind, 'incident'>

export interface Projectile {
  id: number
  owner: 0 | 1
  kind: ProjectileKind
  x: number
  /** centre height above the floor */
  y: number
  vx: number
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
    x: f.x + f.facing * d.at[0],
    y: f.y + d.at[1],
    vx: f.facing * d.speed,
    w: kind === 'bullshit' ? 16 : d.w,
    h: kind === 'bullshit' ? 24 : d.h,
    t: 0,
    life: d.life,
    hit: d.hit,
    dead: false,
  }
}

export function moveProjectile(p: Projectile) {
  p.t++
  p.x += p.vx
  if (p.kind === 'bullshit') {
    // the cloud swells as it travels
    const k = Math.min(1, p.t / 18)
    p.w = 16 + (PROJECTILES.bullshit.w - 16) * k
    p.h = 24 + (PROJECTILES.bullshit.h - 24) * k
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

export const INCIDENT_WARNING = 45
export const INCIDENT_END = 90

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
