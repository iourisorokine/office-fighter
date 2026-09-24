import { CpuController, type Difficulty } from './ai/CpuController'
import { PUSH_HALF_W, ROUND_TIME, ROUNDS_TO_WIN, STAGE_LEFT, STAGE_RIGHT, VIEW_W } from './constants'
import { Fighter, type WorldRect } from './fighter/Fighter'
import type { KeyboardInput } from './input'
import { spawnEffect, spawnText, updateEffects, type Effect } from './render/effects'
import {
  INCIDENT_END,
  INCIDENT_HIT,
  INCIDENT_WARNING,
  moveProjectile,
  projectileRect,
  RAIN_DURATION,
  spawnBill,
  spawnProjectile,
  TOWER_END,
  TOWER_HALF_W,
  TOWER_HIT,
  TOWER_LAND,
  type Incident,
  type Projectile,
  type Rain,
  type Tower,
} from './specials'
import { emptyInput, type CharacterDef, type HitProps, type InputSnapshot, type MoveDef } from './types'

export type MatchMode = 'cpu' | 'attract'
export type Phase = 'intro' | 'fight' | 'ko' | 'timeover' | 'matchOver'

/** 0 = player 1 wins, 1 = player 2 / CPU wins, -1 = draw */
export type MatchWinner = 0 | 1 | -1

export interface MatchResult {
  winner: MatchWinner
  wins: [number, number]
  /** outcome of the bonus round against the VC, if it happened */
  bonus?: 'won' | 'lost'
}

/** What controllers can see besides the two fighters. */
export interface ArenaView {
  projectiles: readonly Projectile[]
  incident: Incident | null
  towers: readonly Tower[]
}

export interface Controller {
  poll(self: Fighter, opp: Fighter, arena: ArenaView): InputSnapshot
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
  /** if set, player 2 becomes a random different character every new round */
  rotatePool?: CharacterDef[]
  /** bonus boss after a 2-0 (player vs CPU only) */
  boss?: { char: CharacterDef; stageId: string }
  stageId: string
  keyboard: KeyboardInput
  onEnd?: (r: MatchResult) => void
}

const START_X: [number, number] = [VIEW_W / 2 - 60, VIEW_W / 2 + 60]

function overlap(a: WorldRect, b: WorldRect) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
}

/** Owns one match: two fighters, rounds, timer, hits, specials and effects. */
export class Match implements ArenaView {
  readonly fighters: [Fighter, Fighter]
  readonly names: [string, string]
  readonly mode: MatchMode
  stageId: string
  private readonly controllers: [Controller, Controller]
  private readonly onEnd?: (r: MatchResult) => void
  private readonly rotatePool: CharacterDef[]
  private readonly difficulty: Difficulty

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
  projectiles: Projectile[] = []
  incident: Incident | null = null
  towers: Tower[] = []
  rain: Rain | null = null
  /** true during the bonus round against the VC */
  bossRound = false
  private bonus: 'won' | 'lost' | undefined
  private readonly boss?: { char: CharacterDef; stageId: string }
  announce: Announce | null = null
  combo: { player: 0 | 1; count: number; t: number } | null = null
  private roundWinner: MatchWinner | null = null

  constructor(cfg: MatchConfig) {
    this.mode = cfg.mode
    this.stageId = cfg.stageId
    this.onEnd = cfg.onEnd
    this.rotatePool = cfg.rotatePool ?? []
    this.boss = cfg.mode === 'cpu' ? cfg.boss : undefined
    this.difficulty = cfg.mode === 'attract' ? 'hard' : cfg.difficulty
    const [c1, c2] = cfg.chars
    this.fighters = [new Fighter(c1, 0), new Fighter(c2, c1.id === c2.id ? 1 : 0)]
    if (cfg.mode === 'attract') {
      this.controllers = [new CpuController('hard', 0), new CpuController('hard', 1)]
      this.names = [c1.name, c2.name]
    } else {
      this.controllers = [new HumanController(cfg.keyboard), new CpuController(cfg.difficulty, 1)]
      this.names = [c1.name, `${c2.name} CPU`]
    }
    this.startRound()
  }

  /** New round, new opponent: pick someone who is neither player 1 nor the last opponent. */
  private rotateOpponent() {
    const [p1, old] = this.fighters
    const pool = this.rotatePool.filter((c) => c.id !== p1.char.id && c.id !== old.char.id)
    if (pool.length === 0) return
    const next = pool[Math.floor(Math.random() * pool.length)]
    this.fighters[1] = new Fighter(next, next.id === p1.char.id ? 1 : 0)
    this.controllers[1] = new CpuController(this.difficulty, 1)
    this.names[1] = this.mode === 'cpu' ? `${next.name} CPU` : next.name
  }

  private startRound() {
    this.fighters[0].resetForRound(START_X[0], 1)
    this.fighters[1].resetForRound(START_X[1], -1)
    this.timer = ROUND_TIME
    this.timerFrames = 0
    this.trail = [1, 1]
    this.effects = []
    this.projectiles = []
    this.incident = null
    this.towers = []
    this.rain = null
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
    const in0 = this.controllers[0].poll(a, b, this)
    const in1 = this.controllers[1].poll(b, a, this)
    a.update(live ? in0 : emptyInput(), b)
    b.update(live ? in1 : emptyInput(), a)

    this.separate()
    this.handleEvents()
    if (live) {
      this.resolveHits()
      this.updateProjectiles()
      this.updateIncident()
      this.updateTowers()
      this.updateRain()
    } else {
      this.projectiles = []
      this.incident = null
      this.towers = []
      this.rain = null
    }
    // the VC can't stop throwing money around
    for (const f of this.fighters) {
      if (f.char.look.prop === 'cash' && this.phaseT % 22 === 0 && f.health > 0) {
        this.effects.push(spawnEffect('cash', f.x + f.facing * 14, f.y + 44))
      }
    }
    this.effects = updateEffects(this.effects)
    this.updateTrail()
    if (this.combo && this.combo.t > 0) this.combo.t--

    this.updatePhase()
  }

  private handleEvents() {
    this.fighters.forEach((f, i) => {
      for (const ev of f.events) {
        if (ev.type === 'dust' || ev.type === 'land') this.effects.push(spawnEffect('dust', ev.x, 0))
        else if (ev.type === 'special' && f.char.special.move.spawn?.kind !== 'incident') this.effects.push(spawnText(`${ev.name.toUpperCase()}!`, f.x, f.y + 84, '#ffffff', 50))
        else if (ev.type === 'spawn' && this.phase === 'fight') {
          const opp = this.fighters[1 - i]
          if (ev.kind === 'incident') this.incident = { owner: i as 0 | 1, t: 0, fired: false }
          else if (ev.kind === 'tower') this.towers.push({ owner: i as 0 | 1, x: opp.x, t: 0, fired: false })
          else if (ev.kind === 'raise') {
            this.rain = { owner: i as 0 | 1, t: 0 }
            this.say('RAISE!', 70, 5, '#5fe08a', 'MAKE IT RAIN')
          } else this.projectiles.push(spawnProjectile(ev.kind, i as 0 | 1, f))
        }
      }
      f.events = []
    })
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
          const sub = this.round > 1 && this.rotatePool.length ? `NEW OPPONENT: ${this.fighters[1].char.name}` : undefined
          if (this.bossRound) this.say('BONUS ROUND', 70, 4, '#5fe08a', 'A VC WANTS A WORD')
          else this.say(final ? 'FINAL ROUND' : `ROUND ${this.round}`, 70, final ? 3 : 4, '#ffe135', sub)
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
          this.onEnd?.({ winner, wins: [...this.wins] as [number, number], bonus: this.bonus })
        }
        break
    }
  }

  private endRound() {
    const w = this.roundWinner
    if (this.bossRound) {
      this.bonus = w === 0 ? 'won' : 'lost'
      this.setPhase('matchOver')
      if (w === 0) this.say('FUNDED!', 150, 5, '#5fe08a', "YOU'RE THE CEO NOW")
      else this.say('THE VC PASSED', 150, 3, '#ff4a2a', 'STILL PROMOTED, THOUGH')
      return
    }
    if (w === -1 || w === null) {
      this.wins[0]++
      this.wins[1]++
    } else this.wins[w]++

    const done = this.wins[0] >= ROUNDS_TO_WIN || this.wins[1] >= ROUNDS_TO_WIN
    if (done && this.boss && this.wins[0] >= ROUNDS_TO_WIN && this.wins[1] === 0) {
      // flawless 2-0: the VC shows up for a bonus round in the boss's office
      this.bossRound = true
      this.fighters[1] = new Fighter(this.boss.char, 0)
      this.controllers[1] = new CpuController(this.difficulty, 1)
      this.names[1] = `${this.boss.char.name} CPU`
      this.stageId = this.boss.stageId
      this.round++
      this.startRound()
      return
    }
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
    if (this.rotatePool.length) this.rotateOpponent()
    this.startRound()
  }

  /** Bodies can't overlap: push them apart (except when one jumps high over the other). */
  private separate() {
    const [a, b] = this.fighters
    const ghost = (f: Fighter) => f.state === 'down' || f.state === 'ko' || f.state === 'knockdown'
    if (ghost(a) || ghost(b)) return
    if (Math.abs(a.y - b.y) > 40) return
    const dx = b.x - a.x
    const minDist = Math.max(PUSH_HALF_W, a.char.hurtHalfW - 1) + Math.max(PUSH_HALF_W, b.char.hurtHalfW - 1)
    const ov = minDist - Math.abs(dx)
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
    for (const [att, def, move, hb, hurt] of hits) {
      att.moveHit = true
      const cx = (Math.max(hb.x0, hurt.x0) + Math.min(hb.x1, hurt.x1)) / 2
      const cy = (Math.max(hb.y0, hurt.y0) + Math.min(hb.y1, hurt.y1)) / 2
      this.applyHit(att, def, move, att.x, att.facing, cx, cy, !att.airborne)
    }
  }

  /**
   * Shared by kicks, projectiles and the incident. `srcX` is where the hit
   * comes from (decides the push direction and which way is "back" to block).
   */
  private applyHit(
    att: Fighter,
    def: Fighter,
    hit: HitProps,
    srcX: number,
    srcFacing: 1 | -1,
    cx: number,
    cy: number,
    cornerPush: boolean,
  ): boolean {
    const blocked = def.canBlock(hit, srcX)
    const pushDir = def.x >= srcX ? 1 : -1
    const push = blocked ? hit.pushBlock : hit.pushHit
    const cancelsIncident = this.incident && !this.incident.fired && this.fighters[this.incident.owner] === def

    if (blocked) {
      def.block(hit, srcX, srcFacing)
      this.hitstop = Math.max(this.hitstop, 6)
      this.effects.push(spawnEffect('block', cx, cy))
    } else {
      def.takeHit(hit, srcX, srcFacing)
      this.hitstop = Math.max(this.hitstop, hit.hitstop)
      this.victim = def
      this.effects.push(spawnEffect(hit.heavy ? 'heavy' : 'hit', cx, cy))
      if (hit.heavy) this.shake = Math.max(this.shake, 8)
      this.trailDelay[this.fighters.indexOf(def)] = 30
      if (def.comboCount >= 2) this.combo = { player: this.fighters.indexOf(att) as 0 | 1, count: def.comboCount, t: 70 }
      if (cancelsIncident) {
        this.incident = null
        this.effects.push(spawnText('INCIDENT RESOLVED', def.x, def.y + 80, '#5fe08a'))
      }
    }
    // cornered defender: the attacker gets pushed back instead
    if (cornerPush && def.atWall()) att.vx = -pushDir * push * 0.9

    if (def.health <= 0) this.knockOut(att)
    return !blocked
  }

  private updateProjectiles() {
    const list = this.projectiles
    for (const p of list) moveProjectile(p)

    // projectiles cancel each other; the mega bullshit blows everything away
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const p = list[i]
        const q = list[j]
        if (p.dead || q.dead || p.owner === q.owner || p.kind === 'bill' || q.kind === 'bill') continue
        if (!overlap(projectileRect(p), projectileRect(q))) continue
        const pBig = p.kind === 'bullshit'
        const qBig = q.kind === 'bullshit'
        if (pBig === qBig) p.dead = q.dead = true
        else (pBig ? q : p).dead = true
        this.effects.push(spawnEffect('block', (p.x + q.x) / 2, (p.y + q.y) / 2))
      }
    }

    for (const p of list) {
      if (p.dead) continue
      const owner = this.fighters[p.owner]
      const def = this.fighters[1 - p.owner]
      const r = projectileRect(p)
      const hurt = def.hurtboxesWorld().find((h) => overlap(r, h))
      if (!hurt) continue
      p.dead = true
      const dir: 1 | -1 = p.vx > 0 ? 1 : -1
      const cx = (Math.max(r.x0, hurt.x0) + Math.min(r.x1, hurt.x1)) / 2
      const cy = (Math.max(r.y0, hurt.y0) + Math.min(r.y1, hurt.y1)) / 2
      const landed = this.applyHit(owner, def, p.hit, p.x - dir * 40, dir, cx, cy, false)
      if (p.kind === 'coffee') this.effects.push(spawnEffect('splash', cx, cy))
      if (p.kind === 'cash' || p.kind === 'bill') this.effects.push(spawnEffect('cash', cx, cy))
      if (p.kind === 'requirement' && landed) {
        def.sticker = 90
        def.stickerKind = 'ticket'
        def.slowed = 180
        this.effects.push(spawnText('SCOPE CREEP!', def.x, def.y + 84, '#ffe135'))
      }
      if (p.kind === 'complaint') {
        this.effects.push(spawnEffect('paper', cx, cy))
        if (landed) {
          def.stickerKind = 'complaint'
          def.sticker = 70
          this.effects.push(spawnText('COMPLAINT FILED!', def.x, def.y + 84, '#ff4a2a'))
        }
      }
      if (p.kind === 'bullshit') {
        this.effects.push(spawnEffect('dust', def.x, 0), spawnText('BLAH BLAH BLAH!', def.x, def.y + 84, '#e0c070'))
      }
    }
    this.projectiles = list.filter((p) => !p.dead)
  }

  private updateIncident() {
    const inc = this.incident
    if (!inc) return
    inc.t++
    const owner = this.fighters[inc.owner]
    const target = this.fighters[1 - inc.owner]
    if (!inc.fired && !owner.isSpecial) {
      // the developer got interrupted before hitting deploy
      this.incident = null
      return
    }
    if (inc.t === INCIDENT_WARNING) {
      inc.fired = true
      this.shake = Math.max(this.shake, 14)
      if (target.airborne || target.hurtboxesWorld().length === 0) {
        this.effects.push(spawnText('DODGED!', target.x, target.y + 84, '#5fe08a'))
      } else {
        const [hx, hy] = target.headPos()
        this.effects.push(spawnText('SEV-1 OUTAGE!', target.x, target.y + 90, '#ff4a2a'))
        this.applyHit(owner, target, INCIDENT_HIT, owner.x, owner.facing, hx, hy, false)
      }
    }
    if (inc.t >= INCIDENT_END) this.incident = null
  }

  private updateTowers() {
    for (const tw of this.towers) {
      tw.t++
      if (tw.t !== TOWER_LAND) continue
      tw.fired = true
      this.shake = Math.max(this.shake, 12)
      this.effects.push(spawnEffect('dust', tw.x - 10, 0), spawnEffect('dust', tw.x + 10, 0))
      const owner = this.fighters[tw.owner]
      const target = this.fighters[1 - tw.owner]
      const under = Math.abs(target.x - tw.x) < TOWER_HALF_W + target.char.hurtHalfW && target.y < 50
      if (under && target.hurtboxesWorld().length > 0) {
        const [hx, hy] = target.headPos()
        this.effects.push(spawnText('OVER-ENGINEERED!', target.x, target.y + 90, '#ff4a2a'))
        this.applyHit(owner, target, TOWER_HIT, tw.x, owner.facing, hx, hy, false)
      } else {
        this.effects.push(spawnText('MISSED THE DEADLINE', tw.x, 70, '#9fd0f0'))
      }
    }
    this.towers = this.towers.filter((tw) => tw.t < TOWER_END)
  }

  private updateRain() {
    const r = this.rain
    if (!r) return
    r.t++
    const target = this.fighters[1 - r.owner]
    if (r.t % 10 === 0) {
      const x = Math.max(10, Math.min(VIEW_W - 10, target.x + (Math.random() - 0.5) * 180))
      this.projectiles.push(spawnBill(r.owner, x))
    }
    if (r.t >= RAIN_DURATION || this.fighters[r.owner].health <= 0) this.rain = null
  }

  private knockOut(att: Fighter) {
    const [a, b] = this.fighters
    this.hitstop = 36
    this.slow = 70
    this.shake = 16
    this.projectiles = []
    const both = a.health <= 0 && b.health <= 0
    this.roundWinner = both ? -1 : (this.fighters.indexOf(att) as 0 | 1)
    if (both) this.say('DOUBLE K.O.', 150, 4, '#ff4a2a', 'EVERYONE IS FIRED')
    else if (this.bossRound && this.roundWinner === 0) this.say('DEAL CLOSED!', 150, 4, '#5fe08a')
    else if (this.bossRound) this.say("YOU'RE DILUTED!", 150, 3, '#ff4a2a')
    else if (this.mode === 'cpu' && this.roundWinner === 0) this.say("YOU'RE PROMOTED!", 150, 3, '#ffe135')
    else this.say("YOU'RE FIRED!", 150, 3, '#ff4a2a')
    this.setPhase('ko')
  }
}
