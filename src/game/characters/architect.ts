import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveDef, Palette, Pose } from '../types'
import { baseMoves, reach, specialMove, standLegs, tweak } from './common'

/**
 * THE ARCHITECT — tall, fit, black turtleneck, enormous glasses. Fights with
 * a whole whiteboard: slow, huge reach. His Ivory Tower drops a stack of
 * architecture boxes wherever you're standing.
 */

const boardPoke: MoveDef = {
  id: 'boardPoke',
  name: 'Whiteboard Poke',
  startup: 7,
  active: 3,
  recovery: 13,
  damage: 8,
  hitstun: 16,
  blockstun: 11,
  pushHit: 3.5,
  pushBlock: 3.5,
  hitstop: 8,
  level: 'mid',
  hitbox: { x0: 20, y0: 32, x1: 52, y1: 58 },
  hurtExt: { x0: 14, y0: 34, x1: 44, y1: 54 },
  poses: {
    startup: { hip: [-2, 27], lean: -6, ...standLegs, nearArm: { ik: [2, 42] }, farArm: { ik: [6, 44] }, prop: { angle: 120 } },
    active: { hip: [3, 27], lean: 10, face: 'shout', ...standLegs, nearArm: { a: [88, 90] }, farArm: { ik: [14, 44] }, prop: { angle: 90 } },
    recover: { hip: [1, 27], lean: 6, ...standLegs, nearArm: { ik: [10, 42] }, farArm: { ik: [12, 42] }, prop: { angle: 60 } },
  },
}

const designReview: MoveDef = {
  id: 'designReview',
  name: 'Design Review',
  startup: 11,
  active: 4,
  recovery: 22,
  damage: 16,
  hitstun: 22,
  blockstun: 17,
  pushHit: 5,
  pushBlock: 5,
  hitstop: 13,
  heavy: true,
  level: 'mid',
  hitbox: { x0: 14, y0: 6, x1: 52, y1: 58 },
  hurtExt: { x0: 10, y0: 8, x1: 44, y1: 50 },
  poses: {
    startup: { hip: [-2, 28], lean: -16, ...standLegs, nearArm: { a: [190, 200] }, farArm: { a: [170, 190] }, prop: { angle: 200 } },
    active: { hip: [3, 26], lean: 22, face: 'shout', ...standLegs, nearArm: { a: [112, 118] }, farArm: { a: [100, 112] }, prop: { angle: 118 } },
    recover: { hip: [2, 25], lean: 24, ...standLegs, nearArm: { a: [75, 70] }, farArm: { a: [65, 60] }, prop: { angle: 80 } },
  },
}

const sketching = (i: number): Pose => ({
  hip: [0, 27],
  lean: 4,
  head: i % 2 ? 4 : -2,
  face: 'normal',
  ...standLegs,
  nearArm: { ik: [8, 40] },
  farArm: { ik: [16 + (i % 2) * 3, 52 - (i % 2) * 4] },
  prop: { angle: 165 },
})

const ivoryTower = specialMove({
  id: 'ivoryTower',
  name: 'Ivory Tower',
  startup: 18,
  active: 8,
  recovery: 18,
  spawn: { frame: 4, kind: 'tower' },
  loop: [sketching(0), sketching(1)],
  poses: {
    startup: sketching(0),
    active: { hip: [0, 28], lean: -8, head: 10, face: 'shout', ...standLegs, nearArm: { ik: [8, 42] }, farArm: { a: [150, 170] }, prop: { angle: 165 } },
    recover: sketching(0),
  },
})

const base = {
  outline: '#1a1020',
  eye: '#e8f8ff',
  belt: '#1a1020',
  tie: '#000000',
  tieShade: '#000000',
  prop: '#9aa4b0',
  propShade: '#6a7480',
  propB: '#f8f8f4',
  propDark: '#1f3b8c',
}

const palettes: Palette[] = [
  {
    ...base,
    id: 'arch-a',
    skin: '#e8b890',
    skinShade: '#b88660',
    hair: '#4a4a52',
    hairShade: '#2a2a30',
    top: '#1e1e26',
    topShade: '#0e0e14',
    jacket: '#1e1e26',
    jacketShade: '#0e0e14',
    legs: '#c8b48a',
    legsShade: '#9a8660',
    shoe: '#3a2a1e',
    shoeShine: '#7a5a3e',
    accent: '#101014',
  },
  {
    ...base,
    id: 'arch-b',
    skin: '#7a4a2c',
    skinShade: '#52301a',
    hair: '#101014',
    hairShade: '#000000',
    top: '#f4f4ee',
    topShade: '#c4c4cc',
    jacket: '#f4f4ee',
    jacketShade: '#c4c4cc',
    legs: '#2a2a30',
    legsShade: '#18181c',
    shoe: '#1a1a1a',
    shoeShine: '#5a5a5a',
    accent: '#c89a28',
  },
]

export const architect: CharacterDef = {
  id: 'architect',
  name: 'ARCHITECT',
  title: 'Principal Solutions Architect',
  bio: 'Runs marathons and design reviews. Has never shipped a line of code, but has drawn a lot of boxes.',
  stats: { health: 104, power: 4, walkF: 1.5, walkB: 1.2, jumpV: 5.5, jumpVX: 1.9 },
  body: {
    thigh: 16,
    shin: 17,
    upperArm: 12,
    foreArm: 11,
    torso: 22,
    neck: 3,
    headR: 8.5,
    shoulderW: 24,
    hipW: 13,
    thighW: 8,
    shinW: 7,
    armW: 6.5,
    foreW: 5.5,
  },
  look: {
    hair: 'crew',
    top: 'turtleneck',
    tie: false,
    skirt: false,
    belly: 0,
    shoes: 'flat',
    glasses: 'huge',
    beard: false,
    lipstick: false,
    grin: false,
    logo: false,
    prop: 'whiteboard',
  },
  hurtHalfW: 12,
  palettes,
  poses: defaultPoses,
  moves: {
    ...baseMoves,
    standLK: boardPoke,
    standHK: designReview,
    crouchLK: reach(tweak(baseMoves.crouchLK, { name: 'Long Stride' }), 3),
    crouchHK: reach(tweak(baseMoves.crouchHK, { name: 'Legacy Migration' }), 3),
    airLK: reach(tweak(baseMoves.airLK, { name: 'Bird\'s-Eye View' }), 2),
    airHK: reach(tweak(baseMoves.airHK, { name: 'Top-Down Design', damage: 12 }), 2),
  },
  special: {
    move: ivoryTower,
    seq: ['D', 'B'],
    button: 'lk',
    cooldown: 300,
    label: '↓ ← X',
    description: 'A shadow appears under the opponent, then a stack of architecture boxes crashes down. Walk out of the shadow!',
  },
}
