import type { CharacterDef } from '../types'
import { developer } from './developer'
import { hrLady } from './hrLady'
import { intern } from './intern'
import { salesRep } from './salesRep'

/** Everyone on the select screen, in display order. */
export const ROSTER: CharacterDef[] = [hrLady, developer, salesRep, intern]

export function characterById(id: string): CharacterDef {
  return ROSTER.find((c) => c.id === id) ?? intern
}
