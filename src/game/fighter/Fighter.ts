import { GRAVITY, INPUT_BUFFER, STAGE_LEFT, STAGE_RIGHT } from '../constants'
import { styled } from './poses'
import {
  emptyInput,
  type CharacterDef,
  type Dir,
  type HitProps,
  type InputSnapshot,
  type MoveDef,
  type Palette,
  type Pose,
  type Rect,
  type SpawnKind,
} from '../types'

export type FighterState =
  | 'idle'
  | 'walkF'
  | 'walkB'
  | 'guard'
  | 'crouch'
  | 'crouchGuard'
  | 'prejump'
  | 'jump'
  | 'land'
  | 'attack'
  | 'hitstun'
  | 'blockstun'
  | 'knockdown'
  | 'down'
  | 'getup'
  | 'ko'
  | 'win'
  | 'lose'

const ACTIONABLE: FighterState[] = ['idle', 'walkF', 'walkB', 'guard', 'crouch', 'crouchGuard']
const CAN_BLOCK: FighterState[] = [...ACTIONABLE, 'blockstun']
const INVULNERABLE: FighterState[] = ['knockdown', 'down', 'getup', 'ko', 'win', 'lose']

export type FighterEvent =
  | { type: 'land' | 'dust'; x: number }
  | { type: 'spawn'; kind: SpawnKind }
  | { type: 'special'; name: string }

/** A world-space box (x0<x1, y0<y1, y up from the floor). */
export type WorldRect = Rect

/** How long a sequence may take, and how fresh its last direction must be. */
const SEQ_WINDOW = 36
const SEQ_LAST = 16

export class Fighter {
  readonly char: CharacterDef
  readonly palette: Palette
  x = 0
  y = 0
  vx = 0
  vy = 0
  airborne = false
  facing: 1 | -1 = 1
  health: number
  state: FighterState = 'idle'
  /** frames spent in the current state */
  t = 0
  move: MoveDef | null = null
  moveHit = false
  /** increments on every new attack (lets the AI notice a fresh attack) */
  attackSerial = 0
  stun = 0
  crouchStun = false
  comboCount = 0
  /** frames left before the special can be used again */
  specialCd = 0
  /** frames left showing a complaint / ticket stuck on the face */
  sticker = 0
  stickerKind: 'complaint' | 'ticket' = 'complaint'
  /** frames left of "scope creep": everything is slower */
  slowed = 0
  input: InputSnapshot = emptyInput()
  events: FighterEvent[] = []
  private jumpDir = 0
  private airAttackUsed = false
  private clock = 0
  private lastLK = -99
  private lastHK = -99
  private dirHistory: { d: Dir; t: number }[] = []
  private readonly height: number

  constructor(char: CharacterDef, paletteIndex: number) {
    this.char = char
    this.palette = char.palettes[paletteIndex % char.palettes.length]
    this.health = char.stats.health
    const b = char.body
    this.height = Math.round((b.thigh + b.shin) * 0.9 + b.torso + b.neck + b.headR * 2 - 1)
  }

  get maxHealth() {
    return this.char.stats.health
  }

  get isSpecial() {
    return this.state === 'attack' && this.move === this.char.special.move
  }

  resetForRound(x: number, facing: 1 | -1) {
    this.x = x
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.airborne = false
    this.facing = facing
    this.health = this.maxHealth
    this.move = null
    this.stun = 0
    this.comboCount = 0
    this.specialCd = 0
    this.sticker = 0
    this.slowed = 0
    this.events = []
    this.dirHistory = []
    this.lastLK = this.lastHK = -99
    this.setState('idle')
  }

  setState(s: FighterState) {
    this.state = s
    this.t = 0
  }

  isActionable() {
    return ACTIONABLE.includes(this.state)
  }

  isCrouching() {
    return (
      this.state === 'crouch' ||
      this.state === 'crouchGuard' ||
      (this.state === 'attack' && !!this.move?.crouch) ||
      ((this.state === 'hitstun' || this.state === 'blockstun') && this.crouchStun)
    )
  }

  /** Is the opponent's attack coming? (walking back turns into a guard pose) */
  private threatened(opp: Fighter) {
    return (
      opp.state === 'attack' &&
      !!opp.move?.hitbox &&
      opp.t < opp.move.startup + opp.move.active &&
      Math.abs(opp.x - this.x) < 110
    )
  }

  private faceOpponent(opp: Fighter) {
    if (opp.x !== this.x) this.facing = opp.x > this.x ? 1 : -1
  }

  update(inp: InputSnapshot, opp: Fighter) {
    this.clock++
    this.t++
    if (this.specialCd > 0) this.specialCd--
    if (this.sticker > 0) this.sticker--
    if (this.slowed > 0) this.slowed--
    this.input = inp
    if (inp.pressed.lk) this.lastLK = this.clock
    if (inp.pressed.hk) this.lastHK = this.clock

    switch (this.state) {
      case 'idle':
      case 'walkF':
      case 'walkB':
      case 'guard':
      case 'crouch':
      case 'crouchGuard':
        this.faceOpponent(opp)
        this.recordDirections(inp)
        this.neutral(inp, opp)
        break
      case 'prejump':
        if (this.t >= 4) {
          this.airborne = true
          this.vy = this.char.stats.jumpV
          this.vx = this.jumpDir * this.char.stats.jumpVX * (this.slowed > 0 ? 0.6 : 1)
          this.airAttackUsed = false
          this.setState('jump')
        }
        break
      case 'jump':
        if (!this.airAttackUsed) {
          const hk = this.clock - this.lastHK <= INPUT_BUFFER
          const lk = this.clock - this.lastLK <= INPUT_BUFFER
          if (hk || lk) this.startAttack(hk ? this.char.moves.airHK : this.char.moves.airLK)
        }
        break
      case 'land':
        if (this.t >= 4) this.setState('idle')
        break
      case 'attack': {
        const m = this.move!
        if (m.spawn && this.t === m.spawn.frame) this.events.push({ type: 'spawn', kind: m.spawn.kind })
        if (this.t >= m.startup + m.active + m.recovery) {
          this.move = null
          this.setState(m.air ? 'jump' : m.crouch ? 'crouch' : 'idle')
        }
        break
      }
      case 'hitstun':
      case 'blockstun':
        this.recordDirections(inp)
        if (--this.stun <= 0) {
          this.comboCount = 0
          this.setState(this.crouchStun ? 'crouch' : 'idle')
        }
        break
      case 'down':
        if (this.t >= 40) this.setState('getup')
        break
      case 'getup':
        if (this.t >= 16) {
          this.comboCount = 0
          this.setState('idle')
        }
        break
      default:
        break
    }

    this.physics()
  }

  /** Remember direction presses (relative to facing) for special-move sequences. */
  private recordDirections(inp: InputSnapshot) {
    const p = inp.pressed
    const push = (d: Dir) => this.dirHistory.push({ d, t: this.clock })
    if (p.down) push('D')
    if (p.up) push('U')
    if (p.right) push(this.facing === 1 ? 'F' : 'B')
    if (p.left) push(this.facing === 1 ? 'B' : 'F')
    if (this.dirHistory.length > 8) this.dirHistory.splice(0, this.dirHistory.length - 8)
  }

  private specialRequested(inp: InputSnapshot) {
    const sp = this.char.special
    if (this.specialCd > 0) return false
    if (inp.special) return true
    const btn = sp.button === 'lk' ? this.lastLK : this.lastHK
    if (this.clock - btn > INPUT_BUFFER) return false
    const h = this.dirHistory
    if (h.length < sp.seq.length) return false
    const tail = h.slice(-sp.seq.length)
    if (!tail.every((e, i) => e.d === sp.seq[i])) return false
    return this.clock - tail[0].t <= SEQ_WINDOW && this.clock - tail[tail.length - 1].t <= SEQ_LAST
  }

  private neutral(inp: InputSnapshot, opp: Fighter) {
    const fwd = this.facing === 1 ? inp.held.right : inp.held.left
    const back = this.facing === 1 ? inp.held.left : inp.held.right
    const lk = this.clock - this.lastLK <= INPUT_BUFFER
    const hk = this.clock - this.lastHK <= INPUT_BUFFER
    const { moves, stats, special } = this.char

    if (this.specialRequested(inp)) {
      this.dirHistory = []
      this.specialCd = special.cooldown
      this.startAttack(special.move)
      this.events.push({ type: 'special', name: special.move.name })
      return
    }
    if (lk || hk) {
      const crouch = inp.held.down
      const move = hk ? (crouch ? moves.crouchHK : moves.standHK) : crouch ? moves.crouchLK : moves.standLK
      this.startAttack(move)
      return
    }
    if (inp.held.up) {
      this.jumpDir = fwd ? 1 : back ? -1 : 0
      this.setState('prejump')
      return
    }
    const threat = this.threatened(opp)
    if (inp.held.down) {
      const want = back && threat ? 'crouchGuard' : 'crouch'
      if (this.state !== want) this.setState(want)
      return
    }
    if (fwd) {
      if (this.state !== 'walkF') this.setState('walkF')
      this.x += stats.walkF * this.facing * this.speedMul
    } else if (back) {
      if (threat) {
        if (this.state !== 'guard') this.setState('guard')
      } else {
        if (this.state !== 'walkB') this.setState('walkB')
        this.x -= stats.walkB * this.facing * this.speedMul
      }
    } else if (this.state !== 'idle') {
      this.setState('idle')
    }
  }

  private get speedMul() {
    return this.slowed > 0 ? 0.5 : 1
  }

  private startAttack(move: MoveDef) {
    this.lastLK = this.lastHK = -99
    this.move = move
    this.moveHit = false
    this.attackSerial++
    if (move.air) this.airAttackUsed = true
    this.setState('attack')
  }

  private physics() {
    if (this.airborne) {
      this.vy -= GRAVITY
      this.x += this.vx
      this.y += this.vy
      if (this.y <= 0) {
        this.y = 0
        this.vy = 0
        this.airborne = false
        this.onLand()
      }
    } else {
      this.x += this.vx
      this.vx *= 0.75
      if (Math.abs(this.vx) < 0.05) this.vx = 0
    }
    this.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, this.x))
  }

  private onLand() {
    this.vx = 0
    if (this.state === 'knockdown') {
      this.events.push({ type: 'dust', x: this.x })
      this.setState(this.health <= 0 ? 'ko' : 'down')
    } else if (this.state === 'jump' || (this.state === 'attack' && this.move?.air)) {
      this.move = null
      this.events.push({ type: 'land', x: this.x })
      this.setState('land')
    }
  }

  // ---------------------------------------------------------------------------
  // Combat
  // ---------------------------------------------------------------------------

  attackPhase(): 'startup' | 'active' | 'recovery' | null {
    if (this.state !== 'attack' || !this.move) return null
    const m = this.move
    if (this.t < m.startup) return 'startup'
    if (this.t < m.startup + m.active) return 'active'
    return 'recovery'
  }

  private toWorld(r: Rect): WorldRect {
    const x0 = this.facing === 1 ? this.x + r.x0 : this.x - r.x1
    const x1 = this.facing === 1 ? this.x + r.x1 : this.x - r.x0
    return { x0, x1, y0: this.y + r.y0, y1: this.y + r.y1 }
  }

  hitboxWorld(): WorldRect | null {
    if (this.attackPhase() !== 'active' || this.moveHit || !this.move?.hitbox) return null
    return this.toWorld(this.move.hitbox)
  }

  hurtboxesWorld(): WorldRect[] {
    if (INVULNERABLE.includes(this.state)) return []
    const w = this.char.hurtHalfW
    const h = this.height
    let body: Rect
    if (this.airborne) body = { x0: -w, y0: 6, x1: w, y1: h - 4 }
    else if (this.isCrouching()) body = { x0: -w + 1, y0: 0, x1: w + 2, y1: Math.round(h * 0.68) }
    else if (this.state === 'prejump' || this.state === 'land') body = { x0: -w, y0: 0, x1: w, y1: h - 10 }
    else body = { x0: -w, y0: 0, x1: w + 1, y1: h }
    const boxes = [this.toWorld(body)]
    const phase = this.attackPhase()
    if (this.move?.hurtExt && (phase === 'active' || phase === 'recovery')) boxes.push(this.toWorld(this.move.hurtExt))
    return boxes
  }

  /** Where the face is (for complaint stickers and effects), world space. */
  headPos(): [number, number] {
    return [this.x + this.facing * 4, this.y + this.height - 8]
  }

  /** Can this fighter block a hit coming from `srcX`? */
  canBlock(hit: HitProps, srcX: number): boolean {
    if (hit.level === 'unblockable') return false
    if (this.airborne || !CAN_BLOCK.includes(this.state)) return false
    const holdingAway = srcX > this.x ? this.input.held.left : this.input.held.right
    if (!holdingAway) return false
    const crouching = this.input.held.down
    if (hit.level === 'low' && !crouching) return false
    if (hit.level === 'overhead' && crouching) return false
    return true
  }

  /** direction pointing away from the hit's source */
  private awayFrom(srcX: number, srcFacing: 1 | -1): 1 | -1 {
    if (this.x === srcX) return srcFacing
    return this.x > srcX ? 1 : -1
  }

  takeHit(hit: HitProps, srcX: number, srcFacing: 1 | -1) {
    const away = this.awayFrom(srcX, srcFacing)
    const wasStunned = this.state === 'hitstun'
    this.health = Math.max(0, this.health - hit.damage)
    this.comboCount = wasStunned ? this.comboCount + 1 : 1
    this.facing = away === 1 ? -1 : 1
    this.move = null
    if (this.airborne || hit.knockdown || this.health <= 0) {
      const [lvx, lvy] = hit.launch ?? [1.6, 3.6]
      this.setState('knockdown')
      this.airborne = true
      this.y = Math.max(this.y, 1)
      this.vy = this.health <= 0 ? Math.max(lvy, 5) : lvy
      this.vx = away * (this.health <= 0 ? Math.max(lvx, 2.2) : lvx)
      return
    }
    this.crouchStun = this.isCrouching() || this.input.held.down
    this.stun = hit.hitstun
    this.vx = away * hit.pushHit
    this.setState('hitstun')
  }

  block(hit: HitProps, srcX: number, srcFacing: 1 | -1) {
    const away = this.awayFrom(srcX, srcFacing)
    this.health = Math.max(1, this.health - (hit.chip ?? 0))
    this.crouchStun = this.input.held.down
    this.stun = hit.blockstun
    this.vx = away * hit.pushBlock
    this.move = null
    this.setState('blockstun')
  }

  atWall() {
    return this.x <= STAGE_LEFT + 0.5 || this.x >= STAGE_RIGHT - 0.5
  }

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------

  getPose(): Pose {
    const neutral = ['idle', 'walkF', 'walkB', 'crouch', 'prejump', 'land', 'jump', 'win', 'lose'].includes(this.state)
    return styled(this.rawPose(), this.char.style, neutral)
  }

  private rawPose(): Pose {
    const p = this.char.poses
    switch (this.state) {
      case 'idle':
        return p.idle(Math.floor(this.clock / 24) % 2)
      case 'walkF':
        return p.walk(Math.floor(this.t / 5) % 6)
      case 'walkB':
        return p.walk(5 - (Math.floor(this.t / 5) % 6))
      case 'guard':
        return p.guard()
      case 'crouch':
        return p.crouch()
      case 'crouchGuard':
        return p.crouchGuard()
      case 'prejump':
      case 'land':
        return p.prejump()
      case 'jump':
        return p.jump(this.vy)
      case 'attack': {
        const m = this.move!
        const phase = this.attackPhase()
        if (phase === 'startup') return m.loop ? m.loop[Math.floor(this.t / 4) % m.loop.length] : m.poses.startup
        if (phase === 'active') return m.poses.active
        const rt = this.t - m.startup - m.active
        if (rt < m.recovery * 0.6) return m.poses.recover
        return m.air ? p.jump(this.vy) : m.crouch ? p.crouch() : p.idle(0)
      }
      case 'hitstun':
        return this.crouchStun ? p.crouchHit(this.t < 5 ? 0 : 1) : p.hit(this.t < 5 ? 0 : 1)
      case 'blockstun':
        return this.crouchStun ? p.crouchGuard() : p.guard()
      case 'knockdown':
        return p.knockdown()
      case 'down':
      case 'ko':
        return p.lying()
      case 'getup':
        return this.t < 8 ? p.crouchHit(1) : p.crouch()
      case 'win':
        return p.win(Math.floor(this.t / 14) % 2)
      case 'lose':
        return p.lose()
    }
  }
}
