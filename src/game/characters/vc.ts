import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveDef, Palette } from '../types'
import { baseMoves, reach, specialMove, standLegs, tweak } from './common'

/**
 * THE VC — the secret boss. Bigger than everyone, fleece vest, shades,
 * throws cash at everything. His Raise makes it rain money on you.
 * Not selectable: he shows up for a bonus round after a flawless 2-0.
 */

const makeItRain: MoveDef = {
  id: 'makeItRain',
  name: 'Make It Rain',
  startup: 7,
  active: 4,
  recovery: 17,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  pushHit: 0,
  pushBlock: 0,
  hitstop: 0,
  level: 'mid',
  spawn: { frame: 7, kind: 'cash' },
  poses: {
    startup: { hip: [-1, 27], lean: -8, ...standLegs, nearArm: { a: [-60, -20] }, farArm: { ik: [14, 44] } },
    active: { hip: [3, 26], lean: 12, face: 'shout', ...standLegs, nearArm: { a: [95, 100] }, farArm: { ik: [8, 40] }, prop: { hidden: true } },
    recover: { hip: [1, 27], lean: 6, ...standLegs, nearArm: { a: [80, 70] }, farArm: { ik: [12, 42] } },
  },
}

const raise = specialMove({
  id: 'raise',
  name: 'Raise',
  startup: 14,
  active: 22,
  recovery: 16,
  spawn: { frame: 14, kind: 'raise' },
  poses: {
    startup: { hip: [0, 26], lean: 10, ...standLegs, nearArm: { ik: [10, 34] }, farArm: { ik: [12, 32] } },
    active: {
      hip: [0, 28],
      lean: -6,
      head: 12,
      face: 'shout',
      nearLeg: { ik: [-10, 2] },
      farLeg: { ik: [10, 2] },
      nearArm: { a: [160, 175] },
      farArm: { a: [150, 170] },
    },
    recover: { hip: [0, 27], lean: 2, ...standLegs, nearArm: { a: [120, 150] }, farArm: { ik: [12, 42] } },
  },
})

const palettes: Palette[] = [
  {
    id: 'vc-a',
    outline: '#1a1020',
    skin: '#f0a878',
    skinShade: '#c07850',
    hair: '#6a4a2a',
    hairShade: '#3a2614',
    top: '#a8d0f0',
    topShade: '#6f98c0',
    jacket: '#1f2a4a',
    jacketShade: '#121a30',
    legs: '#d8c8a0',
    legsShade: '#a8987a',
    shoe: '#5a2a14',
    shoeShine: '#9a5a30',
    tie: '#000000',
    tieShade: '#000000',
    eye: '#ffffff',
    belt: '#3a2010',
    accent: '#1a1020',
    prop: '#5fb04a',
    propShade: '#2f7a2a',
    propB: '#f4e39a',
    propDark: '#123a1a',
  },
]

export const vc: CharacterDef = {
  id: 'vc',
  name: 'THE VC',
  title: 'Managing Partner, Moonshot Capital',
  bio: 'Invests in vibes. Bench-presses term sheets. Will absolutely circle back.',
  stats: { health: 112, power: 5, walkF: 1.5, walkB: 1.2, jumpV: 5.3, jumpVX: 1.8 },
  body: {
    thigh: 17,
    shin: 17,
    upperArm: 12,
    foreArm: 11,
    torso: 25,
    neck: 3,
    headR: 10,
    shoulderW: 30,
    hipW: 17,
    thighW: 11,
    shinW: 9,
    armW: 9,
    foreW: 8,
  },
  look: {
    hair: 'slick',
    top: 'vest',
    tie: false,
    skirt: false,
    belly: 0,
    shoes: 'flat',
    glasses: 'shades',
    beard: false,
    lipstick: false,
    grin: true,
    logo: false,
    prop: 'cash',
  },
  hurtHalfW: 13,
  palettes,
  poses: defaultPoses,
  moves: {
    ...baseMoves,
    standLK: makeItRain,
    standHK: reach(tweak(baseMoves.standHK, { name: 'Hostile Takeover', damage: 14, pushHit: 5 }), 2),
    crouchLK: reach(tweak(baseMoves.crouchLK, { name: 'Lowball Valuation', damage: 7 }), 4),
    crouchHK: reach(tweak(baseMoves.crouchHK, { name: 'Short Squeeze', damage: 12 }), 4),
    airLK: reach(tweak(baseMoves.airLK, { name: 'Pump', damage: 9 }), 3),
    airHK: reach(tweak(baseMoves.airHK, { name: 'Dump', damage: 14 }), 3),
  },
  special: {
    move: raise,
    seq: ['D', 'D'],
    button: 'lk',
    cooldown: 420,
    label: '↓ ↓ X',
    description: 'Series B! Money rains from the ceiling and every bill hurts. Block high or get out of the way.',
  },
}
