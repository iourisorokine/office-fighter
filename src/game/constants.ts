import {
  ATTACK_BUTTON_MEMORY_FRAMES,
  BODY_PUSH_HALF_WIDTH,
  GRAVITY_PER_FRAME,
  ROUND_TIME_SECONDS,
  ROUNDS_TO_WIN_MATCH,
  STAGE_EDGE_MARGIN,
} from './tuning'

// Screen geometry lives here; everything about how the game FEELS is in tuning.ts.

// Internal resolution: everything is drawn at this size, then scaled up with crisp pixels.
export const VIEW_W = 384
export const VIEW_H = 216

/** Screen row where the fighters' feet touch the floor. */
export const FLOOR_Y = 198
/** Horizontal limits for a fighter's centre. */
export const STAGE_LEFT = STAGE_EDGE_MARGIN
export const STAGE_RIGHT = VIEW_W - STAGE_EDGE_MARGIN

export const FPS = 60
export const GRAVITY = GRAVITY_PER_FRAME

/** Frames an attack press is remembered while the fighter is busy. */
export const INPUT_BUFFER = ATTACK_BUTTON_MEMORY_FRAMES
/** Half the width of a fighter's push box (bodies can't overlap closer than 2x this). */
export const PUSH_HALF_W = BODY_PUSH_HALF_WIDTH

export const ROUND_TIME = ROUND_TIME_SECONDS
export const ROUNDS_TO_WIN = ROUNDS_TO_WIN_MATCH
