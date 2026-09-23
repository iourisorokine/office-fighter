import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveDef, Palette } from '../types'
import { baseMoves, specialMove, standLegs, tweak } from './common'

/**
 * THE SALES REP — padded shoulders, gelled hair, brick phone.
 * Fast and slippery, lighter hits, and the Mega Bullshit that blows everyone away.
 */

const coldCall: MoveDef = {
  id: 'coldCall',
  name: 'Cold Call',
  startup: 4,
  active: 3,
  recovery: 8,
  damage: 6,
  hitstun: 13,
  blockstun: 9,
  pushHit: 2.5,
  pushBlock: 2.8,
  hitstop: 7,
  level: 'mid',
  hitbox: { x0: 16, y0: 40, x1: 36, y1: 56 },
  hurtExt: { x0: 12, y0: 42, x1: 30, y1: 54 },
  poses: {
    startup: { hip: [0, 27], lean: -4, ...standLegs, nearArm: { ik: [5, 52] }, farArm: { ik: [12, 44] }, prop: { angle: 170 } },
    active: { hip: [3, 27], lean: 10, face: 'shout', ...standLegs, nearArm: { a: [92, 88] }, farArm: { ik: [6, 40] }, prop: { angle: 85 } },
    recover: { hip: [1, 27], lean: 6, ...standLegs, nearArm: { ik: [12, 46] }, farArm: { ik: [10, 42] }, prop: { angle: 150 } },
  },
}

const megaBullshit = specialMove({
  id: 'megaBullshit',
  name: 'Mega Bullshit',
  startup: 16,
  active: 14,
  recovery: 20,
  spawn: { frame: 14, kind: 'bullshit' },
  poses: {
    startup: {
      hip: [-2, 27],
      lean: -16,
      head: -10,
      ...standLegs,
      nearArm: { a: [150, 175] },
      farArm: { a: [-150, -170] },
    },
    active: {
      hip: [3, 26],
      lean: 18,
      head: 8,
      face: 'shout',
      nearLeg: { ik: [-12, 2] },
      farLeg: { ik: [11, 2] },
      nearArm: { a: [110, 120] },
      farArm: { a: [60, 80] },
    },
    recover: { hip: [1, 27], lean: 8, ...standLegs, nearArm: { a: [70, 90] }, farArm: { ik: [12, 42] } },
  },
})

const base = {
  outline: '#1a1020',
  eye: '#ffffff',
  belt: '#1a1020',
  accent: '#1a1020',
  prop: '#3a3a40',
  propShade: '#1e1e22',
  propB: '#9aff6a',
  propDark: '#101012',
}

const palettes: Palette[] = [
  {
    ...base,
    id: 'sales-a',
    skin: '#e8a878',
    skinShade: '#b87850',
    hair: '#e0c050',
    hairShade: '#a8882a',
    top: '#b8d8f8',
    topShade: '#80a8d0',
    jacket: '#4a3a8a',
    jacketShade: '#2e2260',
    legs: '#4a3a8a',
    legsShade: '#2e2260',
    shoe: '#6a3a1a',
    shoeShine: '#b0703a',
    tie: '#ffd23c',
    tieShade: '#c09010',
  },
  {
    ...base,
    id: 'sales-b',
    skin: '#8a5a3a',
    skinShade: '#603a22',
    hair: '#101014',
    hairShade: '#000000',
    top: '#fff0f0',
    topShade: '#d8c0c0',
    jacket: '#8a1c2a',
    jacketShade: '#5e101a',
    legs: '#2a2a30',
    legsShade: '#18181c',
    shoe: '#1a1a1a',
    shoeShine: '#5a5a5a',
    tie: '#3adfff',
    tieShade: '#1a90b0',
  },
]

export const salesRep: CharacterDef = {
  id: 'sales',
  name: 'SALES REP',
  title: 'Top Performer, Q3',
  bio: 'Always closing. Never listening. His phone bill is a weapon of its own.',
  stats: { health: 92, power: 2, walkF: 2.0, walkB: 1.5, jumpV: 5.5, jumpVX: 2.1 },
  body: {
    thigh: 15,
    shin: 16,
    upperArm: 11,
    foreArm: 10,
    torso: 22,
    neck: 3,
    headR: 9,
    shoulderW: 23,
    hipW: 15,
    thighW: 8,
    shinW: 7,
    armW: 6.5,
    foreW: 5,
  },
  look: {
    hair: 'slick',
    top: 'jacket',
    tie: true,
    skirt: false,
    belly: 0,
    shoes: 'flat',
    glasses: false,
    beard: false,
    lipstick: false,
    grin: true,
    logo: false,
    prop: 'phone',
  },
  hurtHalfW: 12,
  palettes,
  poses: defaultPoses,
  moves: {
    ...baseMoves,
    standLK: coldCall,
    standHK: tweak(baseMoves.standHK, { name: 'Closing Kick', damage: 12 }),
    crouchLK: tweak(baseMoves.crouchLK, { name: 'Lowball Offer' }),
    crouchHK: tweak(baseMoves.crouchHK, { name: 'Upsell Sweep' }),
  },
  special: {
    move: megaBullshit,
    seq: ['F', 'F'],
    button: 'hk',
    cooldown: 330,
    label: '→ → C',
    description: 'A gale of pure bullshit comes out of his mouth and blows everything away.',
  },
}
