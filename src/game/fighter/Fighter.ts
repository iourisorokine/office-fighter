import { GRAVITY, INPUT_BUFFER, STAGE_LEFT, STAGE_RIGHT } from '../constants'
import { emptyInput, type CharacterDef, type InputSnapshot, type MoveDef, type Palette, type Pose, type Rect } from '../types'

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

export type FighterEvent = { type: 'land' | 'dust'; x: number }

const HURT_STAND: Rect = { x0: -11, y0: 0, x1: 12, y1: 68 }
const HURT_CROUCH: Rect = { x0: -10, y0: 0, x1: 14, y1: 46 }
const HURT_AIR: Rect = { x0: -11, y0: 6, x1: 11, y1: 64 }
const HURT_LOW: Rect = { x0: -11, y0: 0, x1: 12, y1: 58 }

/** A world-space box (x0<x1, y0<y1, y up from the floor). */
export type WorldRect = Rect

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
  input: InputSnapshot = emptyInput()
  events: FighterEvent[] = []
  private jumpDir = 0
  private airAttackUsed = false
  private clock = 0
  private lastLK = -99
  private lastHK = -99

  constructor(char: CharacterDef, paletteIndex: number) {
    this.char = char
    this.palette = char.palettes[paletteIndex % char.palettes.length]
    this.health = char.stats.health
  }

  get maxHealth() {
    return this.char.stats.health
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
    this.events = []
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
      !!opp.move &&
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
        this.neutral(inp, opp)
        break
      case 'prejump':
        if (this.t >= 4) {
          this.airborne = true
          this.vy = this.char.stats.jumpV
          this.vx = this.jumpDir * this.char.stats.jumpVX
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
        if (this.t >= m.startup + m.active + m.recovery) {
          this.move = null
          this.setState(m.air ? 'jump' : m.crouch ? 'crouch' : 'idle')
        }
        break
      }
      case 'hitstun':
      case 'blockstun':
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

  private neutral(inp: InputSnapshot, opp: Fighter) {
    const fwd = this.facing === 1 ? inp.held.right : inp.held.left
    const back = this.facing === 1 ? inp.held.left : inp.held.right
    const lk = this.clock - this.lastLK <= INPUT_BUFFER
    const hk = this.clock - this.lastHK <= INPUT_BUFFER
    const { moves, stats } = this.char

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
      this.x += stats.walkF * this.facing
    } else if (back) {
      if (threat) {
        if (this.state !== 'guard') this.setState('guard')
      } else {
        if (this.state !== 'walkB') this.setState('walkB')
        this.x -= stats.walkB * this.facing
      }
    } else if (this.state !== 'idle') {
      this.setState('idle')
    }
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
    if (this.attackPhase() !== 'active' || this.moveHit || !this.move) return null
    return this.toWorld(this.move.hitbox)
  }

  hurtboxesWorld(): WorldRect[] {
    if (INVULNERABLE.includes(this.state)) return []
    let body: Rect
    if (this.airborne) body = HURT_AIR
    else if (this.isCrouching()) body = HURT_CROUCH
    else if (this.state === 'prejump' || this.state === 'land') body = HURT_LOW
    else body = HURT_STAND
    const boxes = [this.toWorld(body)]
    const phase = this.attackPhase()
    if (this.move?.hurtExt && (phase === 'active' || phase === 'recovery')) boxes.push(this.toWorld(this.move.hurtExt))
    return boxes
  }

  canBlock(move: MoveDef, attacker: Fighter): boolean {
    if (this.airborne || !CAN_BLOCK.includes(this.state)) return false
    const holdingAway = attacker.x > this.x ? this.input.held.left : this.input.held.right
    if (!holdingAway) return false
    const crouching = this.input.held.down
    if (move.level === 'low' && !crouching) return false
    if (move.level === 'overhead' && crouching) return false
    return true
  }

  /** direction pointing away from the attacker */
  private awayFrom(attacker: Fighter): 1 | -1 {
    if (this.x === attacker.x) return attacker.facing
    return this.x > attacker.x ? 1 : -1
  }

  takeHit(move: MoveDef, attacker: Fighter) {
    const away = this.awayFrom(attacker)
    const wasStunned = this.state === 'hitstun'
    this.health = Math.max(0, this.health - move.damage)
    this.comboCount = wasStunned ? this.comboCount + 1 : 1
    this.facing = away === 1 ? -1 : 1
    this.move = null
    if (this.airborne || move.knockdown || this.health <= 0) {
      this.setState('knockdown')
      this.airborne = true
      this.y = Math.max(this.y, 1)
      this.vy = this.health <= 0 ? 5 : 3.6
      this.vx = away * (this.health <= 0 ? 2.2 : 1.6)
      return
    }
    this.crouchStun = this.isCrouching() || this.input.held.down
    this.stun = move.hitstun
    this.vx = away * move.pushHit
    this.setState('hitstun')
  }

  block(move: MoveDef, attacker: Fighter) {
    const away = this.awayFrom(attacker)
    this.crouchStun = this.input.held.down
    this.stun = move.blockstun
    this.vx = away * move.pushBlock
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
        if (phase === 'startup') return m.poses.startup
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
