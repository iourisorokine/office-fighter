import type { Fighter } from '../fighter/Fighter'
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

type PlanKind = 'approach' | 'retreat' | 'wait' | 'crouch' | 'guard' | 'jumpIn' | 'jumpBack' | 'attack'
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

  constructor(difficulty: Difficulty) {
    this.p = PARAMS[difficulty]
  }

  poll(self: Fighter, opp: Fighter): InputSnapshot {
    const held = noButtons()
    const pressed = noButtons()
    const toward: 'left' | 'right' = opp.x >= self.x ? 'right' : 'left'
    const away: 'left' | 'right' = toward === 'right' ? 'left' : 'right'
    const dist = Math.abs(opp.x - self.x)

    const finish = (): InputSnapshot => {
      for (const k of ['up', 'lk', 'hk'] as const) if (held[k] && !this.prevHeld[k]) pressed[k] = true
      this.prevHeld = held
      return { held, pressed }
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
    if (this.plan.frames <= 0 || (this.plan.kind === 'approach' && dist < 34)) this.plan = this.choosePlan(dist)
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
      case 'wait':
        break
    }
    // stop holding up once airborne so we don't auto-rejump forever
    if ((plan.kind === 'jumpIn' || plan.kind === 'jumpBack') && self.airborne) held.up = false
    return finish()
  }

  private choosePlan(dist: number): Plan {
    const [t0, t1] = this.p.think
    const a = this.p.aggression
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
