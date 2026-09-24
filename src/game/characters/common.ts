import type { MoveDef, MoveSet, Pose } from '../types'

/**
 * Building blocks shared by all characters: the kick moves (with their key
 * poses) and a helper to derive a character's own version of a move.
 */

export const guard = { nearArm: { ik: [9, 41] as [number, number] }, farArm: { ik: [14, 39] as [number, number] } }
export const crouchArms = { nearArm: { ik: [14, 33] as [number, number] }, farArm: { ik: [19, 30] as [number, number] } }
export const airArms = { nearArm: { a: [60, 150] as [number, number] }, farArm: { a: [85, 125] as [number, number] } }

// --- standing light kick: quick front kick with the rear leg -----------------
const lkChamber: Pose = { hip: [1, 27], lean: -4, farLeg: { ik: [5, 2] }, nearLeg: { a: [65, -15] }, ...guard }
const lkExtend: Pose = {
  hip: [2, 27],
  lean: -10,
  face: 'shout',
  farLeg: { ik: [4, 2] },
  nearLeg: { a: [80, 85] },
  ...guard,
}

// --- standing heavy kick: big roundhouse at chest/head height ---------------
const hkChamber: Pose = {
  hip: [0, 28],
  lean: -12,
  farLeg: { ik: [3, 2] },
  nearLeg: { a: [100, 10] },
  nearArm: { ik: [4, 46] },
  farArm: { ik: [14, 48] },
}
const hkExtend: Pose = {
  hip: [3, 28],
  lean: -28,
  head: 14,
  face: 'shout',
  farLeg: { ik: [2, 2] },
  nearLeg: { a: [112, 118] },
  nearArm: { a: [-40, -20] },
  farArm: { a: [60, 120] },
}

// --- crouching light kick: low shin poke -------------------------------------
const clkChamber: Pose = { hip: [0, 15], lean: 18, farLeg: { ik: [-4, 2] }, nearLeg: { a: [60, 30] }, ...crouchArms }
const clkExtend: Pose = {
  hip: [2, 14],
  lean: 15,
  face: 'shout',
  farLeg: { ik: [-4, 2] },
  nearLeg: { a: [72, 86] },
  ...crouchArms,
}

// --- crouching heavy kick: the sweep ("the coffee-spill sweep") --------------
const sweepChamber: Pose = {
  hip: [-2, 13],
  lean: 30,
  farLeg: { ik: [-6, 2] },
  nearLeg: { a: [40, 20] },
  nearArm: { ik: [8, 20] },
  farArm: { ik: [12, 3] },
}
const sweepExtend: Pose = {
  hip: [0, 10],
  lean: 40,
  face: 'shout',
  farLeg: { ik: [-7, 2] },
  nearLeg: { a: [83, 88] },
  nearArm: { ik: [6, 18] },
  farArm: { ik: [13, 2] },
}

// --- air kicks ---------------------------------------------------------------
export const airTuck: Pose = { hip: [0, 32], lean: 8, nearLeg: { a: [80, -10] }, farLeg: { a: [88, -25] }, ...airArms }
const airLKPose: Pose = {
  hip: [0, 30],
  lean: 12,
  face: 'shout',
  nearLeg: { a: [55, 55] },
  farLeg: { a: [85, -20] },
  ...airArms,
}
const airHKPose: Pose = {
  hip: [0, 30],
  lean: -15,
  face: 'shout',
  nearLeg: { a: [75, 80] },
  farLeg: { a: [80, -20] },
  nearArm: { a: [-60, -30] },
  farArm: { a: [70, 140] },
}

/** The shared kick moves every character starts from (the Intern uses them as-is). */
export const baseMoves: MoveSet = {
  standLK: {
    id: 'standLK',
    name: 'Memo Poke',
    startup: 4,
    active: 3,
    recovery: 9,
    damage: 6,
    hitstun: 14,
    blockstun: 10,
    pushHit: 2.5,
    pushBlock: 3,
    hitstop: 7,
    level: 'mid',
    hitbox: { x0: 18, y0: 16, x1: 36, y1: 30 },
    hurtExt: { x0: 12, y0: 18, x1: 32, y1: 28 },
    poses: { startup: lkChamber, active: lkExtend, recover: lkChamber },
  },
  standHK: {
    id: 'standHK',
    name: 'Performance Review',
    startup: 8,
    active: 4,
    recovery: 18,
    damage: 13,
    hitstun: 20,
    blockstun: 15,
    pushHit: 4,
    pushBlock: 4,
    hitstop: 11,
    heavy: true,
    level: 'mid',
    hitbox: { x0: 19, y0: 33, x1: 38, y1: 50 },
    hurtExt: { x0: 12, y0: 32, x1: 34, y1: 46 },
    poses: { startup: hkChamber, active: hkExtend, recover: hkChamber },
  },
  crouchLK: {
    id: 'crouchLK',
    name: 'Shin Memo',
    startup: 4,
    active: 2,
    recovery: 8,
    damage: 5,
    hitstun: 13,
    blockstun: 9,
    pushHit: 2,
    pushBlock: 2.5,
    hitstop: 6,
    level: 'low',
    crouch: true,
    hitbox: { x0: 18, y0: 1, x1: 35, y1: 13 },
    hurtExt: { x0: 12, y0: 2, x1: 30, y1: 12 },
    poses: { startup: clkChamber, active: clkExtend, recover: clkChamber },
  },
  crouchHK: {
    id: 'crouchHK',
    name: 'Coffee-Spill Sweep',
    startup: 7,
    active: 5,
    recovery: 20,
    damage: 12,
    hitstun: 20,
    blockstun: 14,
    pushHit: 2,
    pushBlock: 3,
    hitstop: 10,
    heavy: true,
    knockdown: true,
    level: 'low',
    crouch: true,
    hitbox: { x0: 16, y0: 0, x1: 36, y1: 11 },
    hurtExt: { x0: 10, y0: 0, x1: 32, y1: 10 },
    poses: { startup: sweepChamber, active: sweepExtend, recover: sweepChamber },
  },
  airLK: {
    id: 'airLK',
    name: 'Flying Memo',
    startup: 4,
    active: 10,
    recovery: 6,
    damage: 7,
    hitstun: 14,
    blockstun: 10,
    pushHit: 2,
    pushBlock: 2.5,
    hitstop: 7,
    level: 'overhead',
    air: true,
    hitbox: { x0: 12, y0: 6, x1: 30, y1: 24 },
    poses: { startup: airTuck, active: airLKPose, recover: airLKPose },
  },
  airHK: {
    id: 'airHK',
    name: 'Flying Deadline',
    startup: 6,
    active: 7,
    recovery: 10,
    damage: 11,
    hitstun: 18,
    blockstun: 13,
    pushHit: 3,
    pushBlock: 3,
    hitstop: 10,
    heavy: true,
    level: 'overhead',
    air: true,
    hitbox: { x0: 16, y0: 15, x1: 35, y1: 32 },
    poses: { startup: airTuck, active: airHKPose, recover: airHKPose },
  },
}

/** Copy a move with some fields changed (keeps the shared one untouched). */
export function tweak(move: MoveDef, patch: Partial<MoveDef>): MoveDef {
  return { ...move, ...patch }
}

/** Shift a move's hitbox/hurtbox reach (e.g. short legs reach less). */
export function reach(move: MoveDef, dx: number): MoveDef {
  const shift = (r?: MoveDef['hitbox']) => (r ? { ...r, x1: r.x1 + dx } : r)
  return { ...move, hitbox: shift(move.hitbox), hurtExt: shift(move.hurtExt) }
}

type SpecialFields = Pick<MoveDef, 'id' | 'name' | 'startup' | 'active' | 'recovery' | 'spawn' | 'poses' | 'loop'>

/** A special move does its damage through what it spawns, not a hitbox. */
export function specialMove(m: SpecialFields): MoveDef {
  return { damage: 0, hitstun: 0, blockstun: 0, pushHit: 0, pushBlock: 0, hitstop: 0, level: 'mid', ...m }
}

/** Standing legs used by most weapon strikes. */
export const standLegs = { nearLeg: { ik: [-9, 2] as [number, number] }, farLeg: { ik: [9, 2] as [number, number] } }
