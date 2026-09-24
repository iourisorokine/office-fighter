/**
 * Biggest scale at which a w x h screen fits in the given window, keeping
 * `reserveX` / `reserveY` pixels free. Whole-number scales keep every game
 * pixel perfectly square; on small screens we fall back to a fractional scale.
 * It is a plain function of the current size so it can never go stale (a
 * rotated phone gets the landscape scale on the very same render).
 */
export function screenScale(w: number, h: number, winW: number, winH: number, reserveY = 90, reserveX = 24) {
  const fit = Math.min((winW - reserveX) / w, (winH - reserveY) / h)
  return fit >= 2 ? Math.floor(fit) : Math.max(0.5, fit)
}
