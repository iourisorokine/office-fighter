import { bossLights, createBossOffice } from './bossOffice'
import { createCafeteria } from './cafeteria'
import { createCubicles } from './cubicles'
import { fluorescent, type Ctx } from './kit'
import { createMeetingRoom } from './meeting'

export interface StageDef {
  id: string
  name: string
  /** the wall slogans, for the select screen */
  slogans: string[]
  create: () => HTMLCanvasElement
  /** drawn every frame over the backdrop (flickering lights...) */
  ambient: (ctx: Ctx, frame: number) => void
}

export const STAGES: StageDef[] = [
  { id: 'cubicles', name: 'OPEN SPACE', slogans: ['MOONSHOT'], create: createCubicles, ambient: (c, f) => fluorescent(c, f) },
  {
    id: 'cafeteria',
    name: 'CAFETERIA',
    slogans: ['WORK HARD, PLAY HARDER'],
    create: createCafeteria,
    ambient: (c, f) => fluorescent(c, f, [40, 296]),
  },
  {
    id: 'meeting',
    name: 'MEETING ROOM',
    slogans: ['DREAM BIG', 'FULL SPEED NO BRAKES'],
    create: createMeetingRoom,
    ambient: (c, f) => fluorescent(c, f, [36, 312]),
  },
  { id: 'boss', name: "BOSS'S OFFICE", slogans: ['WIN OR DIE'], create: createBossOffice, ambient: bossLights },
]

const cache = new Map<string, HTMLCanvasElement>()

export function stageById(id: string): StageDef {
  return STAGES.find((s) => s.id === id) ?? STAGES[0]
}

export function stageCanvas(id: string): HTMLCanvasElement {
  let c = cache.get(id)
  if (!c) {
    c = stageById(id).create()
    cache.set(id, c)
  }
  return c
}
