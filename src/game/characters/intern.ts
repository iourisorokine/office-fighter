import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveSet, Palette, Pose } from '../types'

/**
 * THE INTERN — the generic placeholder fighter for phase 1.
 * The five office archetypes (HR lady, executive, accountant, sales rep,
 * developer) will each be a CharacterDef like this one, with their own
 * body proportions, palettes, stats, poses and moves.
 */

const guard = { nearArm: { ik: [7, 47] as [number, number] }, farArm: { ik: [13, 45] as [number, number] } }
const crouchArms = { nearArm: { ik: [14, 33] as [number, number] }, farArm: { ik: [19, 30] as [number, number] } }
const airArms = { nearArm: { a: [60, 150] as [number, number] }, farArm: { a: [85, 125] as [number, number] } }

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
const airTuck: Pose = { hip: [0, 32], lean: 8, nearLeg: { a: [80, -10] }, farLeg: { a: [88, -25] }, ...airArms }
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

const moves: MoveSet = {
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

const palettes: Palette[] = [
  {
    id: 'intern-a',
    outline: '#1a1020',
    skin: '#f2c089',
    skinShade: '#c98a55',
    hair: '#3a2418',
    hairShade: '#22140c',
    shirt: '#f4f4ee',
    shirtShade: '#a9b1c4',
    pants: '#4a4f5e',
    pantsShade: '#2e3140',
    shoe: '#1e1a1a',
    shoeShine: '#5a5252',
    tie: '#d62828',
    tieShade: '#8e1616',
    eye: '#ffffff',
    belt: '#2a1a12',
  },
  {
    id: 'intern-b',
    outline: '#1a1020',
    skin: '#c68a5a',
    skinShade: '#8e5a34',
    hair: '#101014',
    hairShade: '#000000',
    shirt: '#9fd0f0',
    shirtShade: '#5f89b8',
    pants: '#6b4a2e',
    pantsShade: '#46301c',
    shoe: '#3a2212',
    shoeShine: '#7a5236',
    tie: '#1f3b8c',
    tieShade: '#0f1f52',
    eye: '#ffffff',
    belt: '#1a120c',
  },
]

export const intern: CharacterDef = {
  id: 'intern',
  name: 'INTERN',
  title: 'The Unpaid Intern',
  stats: { health: 100, walkF: 1.7, walkB: 1.3, jumpV: 5.4, jumpVX: 1.9 },
  body: {
    thigh: 15,
    shin: 15,
    upperArm: 11,
    foreArm: 10,
    torso: 20,
    neck: 3,
    headR: 9,
    shoulderW: 20,
    hipW: 15,
    thighW: 9,
    shinW: 7,
    armW: 6,
    foreW: 5,
  },
  palettes,
  poses: defaultPoses,
  moves,
}
