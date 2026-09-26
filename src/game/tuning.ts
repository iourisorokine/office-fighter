/**
 * ============================================================================
 *  OFFICE FIGHTER — GAMEPLAY TUNING
 * ============================================================================
 *
 * Every number that shapes how the game FEELS lives here, so you can tweak
 * and play-test without digging through the engine.
 *
 * How to test a change: save this file while `pnpm dev` is running and the
 * browser reloads by itself.
 *
 * Units:
 *  - Time is in FRAMES. The game runs at 60 frames per second:
 *      60 frames = 1 second, 30 = half a second, 6 = a tenth of a second.
 *  - Distances are in SCREEN PIXELS of the 384 x 216 game screen
 *    (the whole screen is 384 pixels wide, the floor is 198 pixels down).
 *  - Speeds are in pixels per frame (2 = 120 pixels per second).
 *  - "Multipliers": 1 = unchanged, 1.5 = 50% more, 0.5 = half.
 *
 * Per-character values (health, walk speed, jump strength, the frame data of
 * each kick and special) live in each character's own file, in
 * src/game/characters/<name>.ts under `stats` and `moves`. The multipliers
 * below apply on top of them, to everyone at once.
 */

// ---------------------------------------------------------------------------
//  SIZE
// ---------------------------------------------------------------------------

/**
 * How big the fighters are drawn. 1 = the original size, 1.2 = 20% bigger.
 * Everything that belongs to a fighter follows automatically: the sprite,
 * hit boxes, reach, body width, where projectiles come out, the shadow.
 * Characters are designed at size 1 and rendered at this scale with finer
 * pixels, so they get more detail rather than blurrier.
 */
export const CHARACTER_SIZE_MULTIPLIER = 1.2;

// ---------------------------------------------------------------------------
//  MOVEMENT & JUMPING
// ---------------------------------------------------------------------------

/**
 * Downward acceleration while in the air (pixels per frame, every frame).
 * Higher = heavier, snappier jumps that come down faster.
 * (Originally 0.3 at size 1; 0.36 keeps the same jump duration at size 1.2.)
 */
export const GRAVITY_PER_FRAME = 0.32;

/**
 * Multiplies every character's jump take-off speed (`jumpV` in their stats).
 * Jump height grows with the SQUARE of this: 1.1 = about 21% higher.
 */
export const JUMP_TAKEOFF_SPEED_MULTIPLIER = 1.3;

/** Multiplies every character's sideways speed during a jump (`jumpVX`): how far a jump travels. */
export const JUMP_FORWARD_SPEED_MULTIPLIER = 1.2;

/** Multiplies every character's walking speed (`walkF` forward, `walkB` backward). */
export const WALK_SPEED_MULTIPLIER = 1.2;

/** Frames spent crouching down before leaving the ground. Lower = jumps start sooner. */
export const FRAMES_BEFORE_JUMP_TAKEOFF = 4;

/** Frames stuck on landing after a jump before you can act again. */
export const FRAMES_OF_LANDING_RECOVERY = 4;

/**
 * How much of a slide (after being pushed by a hit) is kept each frame on
 * the ground. 0.75 = loses 25% of its speed per frame. Closer to 1 = slippery.
 */
export const GROUND_SLIDE_KEPT_PER_FRAME = 0.75;

// ---------------------------------------------------------------------------
//  REACTIVITY & CONTROLS
// ---------------------------------------------------------------------------

/**
 * An attack button pressed while your fighter is still busy is remembered
 * for this many frames and fires as soon as possible. Higher = more
 * forgiving/"mashy", lower = stricter timing.
 */
export const ATTACK_BUTTON_MEMORY_FRAMES = 5;

/** Longest time allowed to enter a whole special-move sequence (e.g. ↓ → X). */
export const SPECIAL_SEQUENCE_MAX_FRAMES = 36;

/** The last arrow of a special sequence must be at most this fresh when the button is pressed. */
export const SPECIAL_LAST_ARROW_MAX_AGE_FRAMES = 16;

/** The phone SP button keeps asking for the special for this many frames (so it works even mid-move). */
export const TOUCH_SPECIAL_BUTTON_MEMORY_FRAMES = 20;

/**
 * Holding "back" turns into a guard pose when the opponent is attacking
 * within this distance. (Blocking itself works at any distance.)
 */
export const AUTO_GUARD_POSE_DISTANCE = 110;

// ---------------------------------------------------------------------------
//  COMBAT
// ---------------------------------------------------------------------------

/** Multiplies the damage of every hit (kicks, specials, projectiles). */
export const DAMAGE_MULTIPLIER = 1;

/** Multiplies how far hits and blocks push fighters apart, and how far knockdowns fly. */
export const KNOCKBACK_MULTIPLIER = 1.2;

/** Multiplies every special's cooldown (the time before you can use it again). */
export const SPECIAL_COOLDOWN_MULTIPLIER = 1;

/** Multiplies the speed of every projectile (coffee, complaint, requirement, cash...). */
export const PROJECTILE_SPEED_MULTIPLIER = 1;

/** Freeze frames when an attack is blocked (the "clack" impact pause). */
export const BLOCK_FREEZE_FRAMES = 8;

/** Knockdown flight when a move doesn't define its own: [sideways speed, upward speed]. */
export const DEFAULT_KNOCKDOWN_LAUNCH: [number, number] = [1.6, 3.6];

/** The final blow always launches at least this much: [sideways speed, upward speed]. */
export const KO_MINIMUM_LAUNCH: [number, number] = [2.2, 5];

/** Frames lying on the floor after a knockdown before getting up. */
export const FRAMES_LYING_ON_FLOOR = 40;

/** Frames of the get-up animation (invulnerable). */
export const FRAMES_TO_GET_UP = 16;

/** Scope creep (the PM's special) slows the victim: walking speed multiplier... */
export const SCOPE_CREEP_WALK_SPEED = 0.5;
/** ...and jump distance multiplier. */
export const SCOPE_CREEP_JUMP_DISTANCE = 0.6;

// ---------------------------------------------------------------------------
//  VISUAL EFFECTS
// ---------------------------------------------------------------------------

/** Size of hit sparks, shock rings and block shields. 1 = small, 1.4 = punchy. */
export const HIT_EFFECT_SIZE_MULTIPLIER = 1.4;

/**
 * Size of projectiles (coffee, complaint, requirement, cash, the bullshit
 * cloud): both how big they are drawn and how big their hit box is.
 */
export const PROJECTILE_SIZE_MULTIPLIER = 1.5;

/**
 * When a special starts, the screen darkens, light rays burst from the
 * fighter and the special's name sweeps across the screen for this many frames.
 */
export const SPECIAL_FLASH_FRAMES = 40;

/** The whole game freezes this many frames at the start of a special (0 = no freeze). */
export const SPECIAL_FLASH_FREEZE_FRAMES = 12;

/** Heavy hits and knockouts flash the whole screen white for a couple of frames. */
export const SCREEN_FLASH_ON_BIG_HITS = true;

// ---------------------------------------------------------------------------
//  ROUNDS
// ---------------------------------------------------------------------------

/** Round timer, in seconds. */
export const ROUND_TIME_SECONDS = 99;

/** Rounds needed to win a match (2 = best of 3). */
export const ROUNDS_TO_WIN_MATCH = 2;

/** Freeze frames on the knockout blow. */
export const KO_FREEZE_FRAMES = 36;

/** Frames of slow motion after the knockout. */
export const KO_SLOW_MOTION_FRAMES = 70;

// ---------------------------------------------------------------------------
//  ARENA
// ---------------------------------------------------------------------------

/** How close to the screen edges a fighter's centre can go. */
export const STAGE_EDGE_MARGIN = 24;

/** At the start of a round each fighter stands this far from the centre. */
export const START_DISTANCE_FROM_CENTER = 72;

/**
 * Minimum half-width of a fighter's body for pushing (bodies can't overlap).
 * At size 1; grows with CHARACTER_SIZE_MULTIPLIER.
 */
export const BODY_PUSH_HALF_WIDTH = 11;

/**
 * A jumper this high above the other fighter (at size 1) passes over them
 * instead of pushing: lower = easier to jump over opponents.
 */
export const JUMP_OVER_HEIGHT = 40;

// ---------------------------------------------------------------------------
//  CPU OPPONENT
// ---------------------------------------------------------------------------

export interface CpuSkill {
  /** 0..1 chance to block an incoming attack */
  chanceToBlock: number;
  /** 0..1 chance to guess right whether to block high or low */
  chanceToReadHighLow: number;
  /** 0..1 how often it attacks when in range */
  aggressiveness: number;
  /** 0..1 chance to kick you out of the air when you jump in */
  chanceToAntiAir: number;
  /** frames between two decisions [min, max]: lower = quicker reactions */
  framesBetweenDecisions: [number, number];
}

/** One entry per difficulty on the title screen. */
export const CPU_SKILL: Record<"easy" | "normal" | "hard", CpuSkill> = {
  easy: {
    chanceToBlock: 0.2,
    chanceToReadHighLow: 0.3,
    aggressiveness: 0.35,
    chanceToAntiAir: 0.1,
    framesBetweenDecisions: [18, 34],
  },
  normal: {
    chanceToBlock: 0.5,
    chanceToReadHighLow: 0.55,
    aggressiveness: 0.55,
    chanceToAntiAir: 0.4,
    framesBetweenDecisions: [10, 22],
  },
  hard: {
    chanceToBlock: 0.82,
    chanceToReadHighLow: 0.85,
    aggressiveness: 0.72,
    chanceToAntiAir: 0.75,
    framesBetweenDecisions: [5, 12],
  },
};

// ---------------------------------------------------------------------------
//  SPECIAL MOVES THAT LIVE ON THEIR OWN
//  (projectile damage and speeds are in src/game/specials.ts, PROJECTILES)
// ---------------------------------------------------------------------------

/** Developer's SEV-1 incident: warning frames before it hits... */
export const INCIDENT_WARNING_FRAMES = 36;
/** ...and when the red screen ends. */
export const INCIDENT_TOTAL_FRAMES = 90;

/** Architect's Microservices: how many little service boxes fly out... */
export const MICROSERVICES_COUNT = 6;
/** ...frames between two of them leaving... */
export const MICROSERVICES_SPACING_FRAMES = 5;
/** ...and how high/low they weave while flying (pixels). */
export const MICROSERVICES_WAVE_HEIGHT = 12;

/** VC's raise: frames it keeps raining money. */
export const MONEY_RAIN_FRAMES = 120;
