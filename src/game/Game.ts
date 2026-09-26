import type { Difficulty } from './ai/CpuController'
import { audio } from './audio'
import { CHARACTER_SIZE_MULTIPLIER as SIZE, SPECIAL_FLASH_FRAMES } from './tuning'
import { drawText } from './render/font'
import { BOSS, ROSTER, characterById } from './characters'
import { FLOOR_Y, VIEW_H, VIEW_W } from './constants'
import type { Fighter } from './fighter/Fighter'
import { KeyboardInput } from './input'
import { FixedLoop } from './loop'
import { Match, type MatchResult } from './Match'
import { drawEffects, drawShadow } from './render/effects'
import { drawBossIntro } from './render/bossIntro'
import { drawAnnouncer, drawHud } from './render/hud'
import { SPR_OX, SPR_OY, spriteFor } from './render/puppet'
import { drawIncidentOverlay, drawProjectiles, drawSticker } from './render/specialsFx'
import { STAGES, stageById, stageCanvas } from './render/stages'

export interface MatchSetup {
  p1: string
  cpu: string
  stageId: string
  difficulty: Difficulty
  /** tower: one opponent in their home room; quick: new opponent and room every round, VC bonus */
  mode: 'tower' | 'quick'
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** colour of each character's special "aura" */
const AURA: Record<string, string> = {
  hr: '#ff5a6a',
  dev: '#5fe08a',
  pm: '#ffe135',
  architect: '#5fd8ff',
  sales: '#ffb02a',
  intern: '#e0b080',
  vc: '#7cf07c',
}

/** single-colour copies of sprites, for the glowing outline during a special */
const silhouettes = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>()
function silhouette(sprite: HTMLCanvasElement, color: string): HTMLCanvasElement {
  let byColor = silhouettes.get(sprite)
  if (!byColor) silhouettes.set(sprite, (byColor = new Map()))
  let c = byColor.get(color)
  if (!c) {
    c = document.createElement('canvas')
    c.width = sprite.width
    c.height = sprite.height
    const g = c.getContext('2d')!
    g.drawImage(sprite, 0, 0)
    g.globalCompositeOperation = 'source-in'
    g.fillStyle = color
    g.fillRect(0, 0, c.width, c.height)
    byColor.set(color, c)
  }
  return c
}

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

  /** CPU vs CPU demo running behind the title and select screens. */
  startAttract() {
    this.paused = false
    const everyone = [...ROSTER, BOSS]
    const a = pick(everyone)
    const b = pick(everyone.filter((c) => c !== a))
    this.match = new Match({
      mode: 'attract',
      difficulty: 'hard',
      chars: [a, b],
      rotatePool: ROSTER,
      stagePool: STAGES.map((st) => st.id),
      stageId: pick(STAGES).id,
      keyboard: this.keyboard,
      onEnd: () => this.startAttract(),
    })
  }

  startMatch(setup: MatchSetup) {
    this.paused = false
    this.keyboard.clear()
    const quick = setup.mode === 'quick'
    this.match = new Match({
      mode: 'cpu',
      difficulty: setup.difficulty,
      chars: [characterById(setup.p1), characterById(setup.cpu)],
      rotatePool: quick ? ROSTER : undefined,
      boss: quick ? { char: BOSS, stageId: 'boss' } : undefined,
      stagePool: quick ? STAGES.map((st) => st.id) : undefined,
      finalBoss: !quick && setup.cpu === BOSS.id,
      stageId: setup.stageId,
      keyboard: this.keyboard,
      onEnd: (r) => this.cb.onMatchEnd?.(r),
    })
  }

  setPaused(p: boolean) {
    if (!this.match || this.match.mode !== 'cpu' || this.paused === p) return
    this.paused = p
    this.keyboard.clear()
    audio.play('pause')
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
    const m = this.match
    if (m.sounds.length) {
      // the attract demo behind the menus stays silent
      if (m.mode === 'cpu') for (const s of new Set(m.sounds)) audio.play(s)
      m.sounds = []
    }
  }

  private render() {
    const ctx = this.ctx
    const m = this.match
    if (m && m.phase === 'bossIntro') {
      drawBossIntro(ctx, m.phaseT, m.fighters[1].char, this.frame, m.finalBoss ? 'FINAL BOSS' : 'BONUS ROUND')
      return
    }
    ctx.save()
    if (m && m.shake > 0) {
      const amp = m.shake > 8 ? 2 : 1
      ctx.translate(((this.frame % 2) * 2 - 1) * amp, ((this.frame >> 1) % 2) * amp)
    }
    const stageId = m?.stageId ?? STAGES[0].id
    ctx.drawImage(stageCanvas(stageId), 0, 0)
    stageById(stageId).ambient(ctx, this.frame)
    if (m) {
      if (m.flash) this.drawFlashBackdrop(m)
      for (const f of m.fighters) drawShadow(ctx, f.x, f.y)
      // the attacker is drawn on top so the kick is always visible
      const [a, b] = m.fighters
      const order = b.state === 'attack' && a.state !== 'attack' ? [a, b] : [b, a]
      for (const f of order) {
        const caster = m.flash && m.fighters[m.flash.owner] === f && m.flash.t < 26
        this.drawFighter(f, m, caster ? (AURA[f.char.id] ?? '#ffe135') : undefined)
        drawSticker(ctx, f)
      }
      drawProjectiles(ctx, m.projectiles)
      drawEffects(ctx, m.effects)
      if (m.incident) drawIncidentOverlay(ctx, m.incident)
      if (this.showBoxes) this.drawBoxes(m)
    }
    ctx.restore()
    if (m && m.whiteFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${m.whiteFlash > 2 ? 0.75 : 0.45})`
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    }
    if (m) {
      drawHud(ctx, m, this.frame)
      if (m.flash?.banner) this.drawFlashBanner(m)
      drawAnnouncer(ctx, m)
    }
  }

  /** special "super flash": the room dims and light rays burst from the caster */
  private drawFlashBackdrop(m: Match) {
    const ctx = this.ctx
    const fl = m.flash!
    const f = m.fighters[fl.owner]
    const t = fl.t
    const end = SPECIAL_FLASH_FRAMES
    const k = t < 4 ? t / 4 : t > end - 12 ? Math.max(0, (end - t) / 12) : 1
    ctx.fillStyle = `rgba(6, 6, 20, ${0.62 * k})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    const cx = f.x
    const cy = FLOOR_Y - f.y - 44 * SIZE
    const color = AURA[f.char.id] ?? '#ffe135'
    ctx.save()
    ctx.globalAlpha = 0.5 * k
    const spin = t * 0.025
    for (let i = 0; i < 14; i++) {
      const a0 = spin + (i / 14) * Math.PI * 2
      const a1 = a0 + 0.12
      ctx.fillStyle = i % 2 ? color : '#ffffff'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(a0) * 420, cy + Math.sin(a0) * 420)
      ctx.lineTo(cx + Math.cos(a1) * 420, cy + Math.sin(a1) * 420)
      ctx.closePath()
      ctx.fill()
    }
    // a bright core ring pulsing around the caster
    ctx.globalAlpha = 0.8 * k
    ctx.fillStyle = '#ffffff'
    const r = 10 + (t % 8) * 3
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 1.4), 2, 2)
    }
    ctx.restore()
  }

  /** the special's name on a band sweeping across the screen */
  private drawFlashBanner(m: Match) {
    const ctx = this.ctx
    const fl = m.flash!
    const t = fl.t
    const end = SPECIAL_FLASH_FRAMES
    const f = m.fighters[fl.owner]
    const color = AURA[f.char.id] ?? '#ffe135'
    const from = f.facing === 1 ? -1 : 1
    let off = 0
    if (t < 6) off = from * (1 - t / 6) * VIEW_W
    else if (t > end - 6) off = -from * ((t - (end - 6)) / 6) * VIEW_W
    const y = 60
    const h = 26
    ctx.save()
    ctx.translate(Math.round(off), 0)
    ctx.fillStyle = 'rgba(10, 10, 28, 0.85)'
    ctx.fillRect(0, y, VIEW_W, h)
    ctx.fillStyle = color
    ctx.fillRect(0, y, VIEW_W, 2)
    ctx.fillRect(0, y + h - 2, VIEW_W, 2)
    // speed streaks inside the band
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
    for (let i = 0; i < 6; i++) {
      const sx = (((i * 71 + t * 9 * -from) % (VIEW_W + 60)) + VIEW_W + 60) % (VIEW_W + 60) - 30
      ctx.fillRect(sx, y + 5 + ((i * 7) % 16), 24, 1)
    }
    drawText(ctx, fl.name + '!', VIEW_W / 2, y + 6, { scale: 2, color: '#ffffff', shadow: color, outline: '#10101c', align: 'center' })
    ctx.restore()
  }

  private drawFighter(f: Fighter, m: Match, aura?: string) {
    const ctx = this.ctx
    // rendered at CHARACTER_SIZE_MULTIPLIER with finer pixels (not stretched)
    const sprite = spriteFor(f.getPose(), f.char.body, f.char.look, f.palette, f.char.id, SIZE)
    const ox = Math.round(SPR_OX * SIZE)
    const oy = Math.round(SPR_OY * SIZE)
    let sx = Math.round(f.x)
    if (m.hitstop > 0 && m.victim === f) sx += this.frame % 4 < 2 ? 1 : -1
    const sy = Math.round(FLOOR_Y - f.y) - oy
    ctx.save()
    if (f.facing === 1) ctx.translate(sx - ox, sy)
    else {
      ctx.translate(sx + ox, sy)
      ctx.scale(-1, 1)
    }
    if (aura) {
      // a flickering outline of light around the fighter doing the special
      const glow = silhouette(sprite, this.frame % 4 < 2 ? aura : '#ffffff')
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.drawImage(glow, dx, dy)
    }
    ctx.drawImage(sprite, 0, 0)
    ctx.restore()
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
    ctx.strokeStyle = '#ffae1e'
    for (const p of m.projectiles) ctx.strokeRect(p.x - p.w / 2 + 0.5, FLOOR_Y - p.y - p.h / 2 + 0.5, p.w, p.h)
  }
}
