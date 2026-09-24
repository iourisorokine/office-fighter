import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveDef, Palette, Pose } from '../types'
import { baseMoves, reach, specialMove, standLegs, tweak } from './common'

/**
 * THE DEVELOPER — big, slow, hard to knock over. Swings a mechanical
 * keyboard, and can declare an incident that turns the whole office red.
 */

const ctrlAltJab: MoveDef = {
  id: 'ctrlAltJab',
  name: 'Ctrl+Alt+Jab',
  startup: 5,
  active: 3,
  recovery: 11,
  damage: 8,
  hitstun: 16,
  blockstun: 11,
  pushHit: 3,
  pushBlock: 3,
  hitstop: 8,
  level: 'mid',
  hitbox: { x0: 20, y0: 34, x1: 47, y1: 48 },
  hurtExt: { x0: 14, y0: 36, x1: 40, y1: 46 },
  poses: {
    startup: { hip: [-1, 27], lean: -4, ...standLegs, nearArm: { ik: [3, 44] }, farArm: { ik: [8, 42] }, prop: { angle: 95 } },
    active: { hip: [3, 27], lean: 10, face: 'shout', ...standLegs, nearArm: { a: [88, 92] }, farArm: { ik: [16, 42] }, prop: { angle: 92 } },
    recover: { hip: [1, 27], lean: 6, ...standLegs, nearArm: { ik: [10, 42] }, farArm: { ik: [12, 42] }, prop: { angle: 100 } },
  },
}

const overheadDeploy: MoveDef = {
  id: 'overheadDeploy',
  name: 'Overhead Deploy',
  startup: 10,
  active: 4,
  recovery: 20,
  damage: 15,
  hitstun: 21,
  blockstun: 16,
  pushHit: 4.5,
  pushBlock: 4.5,
  hitstop: 12,
  heavy: true,
  level: 'mid',
  hitbox: { x0: 16, y0: 16, x1: 46, y1: 50 },
  hurtExt: { x0: 12, y0: 18, x1: 38, y1: 44 },
  poses: {
    startup: { hip: [-2, 28], lean: -16, ...standLegs, nearArm: { a: [190, 200] }, farArm: { a: [170, 190] }, prop: { angle: 225 } },
    active: { hip: [3, 26], lean: 22, face: 'shout', ...standLegs, nearArm: { a: [115, 120] }, farArm: { a: [100, 115] }, prop: { angle: 125 } },
    recover: { hip: [2, 25], lean: 26, ...standLegs, nearArm: { a: [70, 60] }, farArm: { a: [60, 50] }, prop: { angle: 70 } },
  },
}

const typing = (i: number): Pose => ({
  hip: [0, 26],
  lean: 14,
  head: i % 2 ? 6 : -2,
  face: i % 2 ? 'shout' : 'normal',
  ...standLegs,
  nearArm: { ik: [16, 33 + (i % 2)] },
  farArm: { ik: [19, 35 - (i % 2)] },
  prop: { angle: 90 },
})

const incidentDeclared = specialMove({
  id: 'incident',
  name: 'Incident Declared',
  startup: 46,
  active: 10,
  recovery: 26,
  spawn: { frame: 1, kind: 'incident' },
  loop: [typing(0), typing(1)],
  poses: {
    startup: typing(0),
    active: { hip: [0, 28], lean: -6, head: 10, face: 'shout', ...standLegs, nearArm: { a: [160, 175] }, farArm: { a: [150, 170] }, prop: { angle: 180 } },
    recover: typing(0),
  },
})

const base = {
  outline: '#1a1020',
  eye: '#dff4ff',
  belt: '#2a1a12',
  tieShade: '#000000',
  prop: '#d8cfb2',
  propShade: '#a89e80',
  propB: '#e8e0c4',
  propDark: '#5a5448',
}

const palettes: Palette[] = [
  {
    ...base,
    id: 'dev-a',
    skin: '#f4d0b0',
    skinShade: '#c8987a',
    hair: '#5a3a1e',
    hairShade: '#3a2410',
    top: '#2d2d3a',
    topShade: '#1a1a24',
    jacket: '#2d2d3a',
    jacketShade: '#1a1a24',
    legs: '#4a6a9a',
    legsShade: '#30486e',
    shoe: '#f0f0f0',
    shoeShine: '#b8b8c0',
    accent: '#1a1a1a',
    tie: '#39d353',
  },
  {
    ...base,
    id: 'dev-b',
    skin: '#d8a078',
    skinShade: '#a8704e',
    hair: '#1a1a1a',
    hairShade: '#000000',
    top: '#6a2a8a',
    topShade: '#48185e',
    jacket: '#6a2a8a',
    jacketShade: '#48185e',
    legs: '#3a3a3a',
    legsShade: '#222222',
    shoe: '#e03030',
    shoeShine: '#a01818',
    accent: '#1a1a1a',
    tie: '#ffd23c',
  },
]

export const developer: CharacterDef = {
  id: 'dev',
  name: 'DEVELOPER',
  title: 'Senior Full-Stack Wizard',
  bio: 'Has not seen daylight since the last release. Types at 140 WPM, hits harder.',
  stats: { health: 126, power: 5, walkF: 1.2, walkB: 1.0, jumpV: 5.0, jumpVX: 1.6 },
  body: {
    thigh: 13,
    shin: 13,
    upperArm: 10,
    foreArm: 9,
    torso: 21,
    neck: 2,
    headR: 10,
    shoulderW: 23,
    hipW: 19,
    thighW: 11,
    shinW: 9,
    armW: 7,
    foreW: 6,
  },
  look: {
    hair: 'messy',
    top: 'tshirt',
    tie: false,
    skirt: false,
    belly: 9,
    shoes: 'sneakers',
    glasses: 'normal',
    beard: true,
    lipstick: false,
    grin: false,
    logo: true,
    prop: 'keyboard',
  },
  hurtHalfW: 15,
  palettes,
  poses: defaultPoses,
  moves: {
    standLK: ctrlAltJab,
    standHK: overheadDeploy,
    crouchLK: reach(tweak(baseMoves.crouchLK, { name: 'Sneaker Poke' }), -3),
    crouchHK: reach(tweak(baseMoves.crouchHK, { name: 'Legacy Sweep', damage: 13 }), -3),
    airLK: reach(tweak(baseMoves.airLK, { name: 'Hotfix Kick' }), -3),
    airHK: reach(tweak(baseMoves.airHK, { name: 'Belly Flop', damage: 13 }), -3),
  },
  special: {
    move: incidentDeclared,
    seq: ['D', 'D'],
    button: 'hk',
    cooldown: 480,
    label: '↓ ↓ C',
    description: 'Declares a SEV-1 incident: everything turns red and the opponent loses health. Jump to dodge it!',
  },
}
