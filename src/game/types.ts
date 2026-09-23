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
  /** the CPU asks for its special directly instead of typing the sequence */
  special?: boolean
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

export interface PropPose {
  /** absolute angle like limbs (0 down, 90 forward); default: follows the forearm */
  angle?: number
  /** point along the forearm (swings) instead of the prop's resting angle */
  follow?: boolean
  /** folder opened (HR special) */
  open?: boolean
  hidden?: boolean
}

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
  prop?: PropPose
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

/** Reference proportions the shared poses were authored for. */
export const REF_LEGS = 30
export const REF_TORSO = 20

export interface Palette {
  id: string
  outline: string
  skin: string
  skinShade: string
  hair: string
  hairShade: string
  /** shirt / blouse / t-shirt */
  top: string
  topShade: string
  jacket: string
  jacketShade: string
  /** trousers, or stockings under a skirt */
  legs: string
  legsShade: string
  shoe: string
  shoeShine: string
  tie: string
  tieShade: string
  eye: string
  belt: string
  /** glasses frames, lipstick, logo... */
  accent: string
  /** held prop: main colour, shade, secondary (paper / keys / screen), dark detail */
  prop: string
  propShade: string
  propB: string
  propDark: string
}

export type HairStyle = 'short' | 'bun' | 'messy' | 'slick'
export type PropKind = 'none' | 'folder' | 'keyboard' | 'phone'

/** Visual traits that make each office archetype recognisable. */
export interface Look {
  hair: HairStyle
  top: 'shirt' | 'tshirt' | 'jacket'
  tie: boolean
  skirt: boolean
  /** belly bulge in pixels (0 = none) */
  belly: number
  shoes: 'flat' | 'heels' | 'sneakers'
  glasses: boolean
  beard: boolean
  lipstick: boolean
  grin: boolean
  logo: boolean
  prop: PropKind
}

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------

/** mid: block standing or crouching · low: crouch-block only · overhead: stand-block only */
export type HitLevel = 'mid' | 'low' | 'overhead'

/** What happens to whoever gets hit (moves, projectiles and the incident all use this). */
export interface HitProps {
  damage: number
  hitstun: number
  blockstun: number
  /** horizontal push speed given to the defender */
  pushHit: number
  pushBlock: number
  /** freeze frames on hit */
  hitstop: number
  level: HitLevel | 'unblockable'
  knockdown?: boolean
  heavy?: boolean
  /** damage taken even when blocking */
  chip?: number
  /** knockdown launch speed [vx, vy] (default [1.6, 3.6]) */
  launch?: [number, number]
}

export type SpawnKind = 'coffee' | 'complaint' | 'bullshit' | 'incident'

export interface MoveDef extends HitProps {
  id: string
  name: string
  startup: number
  active: number
  recovery: number
  /** no hitbox = the move does its damage some other way (projectile, incident) */
  hitbox?: Rect
  /** extra hurtbox (the extended limb/prop) from the active frames on, so whiffs can be punished */
  hurtExt?: Rect
  air?: boolean
  crouch?: boolean
  /** spawn a projectile / effect on this frame of the move */
  spawn?: { frame: number; kind: SpawnKind }
  poses: { startup: Pose; active: Pose; recover: Pose }
  /** optional looping animation during startup (e.g. furious typing) */
  loop?: Pose[]
}

export interface MoveSet {
  standLK: MoveDef
  standHK: MoveDef
  crouchLK: MoveDef
  crouchHK: MoveDef
  airLK: MoveDef
  airHK: MoveDef
}

/** Relative directions: Forward, Back, Up, Down. */
export type Dir = 'F' | 'B' | 'U' | 'D'

export interface SpecialDef {
  move: MoveDef
  /** directions to press in order, then the button */
  seq: Dir[]
  button: 'lk' | 'hk'
  /** frames before it can be used again */
  cooldown: number
  /** e.g. "↓ → X" for the UI */
  label: string
  description: string
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
  /** for the select screen, 1-5 */
  power: number
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
  look: Look
  palettes: Palette[]
  poses: PoseSet
  moves: MoveSet
  special: SpecialDef
  /** half width of the body hurtbox */
  hurtHalfW: number
  /** blurb for the select screen */
  bio: string
}
