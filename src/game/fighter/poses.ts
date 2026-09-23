import type { Pose, PoseSet } from '../types'

/**
 * Key poses for a generic, average-sized office worker.
 * Coordinates: sprite space, origin between the feet, x forward, y up.
 * Ankle IK targets sit at y=2 so the shoe soles touch the floor.
 */

const guardArms = (dy = 0) => ({
  nearArm: { ik: [9, 47 + dy] as [number, number] },
  farArm: { ik: [15, 43 + dy] as [number, number] },
})

export const stance = (bob = 0): Pose => ({
  hip: [0, 27 - bob],
  lean: 6,
  nearLeg: { ik: [-8, 2] },
  farLeg: { ik: [9, 2] },
  ...guardArms(-bob),
})

export const crouchPose = (): Pose => ({
  hip: [0, 15],
  lean: 22,
  nearLeg: { ik: [-6, 2] },
  farLeg: { ik: [11, 2] },
  nearArm: { ik: [15, 33] },
  farArm: { ik: [20, 30] },
})

export const defaultPoses: PoseSet = {
  idle: (frame) => stance(frame % 2),

  walk: (frame) => {
    const ph = (frame / 6) * Math.PI * 2
    const s = Math.sin(ph)
    const c = Math.cos(ph)
    return {
      hip: [0, 27 - (frame % 3 === 1 ? 1 : 0)],
      lean: 8,
      farLeg: { ik: [Math.round(9 + 6 * s), 2 + Math.max(0, Math.round(3 * c))] },
      nearLeg: { ik: [Math.round(-8 - 6 * s), 2 + Math.max(0, Math.round(-3 * c))] },
      ...guardArms(frame % 3 === 1 ? -1 : 0),
    }
  },

  crouch: crouchPose,

  guard: () => ({
    hip: [-2, 27],
    lean: -2,
    nearLeg: { ik: [-10, 2] },
    farLeg: { ik: [7, 2] },
    nearArm: { ik: [9, 55] },
    farArm: { ik: [11, 48] },
  }),

  crouchGuard: () => ({
    hip: [-2, 15],
    lean: 12,
    nearLeg: { ik: [-8, 2] },
    farLeg: { ik: [9, 2] },
    nearArm: { ik: [10, 39] },
    farArm: { ik: [12, 33] },
  }),

  prejump: () => ({
    hip: [0, 21],
    lean: 14,
    nearLeg: { ik: [-8, 2] },
    farLeg: { ik: [9, 2] },
    nearArm: { ik: [11, 38] },
    farArm: { ik: [16, 35] },
  }),

  jump: (vy) => {
    const arms = { nearArm: { a: [60, 150] as [number, number] }, farArm: { a: [85, 125] as [number, number] } }
    if (vy > 1.5)
      return { hip: [0, 30], lean: 4, nearLeg: { a: [25, -5] }, farLeg: { a: [60, -15] }, ...arms }
    if (vy > -1.5)
      return { hip: [0, 32], lean: 10, nearLeg: { a: [75, -10] }, farLeg: { a: [88, -25] }, ...arms }
    return { hip: [0, 30], lean: 2, nearLeg: { a: [15, 5] }, farLeg: { a: [40, -10] }, ...arms }
  },

  hit: (frame) =>
    frame === 0
      ? {
          hip: [-4, 26],
          lean: -22,
          head: -10,
          face: 'hurt',
          nearLeg: { ik: [-10, 2] },
          farLeg: { ik: [6, 2] },
          nearArm: { a: [-35, -10] },
          farArm: { a: [30, 70] },
        }
      : {
          hip: [-2, 26],
          lean: -10,
          face: 'hurt',
          nearLeg: { ik: [-9, 2] },
          farLeg: { ik: [7, 2] },
          nearArm: { a: [-15, 20] },
          farArm: { a: [30, 90] },
        },

  crouchHit: (frame) => ({
    hip: [-3, 14],
    lean: frame === 0 ? -5 : 5,
    head: -8,
    face: 'hurt',
    nearLeg: { ik: [-7, 2] },
    farLeg: { ik: [9, 2] },
    nearArm: { a: [-30, 0] },
    farArm: { a: [40, 80] },
  }),

  knockdown: () => ({
    hip: [0, 22],
    lean: -55,
    head: -10,
    face: 'hurt',
    nearLeg: { a: [60, 40] },
    farLeg: { a: [85, 65] },
    nearArm: { a: [-120, -140] },
    farArm: { a: [-95, -125] },
  }),

  lying: () => ({
    hip: [10, 8],
    lean: -90,
    face: 'ko',
    nearLeg: { a: [88, 95] },
    farLeg: { a: [82, 100] },
    nearArm: { a: [-100, -95] },
    farArm: { a: [-80, -100] },
  }),

  win: (frame) => ({
    hip: [0, 28],
    lean: 0,
    head: 6,
    face: 'shout',
    nearLeg: { ik: [-6, 2] },
    farLeg: { ik: [7, 2] },
    nearArm: frame % 2 === 0 ? { a: [165, 178] } : { a: [150, 175] },
    farArm: { ik: [6, 33] },
  }),

  lose: () => ({
    hip: [-2, 25],
    lean: 28,
    head: 15,
    face: 'hurt',
    nearLeg: { ik: [-7, 2] },
    farLeg: { ik: [8, 2] },
    nearArm: { a: [15, 5] },
    farArm: { a: [25, 10] },
  }),
}
