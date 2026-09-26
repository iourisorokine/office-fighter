import type { Difficulty } from '../game/ai/CpuController'
import type { MatchResult } from '../game/Match'

export function TitleOverlay(props: {
  difficulty: Difficulty
  onCycle: (dir: 1 | -1) => void
  onStart: () => void
  touch?: boolean
  muted: boolean
  onMute: () => void
}) {
  return (
    <div className="overlay title-overlay">
      <div className="logo">
        <span className="logo-top">OFFICE</span>
        <span className="logo-bottom">FIGHTER</span>
      </div>
      <p className="tagline">SETTLE IT BEFORE THE 5PM MEETING</p>
      <div className="difficulty">
        <button className="arrow" onClick={() => props.onCycle(-1)} aria-label="Easier">
          ◀
        </button>
        <span className={`diff diff-${props.difficulty}`}>{props.difficulty.toUpperCase()}</span>
        <button className="arrow" onClick={() => props.onCycle(1)} aria-label="Harder">
          ▶
        </button>
      </div>
      <button className="start blink" onClick={props.onStart}>
        {props.touch ? 'TAP TO START' : 'PRESS ENTER'}
      </button>
      <p className="build">3 FLOORS · 6 EMPLOYEES · 7 ROOMS · 1 VC</p>
      <button className="sound-toggle" onClick={props.onMute}>
        {props.muted ? 'SOUND OFF' : 'SOUND ON'}
        {!props.touch && ' · M'}
      </button>
    </div>
  )
}

export function PauseOverlay(props: { onResume: () => void; onQuit: () => void }) {
  return (
    <div className="overlay dim">
      <div className="panel">
        <h2>COFFEE BREAK</h2>
        <button onClick={props.onResume}>RESUME · ENTER</button>
        <button onClick={props.onQuit}>QUIT · Q</button>
      </div>
    </div>
  )
}

/** What a tower fight meant for your climb (null in quick fights). */
export interface TowerOutcome {
  won: boolean
  opponent: string
  unlockedFloor?: number
  becameCeo?: boolean
  /** name of the opponent this win made available on the same floor */
  newOpponent?: string
}

export function ResultOverlay(props: {
  result: MatchResult
  tower: TowerOutcome | null
  topFloor: number
  onRematch: () => void
  onTower: () => void
  onChange: () => void
  onQuit: () => void
}) {
  const { winner, wins, bonus } = props.result
  const t = props.tower
  const funded = bonus === 'won' || (t?.won && t.opponent === 'vc')
  const title = funded
    ? 'FUNDED! YOU ARE THE CEO'
    : winner === 0
      ? 'YOU GOT PROMOTED'
      : winner === 1
        ? 'YOU GOT LAID OFF'
        : 'NOBODY WINS'
  let line: string | null = null
  if (bonus === 'won') line = 'YOU BEAT THE VC. SERIES A CLOSED.'
  else if (bonus === 'lost') line = "THE VC PASSED... BUT YOU'RE STILL PROMOTED."
  else if (t?.becameCeo) line = 'THE WHOLE TOWER IS YOURS NOW.'
  else if (t?.unlockedFloor || t?.newOpponent) {
    const parts: string[] = []
    if (t.newOpponent) parts.push(`NEW CHALLENGER: ${t.newOpponent}`)
    if (t.unlockedFloor)
      parts.push(t.unlockedFloor === props.topFloor ? 'TOP FLOOR UNLOCKED! THE VC IS WAITING.' : `FLOOR ${t.unlockedFloor} UNLOCKED!`)
    line = parts.join(' · ')
  }
  else if (t && !t.won) line = 'RETRY, OR PICK SOMEONE ELSE ON THIS FLOOR.'
  return (
    <div className="overlay dim">
      <div className="panel">
        <h2 className={winner === 0 ? 'win' : 'lose'}>{title}</h2>
        <p className="score">
          {wins[0]} - {wins[1]}
        </p>
        {line && <p className={`bonus-line ${t?.unlockedFloor || t?.newOpponent || funded ? 'unlock' : ''}`}>{line}</p>}
        {t ? (
          t.won ? (
            <>
              <button onClick={props.onTower}>TO THE TOWER · ENTER</button>
              <button onClick={props.onRematch}>REMATCH · R</button>
            </>
          ) : (
            <>
              <button onClick={props.onRematch}>RETRY · ENTER</button>
              <button onClick={props.onTower}>BACK TO THE TOWER · T</button>
            </>
          )
        ) : (
          <>
            <button onClick={props.onRematch}>REMATCH · ENTER</button>
            <button onClick={props.onTower}>THE TOWER · T</button>
          </>
        )}
        <button onClick={props.onChange}>CHANGE FIGHTER · S</button>
        <button onClick={props.onQuit}>TITLE · ESC</button>
      </div>
    </div>
  )
}

export function ControlsBar(props: { special: { name: string; label: string } | null; muted: boolean; onMute: () => void }) {
  return (
    <div className="controls">
      <span>
        <kbd>←</kbd>
        <kbd>→</kbd> MOVE
      </span>
      <span>
        <kbd>↑</kbd> JUMP
      </span>
      <span>
        <kbd>↓</kbd> CROUCH
      </span>
      <span>
        <kbd>X</kbd> LIGHT
      </span>
      <span>
        <kbd>C</kbd> HEAVY
      </span>
      {props.special && (
        <span className="special-hint">
          <kbd>{props.special.label}</kbd> {props.special.name.toUpperCase()}
        </span>
      )}
      <span>HOLD BACK = BLOCK</span>
      <span>
        <kbd>ESC</kbd> PAUSE
      </span>
      <button className="sound-btn" onClick={props.onMute}>
        <kbd>M</kbd> {props.muted ? 'SOUND OFF' : 'SOUND ON'}
      </button>
    </div>
  )
}
