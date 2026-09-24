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

/**
 * Current window size. Phones report the new size late after a rotation
 * (and the browser bars slide in and out), so we listen to every relevant
 * event and re-read the size a moment later as well.
 */
export function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const timers: number[] = []
    const update = () => {
      setSize((prev) => {
        const next = read()
        return next.w === prev.w && next.h === prev.h ? prev : next
      })
    }
    const onChange = () => {
      update()
      timers.push(window.setTimeout(update, 150), window.setTimeout(update, 500))
    }
    window.addEventListener('resize', onChange)
    window.addEventListener('orientationchange', onChange)
    window.visualViewport?.addEventListener('resize', onChange)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('orientationchange', onChange)
      window.visualViewport?.removeEventListener('resize', onChange)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])
  return size
}
