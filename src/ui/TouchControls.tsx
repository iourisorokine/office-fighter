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

/** 8-way pad: slide your thumb around, diagonals press two arrows at once. */
function DPad() {
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
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const dead = r.width * 0.12
    const next = new Set<Dir>()
    if (Math.hypot(dx, dy) > dead) {
      // a 45° cone around each axis, so diagonals register both arrows
      if (Math.abs(dx) > Math.abs(dy) * 0.42) next.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      if (Math.abs(dy) > Math.abs(dx) * 0.42) next.add(dy > 0 ? 'ArrowDown' : 'ArrowUp')
    }
    apply(next)
  }

  const release = () => apply(new Set())

  const arrow = (d: Dir, cls: string, glyph: string) => (
    <span className={`dpad-arrow ${cls} ${shown.has(d) ? 'on' : ''}`} aria-hidden="true">
      {glyph}
    </span>
  )

  return (
    <div
      ref={ref}
      className="dpad"
      role="group"
      aria-label="Direction pad"
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
      {arrow('ArrowUp', 'up', '▲')}
      {arrow('ArrowDown', 'down', '▼')}
      {arrow('ArrowLeft', 'left', '◀')}
      {arrow('ArrowRight', 'right', '▶')}
      <span className="dpad-hub" />
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
      className={`pad-btn ${props.className} ${on ? 'on' : ''}`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="pad-btn-label">{props.label}</span>
      <span className="pad-btn-sub">{props.sub}</span>
    </button>
  )
}

/** width (px) kept free on each side of the screen for the pads in landscape */
export const SIDE_PAD = 158

export function TouchControls(props: {
  layout: 'below' | 'side'
  fighting: boolean
  special: { name: string; label: string } | null
}) {
  return (
    <div className={`touch-controls pad-${props.layout}`}>
      <DPad />
      <div className="pad-middle">
        <button type="button" className="pad-small" onClick={() => tapKey('Enter')}>
          START
        </button>
        <button type="button" className="pad-small" onClick={() => tapKey('Escape')} disabled={!props.fighting}>
          PAUSE
        </button>
      </div>
      <div className="pad-buttons">
        {props.special && props.fighting && (
          <button
            type="button"
            className="pad-btn sp"
            onPointerDown={() => {
              vibrate()
              window.dispatchEvent(new Event(SPECIAL_EVENT))
            }}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={`Special move: ${props.special.name}`}
          >
            <span className="pad-btn-label">SP</span>
            <span className="pad-btn-sub">{props.special.name.toUpperCase()}</span>
          </button>
        )}
        <HoldButton code="KeyX" label="X" sub="LIGHT" className="light" />
        <HoldButton code="KeyC" label="C" sub="HEAVY" className="heavy" />
      </div>
    </div>
  )
}
