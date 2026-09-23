import { noButtons, type Buttons, type InputSnapshot } from './types'

type ButtonName = keyof Buttons

/**
 * Physical key codes (KeyboardEvent.code), so the layout doesn't matter.
 * X and C sit at the same place on QWERTY, QWERTZ and AZERTY keyboards.
 */
export const P1_KEYS: Record<string, ButtonName> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  KeyX: 'lk',
  KeyC: 'hk',
}

const PREVENT_DEFAULT = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'])

export class KeyboardInput {
  private held: Buttons = noButtons()
  private pressed: Buttons = noButtons()
  private readonly bindings: Record<string, ButtonName>
  private readonly onDown = (e: KeyboardEvent) => this.handle(e, true)
  private readonly onUp = (e: KeyboardEvent) => this.handle(e, false)
  private readonly onBlur = () => this.clear()

  constructor(bindings: Record<string, ButtonName> = P1_KEYS) {
    this.bindings = bindings
    window.addEventListener('keydown', this.onDown)
    window.addEventListener('keyup', this.onUp)
    window.addEventListener('blur', this.onBlur)
  }

  private handle(e: KeyboardEvent, down: boolean) {
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault()
    const button = this.bindings[e.code]
    if (!button) return
    if (down && !this.held[button] && !e.repeat) this.pressed[button] = true
    this.held[button] = down
  }

  /** Read the current state; "pressed" edges are consumed by this call. */
  poll(): InputSnapshot {
    const snap = { held: { ...this.held }, pressed: { ...this.pressed } }
    this.pressed = noButtons()
    return snap
  }

  clear() {
    this.held = noButtons()
    this.pressed = noButtons()
  }

  destroy() {
    window.removeEventListener('keydown', this.onDown)
    window.removeEventListener('keyup', this.onUp)
    window.removeEventListener('blur', this.onBlur)
  }
}
