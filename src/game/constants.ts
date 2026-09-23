// Internal resolution: everything is drawn at this size, then scaled up with crisp pixels.
export const VIEW_W = 384
export const VIEW_H = 216

/** Screen row where the fighters' feet touch the floor. */
export const FLOOR_Y = 198
/** Horizontal limits for a fighter's centre. */
export const STAGE_LEFT = 20
export const STAGE_RIGHT = VIEW_W - 20

export const FPS = 60
export const GRAVITY = 0.3

/** Frames an attack press is remembered while the fighter is busy. */
export const INPUT_BUFFER = 5
/** Half the width of a fighter's push box (bodies can't overlap closer than 2x this). */
export const PUSH_HALF_W = 11

export const ROUND_TIME = 99
export const ROUNDS_TO_WIN = 2
