import { BOSS, ROSTER } from '../game/characters'
import { SPR_H, SPR_OX, SPR_OY, SPR_W, spriteFor } from '../game/render/puppet'
import type { CharacterDef, Pose } from '../game/types'

/** Renders every pose of a character in a grid — handy when tuning poses. */
function posesOf(c: CharacterDef): [string, Pose][] {
  const p = c.poses
  const list: [string, Pose][] = [
    ['idle0', p.idle(0)], ['idle1', p.idle(1)],
    ...[0, 1, 2, 3, 4, 5].map((i) => [`walk${i}`, p.walk(i)] as [string, Pose]),
    ['crouch', p.crouch()], ['guard', p.guard()], ['crouchGuard', p.crouchGuard()], ['prejump', p.prejump()],
    ['jumpUp', p.jump(3)], ['jumpTop', p.jump(0)], ['jumpDown', p.jump(-3)],
    ['hit0', p.hit(0)], ['hit1', p.hit(1)], ['crouchHit', p.crouchHit(0)],
    ['knockdown', p.knockdown()], ['lying', p.lying()], ['win0', p.win(0)], ['win1', p.win(1)], ['lose', p.lose()],
  ]
  for (const m of [...Object.values(c.moves), c.special.move]) {
    list.push([`${m.id} start`, m.poses.startup], [`${m.id} ACTIVE`, m.poses.active])
  }
  return list
}

const SCALE = 3
const COLS = 12
const canvas = document.getElementById('sheet') as HTMLCanvasElement
const chars = [...ROSTER, BOSS]
const rows: { c: CharacterDef; pal: number; poses: [string, Pose][] }[] = []
for (const c of chars) for (let pal = 0; pal < 1; pal++) rows.push({ c, pal, poses: posesOf(c) })
const cellW = SPR_W
const cellH = SPR_H + 12
const totalRows = rows.reduce((n, r) => n + Math.ceil(r.poses.length / COLS), 0)
canvas.width = COLS * cellW * SCALE
canvas.height = totalRows * cellH * SCALE
const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false
ctx.scale(SCALE, SCALE)
let row = 0
for (const r of rows) {
  r.poses.forEach(([name, pose], i) => {
    const x = (i % COLS) * cellW
    const y = (row + Math.floor(i / COLS)) * cellH
    ctx.fillStyle = (i + Math.floor(i / COLS)) % 2 ? '#3a4050' : '#343948'
    ctx.fillRect(x, y, cellW, cellH)
    ctx.fillStyle = '#556'
    ctx.fillRect(x, y + SPR_OY, cellW, 1)
    ctx.fillRect(x + SPR_OX, y, 1, SPR_H)
    ctx.drawImage(spriteFor(pose, r.c.body, r.c.look, r.c.palettes[r.pal], r.c.id), x, y)
    ctx.fillStyle = '#fff'
    ctx.font = '8px monospace'
    ctx.fillText(name, x + 3, y + SPR_H + 9)
  })
  row += Math.ceil(r.poses.length / COLS)
}
