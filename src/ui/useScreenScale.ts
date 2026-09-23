import { useEffect, useState } from 'react'

/**
 * Biggest scale that fits the window. Whole-number scales keep every game
 * pixel perfectly square; on small screens we fall back to a fractional scale.
 */
export function useScreenScale(w: number, h: number, reserveY = 90) {
  const compute = () => {
    const availW = window.innerWidth - 24
    const availH = window.innerHeight - reserveY
    const fit = Math.min(availW / w, availH / h)
    return fit >= 2 ? Math.floor(fit) : Math.max(0.5, fit)
  }
  const [scale, setScale] = useState(compute)
  useEffect(() => {
    const onResize = () => setScale(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [w, h, reserveY])
  return scale
}
