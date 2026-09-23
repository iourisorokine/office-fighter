import type { Difficulty } from './ai/CpuController'
import { intern } from './characters/intern'
import { FLOOR_Y, VIEW_H, VIEW_W } from './constants'
import type { Fighter } from './fighter/Fighter'
import { KeyboardInput } from './input'
import { FixedLoop } from './loop'
import { Match, type MatchResult } from './Match'
import { drawEffects, drawShadow } from './render/effects'
import { drawAnnouncer, drawHud } from './render/hud'
import { SPR_OX, SPR_OY, spriteFor } from './render/puppet'
import { createStage, drawLights } from './render/stage'

export interface GameCallbacks {
  onPauseChange?: (paused: boolean) => void
  onMatchEnd?: (result: MatchResult) => void
}

/**
 * The bridge between React and the canvas game. React only calls these few
 * methods; everything frame-by-frame happens in here, outside React.
 */
export class Game {
  private readonly ctx: CanvasRenderingContext2D
  private readonly keyboard = new KeyboardInput()
  private readonly loop: FixedLoop
  private readonly stage = createStage()
  private readonly cb: GameCallbacks
  private match: Match | null = null
  private paused = false
  private frame = 0
  /** set when a debug/test harness wants to see hit boxes */
  showBoxes = false

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks = {}) {
    canvas.width = VIEW_W
    canvas.height = VIEW_H
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.cb = cb
    window.addEventListener('keydown', this.onKey)
    this.loop = new FixedLoop(
      () => this.update(),
      () => this.render(),
    )
    this.loop.start()
  }

  /** CPU vs CPU demo running behind the title screen. */
  startAttract() {
    this.paused = false
    this.match = new Match({
      mode: 'attract',
      difficulty: 'hard',
      chars: [intern, intern],
      keyboard: this.keyboard,
      onEnd: () => this.startAttract(),
    })
  }

  startMatch(difficulty: Difficulty) {
    this.paused = false
    this.keyboard.clear()
    this.match = new Match({
      mode: 'cpu',
      difficulty,
      chars: [intern, intern],
      keyboard: this.keyboard,
      onEnd: (r) => this.cb.onMatchEnd?.(r),
    })
  }

  setPaused(p: boolean) {
    if (!this.match || this.match.mode !== 'cpu' || this.paused === p) return
    this.paused = p
    this.keyboard.clear()
    this.cb.onPauseChange?.(p)
  }

  get currentMatch() {
    return this.match
  }

  destroy() {
    this.loop.stop()
    this.keyboard.destroy()
    window.removeEventListener('keydown', this.onKey)
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'F2') {
      e.preventDefault()
      this.showBoxes = !this.showBoxes
    }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
      if (this.match?.mode === 'cpu' && this.match.phase !== 'matchOver') this.setPaused(!this.paused)
    }
  }

  private update() {
    this.frame++
    if (this.paused || !this.match) return
    this.match.update()
  }

  private render() {
    const ctx = this.ctx
    const m = this.match
    ctx.save()
    if (m && m.shake > 0) {
      const amp = m.shake > 8 ? 2 : 1
      ctx.translate(((this.frame % 2) * 2 - 1) * amp, ((this.frame >> 1) % 2) * amp)
    }
    ctx.drawImage(this.stage, 0, 0)
    drawLights(ctx, this.frame)
    if (m) {
      for (const f of m.fighters) drawShadow(ctx, f.x, f.y)
      // the attacker is drawn on top so the kick is always visible
      const [a, b] = m.fighters
      const order = b.state === 'attack' && a.state !== 'attack' ? [a, b] : [b, a]
      for (const f of order) this.drawFighter(f, m)
      drawEffects(ctx, m.effects)
      if (this.showBoxes) this.drawBoxes(m)
    }
    ctx.restore()
    if (m) {
      drawHud(ctx, m, this.frame)
      drawAnnouncer(ctx, m)
    }
  }

  private drawFighter(f: Fighter, m: Match) {
    const ctx = this.ctx
    const sprite = spriteFor(f.getPose(), f.char.body, f.palette, f.char.id)
    let sx = Math.round(f.x)
    if (m.hitstop > 0 && m.victim === f) sx += this.frame % 4 < 2 ? 1 : -1
    const sy = Math.round(FLOOR_Y - f.y) - SPR_OY
    if (f.facing === 1) ctx.drawImage(sprite, sx - SPR_OX, sy)
    else {
      ctx.save()
      ctx.translate(sx, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(sprite, -SPR_OX, sy)
      ctx.restore()
    }
  }

  private drawBoxes(m: Match) {
    const ctx = this.ctx
    for (const f of m.fighters) {
      ctx.strokeStyle = '#3cff5a'
      for (const r of f.hurtboxesWorld()) ctx.strokeRect(r.x0 + 0.5, FLOOR_Y - r.y1 + 0.5, r.x1 - r.x0, r.y1 - r.y0)
      const hb = f.hitboxWorld()
      if (hb) {
        ctx.strokeStyle = '#ff2a2a'
        ctx.strokeRect(hb.x0 + 0.5, FLOOR_Y - hb.y1 + 0.5, hb.x1 - hb.x0, hb.y1 - hb.y0)
      }
    }
  }
}
