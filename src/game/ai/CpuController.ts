import type { Fighter } from '../fighter/Fighter'
import type { ArenaView } from '../Match'
import { noButtons, type Buttons, type InputSnapshot } from '../types'

export type Difficulty = 'easy' | 'normal' | 'hard'

interface Params {
  /** chance to guard a given attack */
  block: number
  /** chance to guess a low correctly when blocking */
  lowRead: number
  /** how often it chooses to attack when in range */
  aggression: number
  /** chance to kick an incoming jump out of the air */
  antiAir: number
  /** frames between decisions (lower = snappier) */
  think: [number, number]
}

const PARAMS: Record<Difficulty, Params> = {
  easy: { block: 0.2, lowRead: 0.3, aggression: 0.35, antiAir: 0.1, think: [18, 34] },
  normal: { block: 0.5, lowRead: 0.55, aggression: 0.55, antiAir: 0.4, think: [10, 22] },
  hard: { block: 0.82, lowRead: 0.85, aggression: 0.72, antiAir: 0.75, think: [5, 12] },
}

type PlanKind = 'approach' | 'retreat' | 'wait' | 'crouch' | 'guard' | 'jumpIn' | 'jumpBack' | 'attack' | 'special'
type AttackKind = 'lk' | 'hk' | 'clk' | 'chk'

interface Plan {
  kind: PlanKind
  frames: number
  attack?: AttackKind
}

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const chance = (p: number) => Math.random() < p

/**
 * A simple, readable CPU opponent: it picks short "plans" (walk in, wait,
 * poke, jump in...) based on distance, and reacts to attacks and jumps with
 * a difficulty-dependent chance of getting it right.
 */
export class CpuController {
  private readonly p: Params
  private plan: Plan = { kind: 'wait', frames: 30 }
  private prevHeld: Buttons = noButtons()
  private seenAttack = -1
  private willBlock = false
  private blockLow = false
  private seenJump = false
  private willAntiAir = false
  private seenProjectile = -1
  private dodgeProjectile: 'jump' | 'block' | 'none' = 'none'
  private seenIncident = false
  private seenTower: object | null = null
  private dodgeTower = false
  private dodgeIncident = false

  /** which player this CPU controls (to tell its own projectiles from the opponent's) */
  private readonly side: 0 | 1

  constructor(difficulty: Difficulty, side: 0 | 1) {
    this.p = PARAMS[difficulty]
    this.side = side
  }

  poll(self: Fighter, opp: Fighter, arena: ArenaView): InputSnapshot {
    const held = noButtons()
    const pressed = noButtons()
    const toward: 'left' | 'right' = opp.x >= self.x ? 'right' : 'left'
    const away: 'left' | 'right' = toward === 'right' ? 'left' : 'right'
    const dist = Math.abs(opp.x - self.x)

    let special = false
    const finish = (): InputSnapshot => {
      for (const k of ['up', 'lk', 'hk'] as const) if (held[k] && !this.prevHeld[k]) pressed[k] = true
      this.prevHeld = held
      return { held, pressed, special }
    }

    // --- dodge the opponent's incident by jumping ---------------------------
    const inc = arena.incident
    if (inc && !inc.fired && inc.owner !== this.side) {
      if (!this.seenIncident) {
        this.seenIncident = true
        this.dodgeIncident = chance(this.p.block)
      }
      // or punish the typing developer if close enough
      if (dist < 45 && self.isActionable()) {
        held.hk = true
        return finish()
      }
      if (this.dodgeIncident && inc.t > 30 && self.isActionable()) {
        held.up = true
        return finish()
      }
    } else this.seenIncident = false

    // --- a tower is about to land on us: walk out of the shadow -------------
    const tower = arena.towers.find((tw) => tw.owner !== this.side && !tw.fired && Math.abs(tw.x - self.x) < 36)
    if (tower && tower !== this.seenTower) {
      this.seenTower = tower
      this.dodgeTower = chance(this.p.block + 0.1)
    }
    if (tower && this.dodgeTower && self.isActionable() && tower.t > 12) {
      held[tower.x > self.x ? 'left' : 'right'] = true
      return finish()
    }

    // --- incoming projectile: jump over it or block -------------------------
    const threat = arena.projectiles.find(
      (p) => Math.sign(p.vx) === Math.sign(self.x - p.x) && Math.abs(p.x - self.x) < 110 && p.owner !== this.side,
    )
    if (threat) {
      if (threat.id !== this.seenProjectile) {
        this.seenProjectile = threat.id
        const r = Math.random()
        this.dodgeProjectile = r < this.p.antiAir * 0.8 && threat.kind !== 'bullshit' ? 'jump' : r < this.p.block + 0.1 ? 'block' : 'none'
      }
      const gap = Math.abs(threat.x - self.x)
      if (this.dodgeProjectile === 'jump' && gap < 60 && self.isActionable()) {
        held.up = true
        held[toward] = true
        return finish()
      }
      if (this.dodgeProjectile === 'block' && gap < 80) {
        held[away] = true
        return finish()
      }
    }

    // --- react to a fresh attack -------------------------------------------
    if (opp.state === 'attack' && opp.move && opp.attackSerial !== this.seenAttack) {
      this.seenAttack = opp.attackSerial
      this.willBlock = chance(this.p.block)
      const lvl = opp.move.level
      const readRight = chance(this.p.lowRead)
      this.blockLow = lvl === 'low' ? readRight : lvl === 'overhead' ? !readRight : chance(0.4)
    }
    const oppAttacking = opp.state === 'attack' && opp.attackPhase() !== 'recovery' && dist < 100
    if (oppAttacking && this.willBlock) {
      held[away] = true
      held.down = this.blockLow
      this.plan = { kind: 'guard', frames: 6 }
      return finish()
    }

    // --- anti-air -----------------------------------------------------------
    if (opp.airborne && (opp.state === 'jump' || opp.state === 'attack')) {
      if (!this.seenJump) {
        this.seenJump = true
        this.willAntiAir = chance(this.p.antiAir)
      }
      const incoming = Math.sign(opp.vx) === Math.sign(self.x - opp.x) || dist < 30
      if (incoming && dist < 60 && self.isActionable()) {
        if (this.willAntiAir && opp.y < 44 && opp.vy < 0) {
          held.hk = true
          this.plan = { kind: 'wait', frames: 25 }
          return finish()
        }
        if (!this.willAntiAir && this.willBlock) {
          held[away] = true
          return finish()
        }
      }
    } else {
      this.seenJump = false
    }

    // --- follow the current plan --------------------------------------------
    if (this.plan.frames <= 0 || (this.plan.kind === 'approach' && dist < 34)) this.plan = this.choosePlan(dist, self, opp)
    const plan = this.plan
    plan.frames--
    switch (plan.kind) {
      case 'approach':
        held[toward] = true
        break
      case 'retreat':
        held[away] = true
        break
      case 'crouch':
        held.down = true
        break
      case 'guard':
        held[away] = true
        held.down = chance(0.5)
        break
      case 'jumpIn':
        held.up = true
        held[toward] = true
        if (self.airborne && opp.y === 0 && dist < 48 && self.vy < 1) held[chance(0.6) ? 'hk' : 'lk'] = true
        break
      case 'jumpBack':
        held.up = true
        held[away] = true
        break
      case 'attack':
        if (plan.attack === 'lk') held.lk = true
        if (plan.attack === 'hk') held.hk = true
        if (plan.attack === 'clk') held.down = held.lk = true
        if (plan.attack === 'chk') held.down = held.hk = true
        plan.attack = undefined // press once, then just wait out the recovery
        if (self.state === 'attack' && self.move?.crouch) held.down = true
        break
      case 'special':
        if (plan.attack !== undefined) {
          special = true
          plan.attack = undefined
        }
        break
      case 'wait':
        break
    }
    // stop holding up once airborne so we don't auto-rejump forever
    if ((plan.kind === 'jumpIn' || plan.kind === 'jumpBack') && self.airborne) held.up = false
    return finish()
  }

  private choosePlan(dist: number, self: Fighter, opp: Fighter): Plan {
    const [t0, t1] = this.p.think
    const a = this.p.aggression
    // specials: each character has a range where theirs makes sense
    if (self.specialCd === 0) {
      const kind = self.char.special.move.spawn?.kind
      let odds = 0
      if (kind === 'incident') odds = dist > 70 && !opp.airborne ? 0.3 : 0
      else if (kind === 'bullshit') odds = dist > 40 && dist < 230 ? 0.25 : 0
      else if (kind === 'tower') odds = dist > 60 ? 0.3 : 0.1
      else if (kind === 'raise') odds = 0.3
      else odds = dist > 90 ? 0.35 : 0
      if (chance(odds * (0.5 + a))) return { kind: 'special', frames: 30, attack: 'lk' }
    }
    // characters whose light attack is a throw (the VC's cash) use it at mid range
    if (self.char.moves.standLK.spawn && dist > 50 && dist < 150 && chance(0.2 * (0.5 + a))) {
      return { kind: 'attack', frames: 24, attack: 'lk' }
    }
    if (dist > 110) {
      if (chance(0.12 * a)) return { kind: 'jumpIn', frames: 45 }
      return chance(0.85) ? { kind: 'approach', frames: rand(20, 50) } : { kind: 'wait', frames: rand(t0, t1) }
    }
    if (dist > 52) {
      const r = Math.random()
      if (r < 0.45 * a + 0.2) return { kind: 'approach', frames: rand(10, 30) }
      if (r < 0.45 * a + 0.2 + 0.15 * a) return { kind: 'jumpIn', frames: 45 }
      if (r < 0.75) return { kind: 'wait', frames: rand(t0, t1) }
      if (r < 0.88) return { kind: 'retreat', frames: rand(8, 20) }
      return { kind: 'crouch', frames: rand(t0, t1) }
    }
    // close range
    if (chance(a)) {
      let attack: AttackKind
      if (dist > 45) attack = chance(0.5) ? 'hk' : 'chk'
      else {
        const r = Math.random()
        attack = r < 0.3 ? 'clk' : r < 0.55 ? 'lk' : r < 0.8 ? 'hk' : 'chk'
      }
      return { kind: 'attack', frames: 34, attack }
    }
    const r = Math.random()
    if (r < 0.35) return { kind: 'guard', frames: rand(t0, t1) }
    if (r < 0.6) return { kind: 'retreat', frames: rand(10, 24) }
    if (r < 0.7) return { kind: 'jumpBack', frames: 40 }
    return { kind: 'wait', frames: rand(t0, t1) }
  }
}
