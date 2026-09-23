import { useCallback, useEffect, useRef, useState } from 'react'
import type { Difficulty } from './game/ai/CpuController'
import { characterById } from './game/characters'
import { VIEW_H, VIEW_W } from './game/constants'
import { Game } from './game/Game'
import type { MatchResult } from './game/Match'
import { ControlsBar, PauseOverlay, ResultOverlay, TitleOverlay } from './ui/Overlays'
import { SelectScreen, VersusScreen, type SelectResult } from './ui/SelectScreen'
import { useScreenScale } from './ui/useScreenScale'
import './App.css'

type Screen = 'title' | 'select' | 'vs' | 'fight' | 'paused' | 'over'

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [screen, setScreen] = useState<Screen>('title')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [setup, setSetup] = useState<SelectResult | null>(null)
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

  const fight = useCallback(
    (s: SelectResult) => {
      gameRef.current?.startMatch({ ...s, difficulty })
      setScreen('fight')
    },
    [difficulty],
  )

  const toTitle = useCallback(() => {
    gameRef.current?.startAttract()
    setScreen('title')
  }, [])

  const cycleDifficulty = useCallback((dir: 1 | -1) => {
    setDifficulty((d) => DIFFICULTIES[(DIFFICULTIES.indexOf(d) + dir + DIFFICULTIES.length) % DIFFICULTIES.length])
  }, [])

  // menu keys for title / pause / result (select screens handle their own)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (screen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') setScreen('select')
        if (e.code === 'ArrowLeft') cycleDifficulty(-1)
        if (e.code === 'ArrowRight') cycleDifficulty(1)
      } else if (screen === 'paused') {
        if (e.code === 'Enter') gameRef.current?.setPaused(false)
        if (e.code === 'KeyQ') toTitle()
      } else if (screen === 'over') {
        if ((e.code === 'Enter' || e.code === 'Space') && setup) fight(setup)
        if (e.code === 'KeyS') setScreen('select')
        if (e.code === 'Escape') toTitle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, setup, fight, toTitle, cycleDifficulty])

  const p1 = setup && (screen === 'fight' || screen === 'paused' || screen === 'over') ? characterById(setup.p1) : null

  return (
    <div className="app">
      <div
        className="cabinet"
        style={{ width: VIEW_W * scale, height: VIEW_H * scale, ['--s' as string]: String(scale) }}
      >
        <canvas ref={canvasRef} className="screen" width={VIEW_W} height={VIEW_H} />
        <div className="scanlines" />
        {screen === 'title' && (
          <TitleOverlay difficulty={difficulty} onCycle={cycleDifficulty} onStart={() => setScreen('select')} />
        )}
        {screen === 'select' && (
          <SelectScreen
            initial={setup}
            onBack={toTitle}
            onDone={(s) => {
              setSetup(s)
              setScreen('vs')
            }}
          />
        )}
        {screen === 'vs' && setup && <VersusScreen setup={setup} onDone={() => fight(setup)} />}
        {screen === 'paused' && (
          <PauseOverlay onResume={() => gameRef.current?.setPaused(false)} onQuit={toTitle} />
        )}
        {screen === 'over' && result && (
          <ResultOverlay
            result={result}
            onRematch={() => setup && fight(setup)}
            onChange={() => setScreen('select')}
            onQuit={toTitle}
          />
        )}
      </div>
      <ControlsBar special={p1 ? { name: p1.special.move.name, label: p1.special.label } : null} />
    </div>
  )
}
