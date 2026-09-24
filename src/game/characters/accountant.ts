import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveDef, Palette, Pose } from '../types'
import { baseMoves, specialMove, standLegs, tweak } from './common'

/**
 * THE ACCOUNTANT — small, big head, light-brown curls, big square black
 * glasses and a permanent frown. Beige shirt, red tie, pocket protector.
 * Hits with a giant calculator; Cost Cutting drops giant scissors on you.
 */

const calculatorJab: MoveDef = {
  id: 'calculatorJab',
  name: 'Itemized Jab',
  startup: 5,
  active: 3,
  recovery: 11,
  damage: 7,
  hitstun: 15,
  blockstun: 10,
  pushHit: 3,
  pushBlock: 3,
  hitstop: 8,
  level: 'mid',
  hitbox: { x0: 16, y0: 30, x1: 44, y1: 52 },
  hurtExt: { x0: 12, y0: 32, x1: 38, y1: 50 },
  poses: {
    startup: { hip: [-1, 27], lean: -4, ...standLegs, nearArm: { ik: [4, 40] }, farArm: { ik: [8, 38] }, prop: { angle: 115 } },
    active: { hip: [3, 27], lean: 10, face: 'shout', ...standLegs, nearArm: { a: [90, 92] }, farArm: { ik: [8, 38] }, prop: { angle: 95 } },
    recover: { hip: [1, 27], lean: 6, ...standLegs, nearArm: { ik: [10, 40] }, farArm: { ik: [10, 38] }, prop: { angle: 120 } },
  },
}

const auditSlam: MoveDef = {
  id: 'auditSlam',
  name: 'Audit Slam',
  startup: 10,
  active: 4,
  recovery: 20,
  damage: 14,
  hitstun: 20,
  blockstun: 15,
  pushHit: 4.5,
  pushBlock: 4.5,
  hitstop: 12,
  heavy: true,
  level: 'mid',
  hitbox: { x0: 14, y0: 10, x1: 44, y1: 52 },
  hurtExt: { x0: 10, y0: 12, x1: 38, y1: 46 },
  poses: {
    startup: { hip: [-2, 28], lean: -14, ...standLegs, nearArm: { a: [190, 200] }, farArm: { a: [165, 185] }, prop: { angle: 215 } },
    active: { hip: [3, 26], lean: 20, face: 'shout', ...standLegs, nearArm: { a: [115, 120] }, farArm: { a: [100, 112] }, prop: { angle: 125 } },
    recover: { hip: [2, 25], lean: 22, ...standLegs, nearArm: { a: [70, 60] }, farArm: { a: [60, 50] }, prop: { angle: 75 } },
  },
}

/** punching numbers into the calculator, faster and faster */
const crunching = (i: number): Pose => ({
  hip: [0, 27],
  lean: 8,
  head: i % 2 ? 8 : 4,
  ...standLegs,
  nearArm: { ik: [10, 38] },
  farArm: { ik: [15 + (i % 2), 41 - (i % 2) * 2] },
  prop: { angle: 160 },
})

const costCutting = specialMove({
  id: 'costCutting',
  name: 'Cost Cutting',
  startup: 16,
  active: 8,
  recovery: 18,
  spawn: { frame: 4, kind: 'scissors' },
  loop: [crunching(0), crunching(1)],
  poses: {
    startup: crunching(0),
    active: {
      hip: [0, 28],
      lean: -6,
      head: -8,
      face: 'shout',
      ...standLegs,
      nearArm: { ik: [10, 40] },
      farArm: { a: [150, 170] },
      prop: { angle: 160 },
    },
    recover: crunching(0),
  },
})

const base = {
  outline: '#1a1020',
  eye: '#ffffff',
  belt: '#2a1a12',
  accent: '#101014',
  prop: '#4a4a52',
  propShade: '#2e2e34',
  propB: '#a8c8a0',
  propDark: '#20301e',
}

const palettes: Palette[] = [
  {
    ...base,
    id: 'acc-a',
    skin: '#f2c8a2',
    skinShade: '#c4926a',
    hair: '#b08050',
    hairShade: '#7a5430',
    top: '#e8dcc0',
    topShade: '#b8a888',
    jacket: '#e8dcc0',
    jacketShade: '#b8a888',
    legs: '#6a4a2e',
    legsShade: '#46301c',
    shoe: '#2a1a12',
    shoeShine: '#5a3a24',
    tie: '#c81e2a',
    tieShade: '#8a1018',
  },
  {
    ...base,
    id: 'acc-b',
    skin: '#a8704a',
    skinShade: '#7a4a2c',
    hair: '#3a2418',
    hairShade: '#1e120a',
    top: '#c8dcf0',
    topShade: '#90a8c4',
    jacket: '#c8dcf0',
    jacketShade: '#90a8c4',
    legs: '#3a3a44',
    legsShade: '#22222a',
    shoe: '#1a1a1a',
    shoeShine: '#4a4a4a',
    tie: '#1f3b8c',
    tieShade: '#0f1f52',
  },
]

export const accountant: CharacterDef = {
  id: 'accountant',
  name: 'ACCOUNTANT',
  title: 'Senior Cost Controller',
  bio: 'Audited the coffee budget and found you guilty. Every punch is itemized, every kick is billable.',
  stats: { health: 96, power: 3, walkF: 1.6, walkB: 1.3, jumpV: 5.5, jumpVX: 1.9 },
  body: {
    thigh: 13,
    shin: 13,
    upperArm: 9.5,
    foreArm: 9,
    torso: 18,
    neck: 2,
    headR: 11,
    shoulderW: 17,
    hipW: 15,
    thighW: 7.5,
    shinW: 6,
    armW: 5,
    foreW: 4.5,
  },
  look: {
    hair: 'curly',
    top: 'shirt',
    tie: true,
    skirt: false,
    belly: 0,
    shoes: 'flat',
    glasses: 'square',
    beard: false,
    lipstick: false,
    grin: false,
    logo: false,
    prop: 'calculator',
    propScale: 1.2,
    mood: 'frown',
    pens: true,
  },
  // stiff and upright, small steps, calculator held up like a shield
  style: { lean: -2, head: 3, stance: 0.8, guard: [0, 2] },
  hurtHalfW: 11,
  palettes,
  poses: defaultPoses,
  moves: {
    ...baseMoves,
    standLK: calculatorJab,
    standHK: auditSlam,
    crouchLK: tweak(baseMoves.crouchLK, { name: 'Petty Cash Kick' }),
    crouchHK: tweak(baseMoves.crouchHK, { name: 'Write-Off Sweep' }),
    airLK: tweak(baseMoves.airLK, { name: 'Depreciation' }),
    airHK: tweak(baseMoves.airHK, { name: 'Tax Return' }),
  },
  special: {
    move: costCutting,
    seq: ['D', 'B'],
    button: 'lk',
    cooldown: 300,
    label: '↓ ← X',
    description: 'A shadow appears under the opponent, then giant scissors fall and snip: "COST CUTTING!" Walk out of the shadow!',
  },
}
