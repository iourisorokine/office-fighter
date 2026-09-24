import { useEffect, useState } from 'react'

/**
 * Touch screen without a mouse (phones, tablets). `?touch` in the URL forces
 * the touch controls on, `?keys` forces them off.
 */
export function useIsTouch() {
  const detect = () => {
    const q = new URLSearchParams(window.location.search)
    if (q.has('touch')) return true
    if (q.has('keys')) return false
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches
  }
  const [touch, setTouch] = useState(detect)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const onChange = () => setTouch(detect())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return touch
}

export function useIsPortrait() {
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth)
  useEffect(() => {
    const onResize = () => setPortrait(window.innerHeight > window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return portrait
}
