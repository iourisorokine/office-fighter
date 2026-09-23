import { FPS } from './constants'

/**
 * Fixed-timestep loop: game logic always advances in exact 1/60 s steps
 * (fighting games count frames), rendering happens once per display refresh.
 */
export class FixedLoop {
  private raf = 0
  private last = 0
  private acc = 0
  private running = false
  private readonly step = 1000 / FPS
  private readonly update: () => void
  private readonly render: () => void

  constructor(update: () => void, render: () => void) {
    this.update = update
    this.render = render
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.acc = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private tick = (now: number) => {
    if (!this.running) return
    // clamp so a background tab doesn't fast-forward the fight
    this.acc += Math.min(now - this.last, 250)
    this.last = now
    let steps = 0
    while (this.acc >= this.step && steps < 5) {
      this.update()
      this.acc -= this.step
      steps++
    }
    if (steps === 5) this.acc = 0
    this.render()
    this.raf = requestAnimationFrame(this.tick)
  }
}
