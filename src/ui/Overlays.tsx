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
      <p className="build">PHASE 1 · THE INTERN VS THE TEMP</p>
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

export function ResultOverlay(props: { result: MatchResult; onRematch: () => void; onQuit: () => void }) {
  const { winner, wins } = props.result
  const title = winner === 0 ? 'YOU GOT PROMOTED' : winner === 1 ? 'YOU GOT LAID OFF' : 'NOBODY WINS'
  return (
    <div className="overlay dim">
      <div className="panel">
        <h2 className={winner === 0 ? 'win' : 'lose'}>{title}</h2>
        <p className="score">
          {wins[0]} - {wins[1]}
        </p>
        <button onClick={props.onRematch}>REMATCH · ENTER</button>
        <button onClick={props.onQuit}>TITLE · ESC</button>
      </div>
    </div>
  )
}

export function ControlsBar() {
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
        <kbd>X</kbd> LIGHT KICK
      </span>
      <span>
        <kbd>C</kbd> HEAVY KICK
      </span>
      <span>HOLD BACK = BLOCK</span>
      <span>
        <kbd>ESC</kbd> PAUSE
      </span>
    </div>
  )
}
