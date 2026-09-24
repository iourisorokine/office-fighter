import { styled } from '../fighter/poses'
import type { CharacterDef } from '../types'
import { SPR_H, SPR_W, spriteFor } from './puppet'

const cache = new Map<string, string>()

/**
 * A cropped PNG of a character for the React screens (select, VS).
 * `pose` picks the idle stance or the victory pose.
 */
export function portraitURL(char: CharacterDef, pose: 'idle' | 'win' = 'idle', palette = 0): string {
  const key = `${char.id}|${pose}|${palette}`
  const hit = cache.get(key)
  if (hit) return hit
  const p = styled(pose === 'win' ? char.poses.win(0) : char.poses.idle(0), char.style, true)
  const sprite = spriteFor(p, char.body, char.look, char.palettes[palette % char.palettes.length], char.id)
  const data = sprite.getContext('2d')!.getImageData(0, 0, SPR_W, SPR_H).data
  let x0 = SPR_W
  let y0 = SPR_H
  let x1 = 0
  let y1 = 0
  for (let y = 0; y < SPR_H; y++) {
    for (let x = 0; x < SPR_W; x++) {
      if (data[(y * SPR_W + x) * 4 + 3] > 0) {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
        y0 = Math.min(y0, y)
        y1 = Math.max(y1, y)
      }
    }
  }
  // fixed-size frame so every portrait lines up: 64x100 around the feet
  const w = 64
  const h = 100
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const cx = Math.round((x0 + x1) / 2)
  out.getContext('2d')!.drawImage(sprite, cx - w / 2, y1 + 1 - h, w, h, 0, 0, w, h)
  const url = out.toDataURL()
  cache.set(key, url)
  return url
}
