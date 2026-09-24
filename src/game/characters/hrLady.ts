import { defaultPoses } from '../fighter/poses'
import type { CharacterDef, MoveDef, Palette } from '../types'
import { airTuck, baseMoves, specialMove, standLegs, tweak } from './common'

/**
 * THE HR LADY — skirt suit, stilettos, and a very thick legal folder.
 * Good reach with the folder, sharp heel kicks, and a complaint projectile.
 */

const folderSlap: MoveDef = {
  id: 'folderSlap',
  name: 'Folder Slap',
  startup: 5,
  active: 3,
  recovery: 12,
  damage: 6,
  hitstun: 14,
  blockstun: 10,
  pushHit: 2.8,
  pushBlock: 3,
  hitstop: 8,
  level: 'mid',
  hitbox: { x0: 16, y0: 40, x1: 47, y1: 64 },
  hurtExt: { x0: 12, y0: 42, x1: 40, y1: 60 },
  poses: {
    startup: { hip: [-1, 27], lean: -8, ...standLegs, nearArm: { a: [200, 210] }, farArm: { ik: [12, 44] }, prop: { follow: true } },
    active: { hip: [2, 27], lean: 12, face: 'shout', ...standLegs, nearArm: { a: [100, 102] }, farArm: { ik: [6, 40] }, prop: { follow: true } },
    recover: { hip: [1, 27], lean: 8, ...standLegs, nearArm: { a: [60, 40] }, farArm: { ik: [8, 42] }, prop: { follow: true } },
  },
}

const folderDrop: MoveDef = {
  id: 'folderDrop',
  name: 'Folder Drop',
  startup: 5,
  active: 8,
  recovery: 6,
  damage: 8,
  hitstun: 15,
  blockstun: 10,
  pushHit: 2,
  pushBlock: 2.5,
  hitstop: 8,
  level: 'overhead',
  air: true,
  hitbox: { x0: 12, y0: 8, x1: 40, y1: 40 },
  poses: {
    startup: { ...airTuck, nearArm: { a: [190, 200] }, prop: { follow: true } },
    active: { ...airTuck, lean: 14, face: 'shout', nearArm: { a: [115, 130] }, prop: { follow: true } },
    recover: { ...airTuck, lean: 10, nearArm: { a: [110, 125] }, prop: { follow: true } },
  },
}

const formalComplaint = specialMove({
  id: 'formalComplaint',
  name: 'Formal Complaint',
  startup: 12,
  active: 12,
  recovery: 16,
  spawn: { frame: 12, kind: 'complaint' },
  poses: {
    startup: { hip: [0, 27], lean: -4, ...standLegs, nearArm: { ik: [12, 46] }, farArm: { ik: [14, 44] }, prop: { angle: 180 } },
    active: {
      hip: [2, 27],
      lean: 10,
      face: 'shout',
      ...standLegs,
      nearArm: { a: [95, 90] },
      farArm: { a: [80, 110] },
      prop: { angle: 90, open: true },
    },
    recover: { hip: [1, 27], lean: 6, ...standLegs, nearArm: { a: [80, 70] }, farArm: { ik: [12, 42] } },
  },
})

const base = {
  outline: '#1a1020',
  eye: '#ffffff',
  belt: '#1a1020',
  tie: '#e8e0c8',
  tieShade: '#b8b098',
  propB: '#f4f4ee',
  propDark: '#3a0c14',
}

const palettes: Palette[] = [
  {
    ...base,
    id: 'hr-a',
    skin: '#f0c49a',
    skinShade: '#c68e62',
    hair: '#b8481e',
    hairShade: '#7a2a0e',
    top: '#f4f4ee',
    topShade: '#c4c4d4',
    jacket: '#3d4a6b',
    jacketShade: '#262f48',
    legs: '#d9a47e',
    legsShade: '#a8764f',
    shoe: '#c01830',
    shoeShine: '#ff5a6a',
    accent: '#c01830',
    prop: '#7a1c2c',
    propShade: '#52101c',
  },
  {
    ...base,
    id: 'hr-b',
    skin: '#a8704a',
    skinShade: '#7a4a2c',
    hair: '#1a1014',
    hairShade: '#000000',
    top: '#fff4e0',
    topShade: '#d4c4a8',
    jacket: '#6b2a4a',
    jacketShade: '#461830',
    legs: '#7a4a30',
    legsShade: '#58301c',
    shoe: '#1a1020',
    shoeShine: '#5a5070',
    accent: '#e0306a',
    prop: '#1f3b6b',
    propShade: '#12244a',
  },
]

export const hrLady: CharacterDef = {
  id: 'hr',
  name: 'HR LADY',
  title: 'Head of Human Resources',
  bio: 'Knows every policy by heart. Her folder has a file on you.',
  stats: { health: 95, power: 3, walkF: 1.6, walkB: 1.3, jumpV: 5.6, jumpVX: 1.9 },
  body: {
    thigh: 17,
    shin: 17,
    upperArm: 11,
    foreArm: 11,
    torso: 21,
    neck: 4,
    headR: 8.5,
    shoulderW: 19,
    hipW: 15,
    thighW: 7,
    shinW: 5.5,
    armW: 5,
    foreW: 4,
  },
  look: {
    hair: 'beehive',
    top: 'jacket',
    tie: false,
    skirt: true,
    belly: 0,
    shoes: 'heels',
    glasses: 'normal',
    beard: false,
    lipstick: true,
    grin: false,
    logo: false,
    prop: 'folder',
    propScale: 1.45,
    earrings: true,
  },
  // tall and upright, chin up, feet together, the folder clutched like a shield
  style: { lean: -5, head: -6, stance: 0.75, guard: [1, 3] },
  hurtHalfW: 11,
  palettes,
  poses: defaultPoses,
  moves: {
    ...baseMoves,
    standLK: folderSlap,
    standHK: tweak(baseMoves.standHK, { name: 'Stiletto Kick', damage: 14 }),
    crouchLK: tweak(baseMoves.crouchLK, { name: 'Heel Jab' }),
    crouchHK: tweak(baseMoves.crouchHK, { name: 'Dress Code Sweep' }),
    airLK: folderDrop,
  },
  special: {
    move: formalComplaint,
    seq: ['B', 'F'],
    button: 'lk',
    cooldown: 100,
    label: '← → X',
    description: 'Opens the folder: a formal complaint flies into the face.',
  },
}

