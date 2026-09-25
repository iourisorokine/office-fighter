/**
 * The tower: three floors, each with its own opponents. Beat any one
 * opponent on your highest floor to unlock the next; the VC waits on top.
 * Progress is kept in this browser (localStorage) — nothing leaves the device.
 */

export interface Floor {
  level: number
  label: string
  title: string
  opponents: string[]
}

export const FLOORS: Floor[] = [
  { level: 1, label: '1F', title: 'THE TRENCHES', opponents: ['intern', 'pm', 'dev'] },
  { level: 2, label: '2F', title: 'MIDDLE MANAGEMENT', opponents: ['sales', 'architect', 'hr'] },
  { level: 3, label: '3F', title: 'THE CORNER OFFICE', opponents: ['vc'] },
]

export const TOP_FLOOR = FLOORS.length

/** Everyone fights on their home turf. */
export const HOME_ROOM: Record<string, string> = {
  intern: 'cubicles',
  pm: 'cowork',
  dev: 'servers',
  sales: 'meeting',
  architect: 'studio',
  hr: 'cafeteria',
  vc: 'boss',
}

export function floorOf(opponentId: string): Floor | undefined {
  return FLOORS.find((f) => f.opponents.includes(opponentId))
}

export interface Progress {
  /** highest floor you can enter (1..3) */
  unlocked: number
  /** opponents you have beaten at least once */
  beaten: string[]
  /** beat the VC */
  ceo: boolean
  /** your last fighter, so you don't have to pick again every climb */
  fighter: string | null
}

const KEY = 'office-fighter:progress:v1'

export const freshProgress = (): Progress => ({ unlocked: 1, beaten: [], ceo: false, fighter: null })

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return freshProgress()
    const p = JSON.parse(raw) as Partial<Progress>
    return {
      unlocked: Math.max(1, Math.min(TOP_FLOOR, Number(p.unlocked) || 1)),
      beaten: Array.isArray(p.beaten) ? p.beaten.filter((x) => typeof x === 'string') : [],
      ceo: p.ceo === true,
      fighter: typeof p.fighter === 'string' ? p.fighter : null,
    }
  } catch {
    return freshProgress()
  }
}

export function saveProgress(p: Progress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // private mode / storage blocked: progress just lasts for this visit
  }
}

export interface WinOutcome {
  progress: Progress
  /** the floor this win just opened, if any */
  unlockedFloor?: number
  /** first time beating the VC */
  becameCeo?: boolean
}

export function recordWin(p: Progress, opponentId: string): WinOutcome {
  const floor = floorOf(opponentId)
  const next: Progress = {
    ...p,
    beaten: p.beaten.includes(opponentId) ? p.beaten : [...p.beaten, opponentId],
  }
  const out: WinOutcome = { progress: next }
  if (floor && floor.level === p.unlocked && floor.level < TOP_FLOOR) {
    next.unlocked = floor.level + 1
    out.unlockedFloor = next.unlocked
  }
  if (opponentId === 'vc' && !p.ceo) {
    next.ceo = true
    out.becameCeo = true
  }
  return out
}
