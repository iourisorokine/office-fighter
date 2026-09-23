import { CpuController, type Difficulty } from './ai/CpuController'
import { PUSH_HALF_W, ROUND_TIME, ROUNDS_TO_WIN, STAGE_LEFT, STAGE_RIGHT, VIEW_W } from './constants'
import { Fighter, type WorldRect } from './fighter/Fighter'
import type { KeyboardInput } from './input'
import { spawnEffect, updateEffects, type Effect } from './render/effects'
import { emptyInput, type CharacterDef, type InputSnapshot, type MoveDef } from './types'

export type MatchMode = 'cpu' | 'attract'
export type Phase = 'intro' | 'fight' | 'ko' | 'timeover' | 'matchOver'

/** 0 = player 1 wins, 1 = player 2 / CPU wins, -1 = draw */
export type MatchWinner = 0 | 1 | -1

export interface MatchResult {
  winner: MatchWinner
  wins: [number, number]
}

interface Controller {
  poll(self: Fighter, opp: Fighter): InputSnapshot
}

class HumanController implements Controller {
  private readonly kb: KeyboardInput
  constructor(kb: KeyboardInput) {
    this.kb = kb
  }
  poll() {
    return this.kb.poll()
  }
}

export interface Announce {
  text: string
  sub?: string
  t: number
  dur: number
  scale: number
  color: string
}

export interface MatchConfig {
  mode: MatchMode
  difficulty: Difficulty
  chars: [CharacterDef, CharacterDef]
  keyboard: KeyboardInput
  onEnd?: (r: MatchResult) => void
}

const START_X: [number, number] = [VIEW_W / 2 - 60, VIEW_W / 2 + 60]

function overlap(a: WorldRect, b: WorldRect) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
}

/** Owns one match: two fighters, rounds, timer, hit detection and effects. */
export class Match {
  readonly fighters: [Fighter, Fighter]
  readonly names: [string, string]
  readonly mode: MatchMode
  private readonly controllers: [Controller, Controller]
  private readonly onEnd?: (r: MatchResult) => void

  phase: Phase = 'intro'
  phaseT = 0
  round = 1
  wins: [number, number] = [0, 0]
  timer = ROUND_TIME
  private timerFrames = 0
  /** delayed red health bar */
  trail: [number, number] = [1, 1]
  private trailDelay: [number, number] = [0, 0]
  hitstop = 0
  shake = 0
  private slow = 0
  /** fighter shaken in place during hit-stop */
  victim: Fighter | null = null
  effects: Effect[] = []
  announce: Announce | null = null
  combo: { player: 0 | 1; count: number; t: number } | null = null
  private roundWinner: MatchWinner | null = null

  constructor(cfg: MatchConfig) {
    this.mode = cfg.mode
    this.onEnd = cfg.onEnd
    const [c1, c2] = cfg.chars
    this.fighters = [new Fighter(c1, 0), new Fighter(c2, c1.id === c2.id ? 1 : 0)]
    const cpuName = c2.id === c1.id ? 'TEMP' : c2.name
    if (cfg.mode === 'attract') {
      this.controllers = [new CpuController('hard'), new CpuController('hard')]
      this.names = [c1.name, cpuName]
    } else {
      this.controllers = [new HumanController(cfg.keyboard), new CpuController(cfg.difficulty)]
      this.names = [c1.name, `${cpuName} CPU`]
    }
    this.startRound()
  }

  private startRound() {
    this.fighters[0].resetForRound(START_X[0], 1)
    this.fighters[1].resetForRound(START_X[1], -1)
    this.timer = ROUND_TIME
    this.timerFrames = 0
    this.trail = [1, 1]
    this.effects = []
    this.combo = null
    this.roundWinner = null
    this.setPhase('intro')
  }

  private setPhase(p: Phase) {
    this.phase = p
    this.phaseT = 0
  }

  private say(text: string, dur: number, scale = 4, color = '#ffe135', sub?: string) {
    this.announce = { text, dur, scale, color, t: 0, sub }
  }

  update() {
    if (this.announce && ++this.announce.t >= this.announce.dur) this.announce = null
    if (this.shake > 0) this.shake--
    if (this.hitstop > 0) {
      this.hitstop--
      return
    }
    this.victim = null
    if (this.slow > 0) {
      this.slow--
      if (this.slow % 2 === 1) return
    }
    this.phaseT++

    const [a, b] = this.fighters
    const live = this.phase === 'fight'
    // always poll, so keyboard "pressed" edges don't pile up between rounds
    const in0 = this.controllers[0].poll(a, b)
    const in1 = this.controllers[1].poll(b, a)
    a.update(live ? in0 : emptyInput(), b)
    b.update(live ? in1 : emptyInput(), a)

    this.separate()
    if (live) this.resolveHits()

    for (const f of this.fighters) {
      for (const ev of f.events) this.effects.push(spawnEffect('dust', ev.x, 0))
      f.events = []
    }
    this.effects = updateEffects(this.effects)
    this.updateTrail()
    if (this.combo && this.combo.t > 0) this.combo.t--

    this.updatePhase()
  }

  private updateTrail() {
    this.fighters.forEach((f, i) => {
      const r = f.health / f.maxHealth
      if (this.trail[i] > r) {
        if (this.trailDelay[i] > 0) this.trailDelay[i]--
        else this.trail[i] = Math.max(r, this.trail[i] - 0.008)
      } else this.trail[i] = r
    })
  }

  private updatePhase() {
    const [a, b] = this.fighters
    switch (this.phase) {
      case 'intro':
        if (this.phaseT === 1) {
          const final = this.wins[0] === ROUNDS_TO_WIN - 1 && this.wins[1] === ROUNDS_TO_WIN - 1
          this.say(final ? 'FINAL ROUND' : `ROUND ${this.round}`, 70, final ? 3 : 4)
        }
        if (this.phaseT === 72) this.say('FIGHT!', 40, 5, '#ff4a2a')
        if (this.phaseT >= 80) this.setPhase('fight')
        break

      case 'fight':
        if (++this.timerFrames >= 60) {
          this.timerFrames = 0
          this.timer--
          if (this.timer <= 0) {
            this.timer = 0
            this.say('TIME OVER', 120, 4, '#ffe135', 'THE MEETING RAN LONG')
            this.setPhase('timeover')
          }
        }
        break

      case 'ko': {
        const loserDown = this.fighters.every((f) => f.health > 0 || f.state === 'ko')
        if (loserDown && this.phaseT > 70 && this.roundWinner !== null && this.roundWinner !== -1) {
          const w = this.fighters[this.roundWinner]
          if (w.state !== 'win' && !w.airborne && (w.isActionable() || w.state === 'land' || w.state === 'attack')) {
            w.setState('win')
          }
        }
        if (this.phaseT >= 190) this.endRound()
        break
      }

      case 'timeover':
        if (this.phaseT === 50) {
          const ra = a.health / a.maxHealth
          const rb = b.health / b.maxHealth
          this.roundWinner = ra === rb ? -1 : ra > rb ? 0 : 1
          if (this.roundWinner !== -1) {
            const w = this.fighters[this.roundWinner]
            const l = this.fighters[1 - this.roundWinner]
            if (!w.airborne) w.setState('win')
            if (!l.airborne) l.setState('lose')
          }
        }
        if (this.phaseT >= 170) this.endRound()
        break

      case 'matchOver':
        if (this.phaseT === 150) {
          const winner: MatchWinner = this.wins[0] === this.wins[1] ? -1 : this.wins[0] > this.wins[1] ? 0 : 1
          this.onEnd?.({ winner, wins: [...this.wins] as [number, number] })
        }
        break
    }
  }

  private endRound() {
    const w = this.roundWinner
    if (w === -1 || w === null) {
      this.wins[0]++
      this.wins[1]++
    } else this.wins[w]++

    const done = this.wins[0] >= ROUNDS_TO_WIN || this.wins[1] >= ROUNDS_TO_WIN
    if (done) {
      this.setPhase('matchOver')
      const winner = this.wins[0] === this.wins[1] ? -1 : this.wins[0] > this.wins[1] ? 0 : 1
      if (winner === -1) this.say('DRAW', 150, 5, '#ffffff', 'NOBODY GETS THE CORNER OFFICE')
      else if (this.mode === 'cpu')
        winner === 0
          ? this.say('PROMOTED!', 150, 4, '#ffe135', 'YOU WIN')
          : this.say('LAID OFF!', 150, 4, '#ff4a2a', 'YOU LOSE')
      else this.say(`${this.names[winner]} WINS`, 150, 3)
      return
    }
    this.round++
    this.startRound()
  }

  /** Bodies can't overlap: push them apart (except when one jumps high over the other). */
  private separate() {
    const [a, b] = this.fighters
    const ghost = (f: Fighter) => f.state === 'down' || f.state === 'ko' || f.state === 'knockdown'
    if (ghost(a) || ghost(b)) return
    if (Math.abs(a.y - b.y) > 40) return
    const dx = b.x - a.x
    const ov = PUSH_HALF_W * 2 - Math.abs(dx)
    if (ov <= 0) return
    const dir = dx === 0 ? a.facing : Math.sign(dx)
    a.x -= (dir * ov) / 2
    b.x += (dir * ov) / 2
    // if one is pinned against a wall, the other takes the whole push
    for (const [f, o] of [[a, b], [b, a]] as const) {
      const clamped = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x))
      if (clamped !== f.x) {
        o.x += clamped - f.x
        f.x = clamped
      }
    }
  }

  private resolveHits() {
    const [a, b] = this.fighters
    // collect first, then apply: both can hit on the same frame (a trade)
    const hits: [Fighter, Fighter, MoveDef, WorldRect, WorldRect][] = []
    for (const [att, def] of [[a, b], [b, a]] as const) {
      const hb = att.hitboxWorld()
      if (!hb) continue
      const hurt = def.hurtboxesWorld().find((h) => overlap(hb, h))
      if (hurt) hits.push([att, def, att.move!, hb, hurt])
    }
    for (const [att, def, move, hb, hurt] of hits) this.applyHit(att, def, move, hb, hurt)
  }

  private applyHit(att: Fighter, def: Fighter, move: MoveDef, hb: WorldRect, hurt: WorldRect) {
    att.moveHit = true
    const cx = (Math.max(hb.x0, hurt.x0) + Math.min(hb.x1, hurt.x1)) / 2
    const cy = (Math.max(hb.y0, hurt.y0) + Math.min(hb.y1, hurt.y1)) / 2
    const pushDir = def.x >= att.x ? 1 : -1
    const blocked = def.canBlock(move, att)
    const push = blocked ? move.pushBlock : move.pushHit

    if (blocked) {
      def.block(move, att)
      this.hitstop = Math.max(this.hitstop, 6)
      this.effects.push(spawnEffect('block', cx, cy))
    } else {
      def.takeHit(move, att)
      this.hitstop = Math.max(this.hitstop, move.hitstop)
      this.victim = def
      this.effects.push(spawnEffect(move.heavy ? 'heavy' : 'hit', cx, cy))
      if (move.heavy) this.shake = Math.max(this.shake, 8)
      this.trailDelay[this.fighters.indexOf(def)] = 30
      if (def.comboCount >= 2) this.combo = { player: this.fighters.indexOf(att) as 0 | 1, count: def.comboCount, t: 70 }
    }
    // cornered defender: the attacker gets pushed back instead
    if (def.atWall() && !att.airborne) att.vx = -pushDir * push * 0.9

    if (def.health <= 0) this.knockOut(att, def)
  }

  private knockOut(att: Fighter, def: Fighter) {
    const [a, b] = this.fighters
    this.hitstop = 36
    this.slow = 70
    this.shake = 16
    const both = a.health <= 0 && b.health <= 0
    this.roundWinner = both ? -1 : (this.fighters.indexOf(att) as 0 | 1)
    if (def.health <= 0) this.say("YOU'RE FIRED!", 150, 3, '#ff4a2a')
    if (both) this.say('DOUBLE K.O.', 150, 4, '#ff4a2a', 'EVERYONE IS FIRED')
    this.setPhase('ko')
  }
}
