/** A tiny 5x7 bitmap font so all in-game text is real pixels. */

const GLYPHS: Record<string, string> = {
  A: '.###. #...# #...# ##### #...# #...# #...#',
  B: '####. #...# #...# ####. #...# #...# ####.',
  C: '.###. #...# #.... #.... #.... #...# .###.',
  D: '####. #...# #...# #...# #...# #...# ####.',
  E: '##### #.... #.... ####. #.... #.... #####',
  F: '##### #.... #.... ####. #.... #.... #....',
  G: '.###. #...# #.... #.### #...# #...# .####',
  H: '#...# #...# #...# ##### #...# #...# #...#',
  I: '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.',
  J: '..### ...#. ...#. ...#. ...#. #..#. .##..',
  K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#',
  L: '#.... #.... #.... #.... #.... #.... #####',
  M: '#...# ##.## #.#.# #.#.# #...# #...# #...#',
  N: '#...# #...# ##..# #.#.# #..## #...# #...#',
  O: '.###. #...# #...# #...# #...# #...# .###.',
  P: '####. #...# #...# ####. #.... #.... #....',
  Q: '.###. #...# #...# #...# #.#.# #..#. .##.#',
  R: '####. #...# #...# ####. #.#.. #..#. #...#',
  S: '.#### #.... #.... .###. ....# ....# ####.',
  T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..',
  U: '#...# #...# #...# #...# #...# #...# .###.',
  V: '#...# #...# #...# #...# #...# .#.#. ..#..',
  W: '#...# #...# #...# #.#.# #.#.# #.#.# .#.#.',
  X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
  Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..',
  Z: '##### ....# ...#. ..#.. .#... #.... #####',
  '0': '.###. #...# #..## #.#.# ##..# #...# .###.',
  '1': '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
  '2': '.###. #...# ....# ...#. ..#.. .#... #####',
  '3': '####. ....# ....# .###. ....# ....# ####.',
  '4': '...#. ..##. .#.#. #..#. ##### ...#. ...#.',
  '5': '##### #.... ####. ....# ....# #...# .###.',
  '6': '..##. .#... #.... ####. #...# #...# .###.',
  '7': '##### ....# ...#. ..#.. .#... .#... .#...',
  '8': '.###. #...# #...# .###. #...# #...# .###.',
  '9': '.###. #...# #...# .#### ....# ...#. .##..',
  '!': '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..',
  '.': '..... ..... ..... ..... ..... ..... ..#..',
  ',': '..... ..... ..... ..... ..... ..#.. .#...',
  "'": '..#.. ..#.. .#... ..... ..... ..... .....',
  '-': '..... ..... ..... ##### ..... ..... .....',
  ':': '..... ..#.. ..... ..... ..... ..#.. .....',
  '?': '.###. #...# ....# ...#. ..#.. ..... ..#..',
  '/': '....# ...#. ...#. ..#.. .#... .#... #....',
  '$': '..#.. .#### #.#.. .###. ..#.# ####. ..#..',
  '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....',
  ' ': '..... ..... ..... ..... ..... ..... .....',
}

const PARSED: Record<string, [number, number][]> = {}
for (const [ch, rows] of Object.entries(GLYPHS)) {
  const pts: [number, number][] = []
  rows.split(' ').forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') pts.push([x, y])
  })
  PARSED[ch] = pts
}

export const GLYPH_W = 6
export const GLYPH_H = 7

export function textWidth(text: string, scale = 1) {
  return (text.length * GLYPH_W - 1) * scale
}

function drawRaw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, scale: number) {
  let cx = x
  for (const ch of text.toUpperCase()) {
    const pts = PARSED[ch] ?? PARSED['?']
    for (const [px, py] of pts) ctx.fillRect(cx + px * scale, y + py * scale, scale, scale)
    cx += GLYPH_W * scale
  }
}

export interface TextOpts {
  scale?: number
  color?: string
  outline?: string | null
  shadow?: string | null
  align?: 'left' | 'center' | 'right'
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: TextOpts = {}) {
  const scale = opts.scale ?? 1
  const w = textWidth(text, scale)
  let left = x
  if (opts.align === 'center') left = Math.round(x - w / 2)
  else if (opts.align === 'right') left = x - w
  if (opts.shadow) {
    ctx.fillStyle = opts.shadow
    drawRaw(ctx, text, left + scale, y + scale, scale)
    if (scale > 1) drawRaw(ctx, text, left + scale * 2, y + scale * 2, scale)
  }
  if (opts.outline) {
    ctx.fillStyle = opts.outline
    const o = Math.max(1, Math.floor(scale / 2))
    for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]]) {
      drawRaw(ctx, text, left + dx, y + dy, scale)
    }
  }
  ctx.fillStyle = opts.color ?? '#ffffff'
  drawRaw(ctx, text, left, y, scale)
}
