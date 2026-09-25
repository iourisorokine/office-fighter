import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { SPECIAL_EVENT } from '../game/input'

/**
 * On-screen controls for phones and tablets. They don't talk to the game
 * directly: they fire the same keyboard events a real keyboard would, so the
 * fight, the menus and pause all work unchanged.
 */

function sendKey(code: string, down: boolean) {
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true }))
}

function tapKey(code: string) {
  sendKey(code, true)
  window.setTimeout(() => sendKey(code, false), 60)
}

function capture(e: ReactPointerEvent) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    // synthetic or already-released pointer: tracking still works without capture
  }
}

function vibrate() {
  try {
    navigator.vibrate?.(8)
  } catch {
    // not supported: fine
  }
}

type Dir = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

/**
 * Four arrow keys laid out like a laptop's (▲ over ◀ ▼ ▶). It is one touch
 * surface: slide your thumb across it and the pressed keys follow. The empty
 * spots beside ▲ jump diagonally (↖ ↗), and the seams between ◀ ▼ ▶ press
 * both neighbours, so ↙ (crouch block) works too.
 */
function ArrowKeys() {
  const ref = useRef<HTMLDivElement>(null)
  const active = useRef(new Set<Dir>())
  const [shown, setShown] = useState<Set<Dir>>(new Set())

  const apply = (next: Set<Dir>) => {
    for (const d of active.current) if (!next.has(d)) sendKey(d, false)
    for (const d of next) if (!active.current.has(d)) sendKey(d, true)
    if (next.size && [...next].some((d) => !active.current.has(d))) vibrate()
    active.current = next
    setShown(new Set(next))
  }

  const track = (e: ReactPointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const rx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const ry = (e.clientY - r.top) / r.height
    const next = new Set<Dir>()
    if (ry < 0.5) {
      next.add('ArrowUp')
      if (rx < 1 / 3) next.add('ArrowLeft')
      else if (rx > 2 / 3) next.add('ArrowRight')
    } else {
      const seam = 0.06
      if (rx < 1 / 3 + seam) next.add('ArrowLeft')
      if (rx > 1 / 3 - seam && rx < 2 / 3 + seam) next.add('ArrowDown')
      if (rx > 2 / 3 - seam) next.add('ArrowRight')
    }
    apply(next)
  }

  const release = () => apply(new Set())

  const lit = (d: Dir) => (shown.has(d) ? 'on' : '')

  return (
    <div
      ref={ref}
      className="arrow-keys"
      role="group"
      aria-label="Arrow keys"
      onPointerDown={(e) => {
        capture(e)
        track(e)
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) track(e)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span className="key-gap" />
      <span className={`key ${lit('ArrowUp')}`}>▲</span>
      <span className="key-gap" />
      <span className={`key ${lit('ArrowLeft')}`}>◀</span>
      <span className={`key ${lit('ArrowDown')}`}>▼</span>
      <span className={`key ${lit('ArrowRight')}`}>▶</span>
    </div>
  )
}

/** A button held down as long as the finger stays on it. */
function HoldButton(props: { code: string; label: string; sub: string; className: string }) {
  const [on, setOn] = useState(false)
  const down = (e: ReactPointerEvent) => {
    capture(e)
    if (on) return
    setOn(true)
    vibrate()
    sendKey(props.code, true)
  }
  const up = () => {
    if (!on) return
    setOn(false)
    sendKey(props.code, false)
  }
  return (
    <button
      type="button"
      className={`key action ${props.className} ${on ? 'on' : ''}`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="key-label">{props.label}</span>
      <span className="key-sub">{props.sub}</span>
    </button>
  )
}

export function TouchControls(props: {
  layout: 'below' | 'float'
  fighting: boolean
  special: { name: string; label: string } | null
  muted: boolean
  onMute: () => void
}) {
  const sp = props.fighting ? props.special : null
  return (
    <div className={`touch-controls pad-${props.layout}`}>
      <div className="action-keys">
        <button
          type="button"
          className="key action sp"
          disabled={!sp}
          onPointerDown={() => {
            if (!sp) return
            vibrate()
            window.dispatchEvent(new Event(SPECIAL_EVENT))
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={sp ? `Special move: ${sp.name}` : 'Special move'}
        >
          <span className="key-label">SP</span>
          <span className="key-sub">{sp ? sp.name.toUpperCase() : 'SPECIAL'}</span>
        </button>
        <HoldButton code="KeyX" label="X" sub="LIGHT" className="light" />
        <HoldButton code="KeyC" label="C" sub="HEAVY" className="heavy" />
      </div>
      <div className="system-keys">
        <button type="button" className="key small" onClick={() => tapKey('Enter')}>
          START
        </button>
        <button type="button" className="key small" onClick={() => tapKey('Escape')} disabled={!props.fighting}>
          PAUSE
        </button>
        <button type="button" className="key small" onClick={props.onMute} aria-label={props.muted ? 'Sound off' : 'Sound on'}>
          {props.muted ? 'SOUND OFF' : 'SOUND ON'}
        </button>
      </div>
      <ArrowKeys />
    </div>
  )
}
