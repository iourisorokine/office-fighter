import type { CharacterDef } from '../types'
import { architect } from './architect'
import { developer } from './developer'
import { hrLady } from './hrLady'
import { intern } from './intern'
import { productManager } from './productManager'
import { salesRep } from './salesRep'
import { vc } from './vc'

/** Everyone on the select screen, in display order. */
export const ROSTER: CharacterDef[] = [hrLady, developer, productManager, architect, salesRep, intern]

/** The secret boss: bonus round after a flawless 2-0. */
export const BOSS: CharacterDef = vc

export function characterById(id: string): CharacterDef {
  return [...ROSTER, BOSS].find((c) => c.id === id) ?? intern
}
