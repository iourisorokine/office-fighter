import type { Difficulty } from '../game/ai/CpuController'
import type { MatchResult } from '../game/Match'

export function TitleOverlay(props: {
  difficulty: Difficulty
  onCycle: (dir: 1 | -1) => void
  onStart: () => void
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
        PRESS ENTER
      </button>
      <p className="build">6 EMPLOYEES · 5 ROOMS · 1 VC</p>
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

export function ResultOverlay(props: {
  result: MatchResult
  onRematch: () => void
  onChange: () => void
  onQuit: () => void
}) {
  const { winner, wins, bonus } = props.result
  const title =
    bonus === 'won'
      ? 'FUNDED! YOU ARE THE CEO'
      : winner === 0
        ? 'YOU GOT PROMOTED'
        : winner === 1
          ? 'YOU GOT LAID OFF'
          : 'NOBODY WINS'
  return (
    <div className="overlay dim">
      <div className="panel">
        <h2 className={winner === 0 ? 'win' : 'lose'}>{title}</h2>
        <p className="score">
          {wins[0]} - {wins[1]}
        </p>
        {bonus === 'won' && <p className="bonus-line">YOU BEAT THE VC. SERIES A CLOSED.</p>}
        {bonus === 'lost' && <p className="bonus-line">THE VC PASSED... BUT YOU'RE STILL PROMOTED.</p>}
        <button onClick={props.onRematch}>REMATCH · ENTER</button>
        <button onClick={props.onChange}>CHANGE FIGHTER · S</button>
        <button onClick={props.onQuit}>TITLE · ESC</button>
      </div>
    </div>
  )
}

export function ControlsBar(props: { special: { name: string; label: string } | null }) {
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
    </div>
  )
}
