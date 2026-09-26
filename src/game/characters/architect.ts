import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveDef, Palette, Pose } from '../types'
import { baseMoves, reach, specialMove, standLegs, tweak } from './common'

/**
 * THE ARCHITECT, "the Diagram Wizard" — a software architect who speaks
 * only in boxes and arrows. Wild grey hair, a long cardigan worn like a
 * robe, a scarf. Fights with a rolled-up architecture diagram in a poster
 * tube, held like a wizard's staff: long reach. His heavy attack unrolls
 * the diagram like a whip, and Microservices sends a swarm of little
 * service boxes at you.
 */

const tubePoke: MoveDef = {
  id: 'tubePoke',
  name: 'Staff Review',
  startup: 6,
  active: 3,
  recovery: 13,
  damage: 8,
  hitstun: 16,
  blockstun: 11,
  pushHit: 3.5,
  pushBlock: 3.5,
  hitstop: 8,
  level: 'mid',
  hitbox: { x0: 22, y0: 36, x1: 56, y1: 50 },
  hurtExt: { x0: 14, y0: 36, x1: 42, y1: 50 },
  poses: {
    startup: { hip: [-2, 27], lean: -6, ...standLegs, nearArm: { ik: [2, 42] }, farArm: { ik: [6, 44] }, prop: { angle: 150 } },
    active: { hip: [3, 27], lean: 10, face: 'shout', ...standLegs, nearArm: { a: [88, 90] }, farArm: { ik: [14, 44] }, prop: { angle: 90 } },
    recover: { hip: [1, 27], lean: 6, ...standLegs, nearArm: { ik: [10, 42] }, farArm: { ik: [12, 42] }, prop: { angle: 110 } },
  },
}

const unrollDiagram: MoveDef = {
  id: 'unrollDiagram',
  name: 'Unroll the Diagram',
  startup: 12,
  active: 5,
  recovery: 22,
  damage: 15,
  hitstun: 22,
  blockstun: 17,
  pushHit: 5,
  pushBlock: 5,
  hitstop: 13,
  heavy: true,
  level: 'mid',
  hitbox: { x0: 18, y0: 26, x1: 68, y1: 54 },
  hurtExt: { x0: 10, y0: 30, x1: 40, y1: 50 },
  poses: {
    startup: { hip: [-2, 28], lean: -16, ...standLegs, nearArm: { a: [190, 200] }, farArm: { a: [170, 190] }, prop: { angle: 200 } },
    active: { hip: [3, 26], lean: 18, face: 'shout', ...standLegs, nearArm: { a: [95, 98] }, farArm: { a: [100, 112] }, prop: { angle: 94, open: true } },
    recover: { hip: [2, 25], lean: 20, ...standLegs, nearArm: { a: [80, 75] }, farArm: { a: [65, 60] }, prop: { angle: 78, open: true } },
  },
}

/** conducting the swarm: the staff waves, the free hand points */
const conjuring = (i: number): Pose => ({
  hip: [0, 27],
  lean: 4,
  head: i % 2 ? 4 : -2,
  face: 'shout',
  ...standLegs,
  nearArm: { ik: [8, 46 + (i % 2) * 3] },
  farArm: { ik: [16 + (i % 2) * 3, 52 - (i % 2) * 4] },
  prop: { angle: 160 + (i % 2) * 14 },
})

const microservices = specialMove({
  id: 'microservices',
  name: 'Microservices',
  startup: 16,
  active: 10,
  recovery: 18,
  spawn: { frame: 2, kind: 'swarm' },
  loop: [conjuring(0), conjuring(1)],
  poses: {
    startup: conjuring(0),
    active: { hip: [2, 27], lean: 10, face: 'shout', ...standLegs, nearArm: { a: [100, 96] }, farArm: { a: [70, 80] }, prop: { angle: 100 } },
    recover: conjuring(1),
  },
})

const base = {
  outline: '#1a1020',
  eye: '#e8f8ff',
  belt: '#1a1020',
  accent: '#101014', // glasses frames
  prop: '#2a3448',
  propShade: '#161c2a',
  propB: '#f4f4ee',
  propDark: '#3a7bd5',
}

const palettes: Palette[] = [
  {
    ...base,
    id: 'arch-a',
    skin: '#e8b890',
    skinShade: '#b88660',
    hair: '#c8c8cc',
    hairShade: '#8a8a94',
    top: '#2a3a4a', // t-shirt under the cardigan
    topShade: '#1a2632',
    jacket: '#a8845a', // oatmeal cardigan
    jacketShade: '#7a5e3c',
    legs: '#4a3a2a',
    legsShade: '#2e2418',
    shoe: '#3a2a1e',
    shoeShine: '#7a5a3e',
    tie: '#c8342a', // red scarf
    tieShade: '#8a1e18',
  },
  {
    ...base,
    id: 'arch-b',
    skin: '#7a4a2c',
    skinShade: '#52301a',
    hair: '#f0f0f4',
    hairShade: '#a8a8b4',
    top: '#e8e0c8',
    topShade: '#b8ae94',
    jacket: '#2e5a3a', // forest-green cardigan
    jacketShade: '#1c3a24',
    legs: '#2a2a30',
    legsShade: '#18181c',
    shoe: '#1a1a1a',
    shoeShine: '#5a5a5a',
    tie: '#e0a020', // mustard scarf
    tieShade: '#a06a10',
  },
]

export const architect: CharacterDef = {
  id: 'architect',
  name: 'ARCHITECT',
  title: 'Principal Architect, Diagram Wizard',
  bio: 'Speaks only in boxes and arrows. His diagrams have diagrams. Nobody has ever seen him open an IDE.',
  stats: { health: 104, power: 4, walkF: 1.5, walkB: 1.2, jumpV: 5.5, jumpVX: 1.9 },
  body: {
    thigh: 16,
    shin: 17,
    upperArm: 12,
    foreArm: 11,
    torso: 22,
    neck: 3,
    headR: 8.5,
    shoulderW: 22,
    hipW: 14,
    thighW: 8,
    shinW: 7,
    armW: 6.5,
    foreW: 5.5,
  },
  look: {
    hair: 'wizard',
    top: 'cardigan',
    robe: true,
    scarf: true,
    tie: false,
    skirt: false,
    belly: 0,
    shoes: 'flat',
    glasses: 'huge',
    beard: false,
    lipstick: false,
    grin: false,
    logo: false,
    prop: 'tube',
  },
  // a slight scholarly stoop, staff held upright
  style: { lean: 4, head: 2 },
  hurtHalfW: 12,
  palettes,
  poses: defaultPoses,
  moves: {
    ...baseMoves,
    standLK: tubePoke,
    standHK: unrollDiagram,
    crouchLK: reach(tweak(baseMoves.crouchLK, { name: 'Long Stride' }), 3),
    crouchHK: reach(tweak(baseMoves.crouchHK, { name: 'Legacy Migration' }), 3),
    airLK: reach(tweak(baseMoves.airLK, { name: "Bird's-Eye View" }), 2),
    airHK: reach(tweak(baseMoves.airHK, { name: 'Top-Down Design', damage: 12 }), 2),
  },
  special: {
    move: microservices,
    seq: ['D', 'B'],
    button: 'lk',
    cooldown: 300,
    label: '↓ ← X',
    description: 'Splits into a swarm of little service boxes that weave across the screen at the opponent, each one a small hit.',
  },
}
