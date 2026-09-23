import { useCallback, useEffect, useRef, useState } from 'react'
import type { Difficulty } from './game/ai/CpuController'
import { VIEW_H, VIEW_W } from './game/constants'
import { Game } from './game/Game'
import type { MatchResult } from './game/Match'
import { ControlsBar, PauseOverlay, ResultOverlay, TitleOverlay } from './ui/Overlays'
import { useScreenScale } from './ui/useScreenScale'
import './App.css'

type Screen = 'title' | 'fight' | 'paused' | 'over'

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [screen, setScreen] = useState<Screen>('title')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [result, setResult] = useState<MatchResult | null>(null)
  const scale = useScreenScale(VIEW_W, VIEW_H)

  useEffect(() => {
    const game = new Game(canvasRef.current!, {
      onPauseChange: (p) => setScreen(p ? 'paused' : 'fight'),
      onMatchEnd: (r) => {
        setResult(r)
        setScreen('over')
      },
    })
    gameRef.current = game
    game.startAttract()
    ;(window as unknown as { __game?: Game }).__game = game // handy for debugging in the console
    return () => game.destroy()
  }, [])

  const start = useCallback(() => {
    gameRef.current?.startMatch(difficulty)
    setScreen('fight')
  }, [difficulty])

  const toTitle = useCallback(() => {
    gameRef.current?.startAttract()
    setScreen('title')
  }, [])

  const cycleDifficulty = useCallback((dir: 1 | -1) => {
    setDifficulty((d) => DIFFICULTIES[(DIFFICULTIES.indexOf(d) + dir + DIFFICULTIES.length) % DIFFICULTIES.length])
  }, [])

  // menu keys (the fight itself reads the keyboard inside the game loop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (screen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') start()
        if (e.code === 'ArrowLeft') cycleDifficulty(-1)
        if (e.code === 'ArrowRight') cycleDifficulty(1)
      } else if (screen === 'paused') {
        if (e.code === 'Enter') gameRef.current?.setPaused(false)
        if (e.code === 'KeyQ') toTitle()
      } else if (screen === 'over') {
        if (e.code === 'Enter' || e.code === 'Space') start()
        if (e.code === 'Escape') toTitle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, start, toTitle, cycleDifficulty])

  return (
    <div className="app">
      <div
        className="cabinet"
        style={{ width: VIEW_W * scale, height: VIEW_H * scale, ['--s' as string]: String(scale) }}
      >
        <canvas ref={canvasRef} className="screen" width={VIEW_W} height={VIEW_H} />
        <div className="scanlines" />
        {screen === 'title' && (
          <TitleOverlay difficulty={difficulty} onCycle={cycleDifficulty} onStart={start} />
        )}
        {screen === 'paused' && (
          <PauseOverlay onResume={() => gameRef.current?.setPaused(false)} onQuit={toTitle} />
        )}
        {screen === 'over' && result && <ResultOverlay result={result} onRematch={start} onQuit={toTitle} />}
      </div>
      <ControlsBar />
    </div>
  )
}
