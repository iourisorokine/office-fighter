export type Vec2 = [number, number]

export interface Buttons {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  lk: boolean
  hk: boolean
}

/** What a controller (keyboard or CPU) sends to a fighter each frame. */
export interface InputSnapshot {
  held: Buttons
  /** true only on the frame the button went down */
  pressed: Buttons
}

export const noButtons = (): Buttons => ({ left: false, right: false, up: false, down: false, lk: false, hk: false })
export const emptyInput = (): InputSnapshot => ({ held: noButtons(), pressed: noButtons() })

/**
 * Box in fighter-local space: x is forward (towards where the fighter faces),
 * y is up from the feet. x0 < x1 and y0 < y1.
 */
export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

// ---------------------------------------------------------------------------
// Puppet poses (the fighters are drawn as pixel "puppets" from these)
// ---------------------------------------------------------------------------

/**
 * A limb is either solved with IK towards a target point (`ik`, sprite space),
 * or given two absolute angles in degrees (`a`): 0 = pointing straight down,
 * +90 = pointing forward, 180 = pointing up, negative = backwards.
 */
export interface Limb {
  ik?: Vec2
  a?: Vec2
}

export type Face = 'normal' | 'hurt' | 'ko' | 'shout'

export interface Pose {
  /** hip position, sprite space (feet origin, y up) */
  hip: Vec2
  /** torso lean in degrees, + = forward */
  lean: number
  /** extra head tilt in degrees */
  head?: number
  face?: Face
  nearLeg: Limb
  farLeg: Limb
  nearArm: Limb
  farArm: Limb
}

export interface BodyDims {
  thigh: number
  shin: number
  upperArm: number
  foreArm: number
  torso: number
  neck: number
  headR: number
  shoulderW: number
  hipW: number
  thighW: number
  shinW: number
  armW: number
  foreW: number
}

export interface Palette {
  id: string
  outline: string
  skin: string
  skinShade: string
  hair: string
  hairShade: string
  shirt: string
  shirtShade: string
  pants: string
  pantsShade: string
  shoe: string
  shoeShine: string
  tie: string
  tieShade: string
  eye: string
  belt: string
}

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------

/** mid: block standing or crouching · low: crouch-block only · overhead: stand-block only */
export type HitLevel = 'mid' | 'low' | 'overhead'

export interface MoveDef {
  id: string
  name: string
  startup: number
  active: number
  recovery: number
  damage: number
  hitstun: number
  blockstun: number
  /** horizontal push speed given to the defender */
  pushHit: number
  pushBlock: number
  /** freeze frames on hit */
  hitstop: number
  level: HitLevel
  hitbox: Rect
  /** extra hurtbox (the extended leg) from the active frames on, so whiffs can be punished */
  hurtExt?: Rect
  knockdown?: boolean
  heavy?: boolean
  air?: boolean
  crouch?: boolean
  poses: { startup: Pose; active: Pose; recover: Pose }
}

export interface MoveSet {
  standLK: MoveDef
  standHK: MoveDef
  crouchLK: MoveDef
  crouchHK: MoveDef
  airLK: MoveDef
  airHK: MoveDef
}

export interface PoseSet {
  idle(frame: number): Pose
  walk(frame: number): Pose
  crouch(): Pose
  guard(): Pose
  crouchGuard(): Pose
  prejump(): Pose
  jump(vy: number): Pose
  hit(frame: number): Pose
  crouchHit(frame: number): Pose
  knockdown(): Pose
  lying(): Pose
  win(frame: number): Pose
  lose(): Pose
}

export interface CharacterStats {
  health: number
  walkF: number
  walkB: number
  jumpV: number
  jumpVX: number
}

/** Everything that makes a character unique — the 5 office archetypes will each get one. */
export interface CharacterDef {
  id: string
  name: string
  title: string
  stats: CharacterStats
  body: BodyDims
  palettes: Palette[]
  poses: PoseSet
  moves: MoveSet
}
