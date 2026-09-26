import { useCallback, useEffect, useRef, useState } from 'react'
import type { Difficulty } from './game/ai/CpuController'
import { audio, type Tune } from './game/audio'
import { floorOf, HOME_ROOM, loadProgress, recordWin, saveProgress, TOP_FLOOR, type Progress } from './game/campaign'
import { characterById, ROSTER } from './game/characters'
import { VIEW_H, VIEW_W } from './game/constants'
import { Game, type MatchSetup } from './game/Game'
import type { MatchResult } from './game/Match'
import { STAGES, stageById } from './game/render/stages'
import { ControlsBar, PauseOverlay, ResultOverlay, TitleOverlay, type TowerOutcome } from './ui/Overlays'
import { SelectScreen, VersusScreen } from './ui/SelectScreen'
import { TouchControls } from './ui/TouchControls'
import { TowerScreen } from './ui/TowerScreen'
import { useIsTouch, useViewport } from './ui/useDevice'
import { screenScale } from './ui/screenScale'
import './App.css'

type Screen = 'title' | 'tower' | 'select' | 'vs' | 'fight' | 'paused' | 'over'
/** why the fighter select is open: before a tower fight, just to switch, or for a quick fight */
type SelectPurpose = 'fight' | 'change' | 'quick'
type Setup = Omit<MatchSetup, 'difficulty'>

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** background music for a fight: by floor, the VC gets the tense one */
function fightTune(s: Setup): Tune {
  if (s.cpu === 'vc') return 'boss'
  if (s.mode === 'quick') return 'floor2'
  return (floorOf(s.cpu)?.level ?? 1) >= 2 ? 'floor2' : 'floor1'
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [screen, setScreen] = useState<Screen>('title')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [purpose, setPurpose] = useState<SelectPurpose>('change')
  const [target, setTarget] = useState<string | null>(null)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [outcome, setOutcome] = useState<TowerOutcome | null>(null)
  const [muted, setMuted] = useState(audio.muted)
  const touch = useIsTouch()
  const view = useViewport()
  const portrait = view.h > view.w
  // phones: a flat key bar under the screen in portrait; in landscape the
  // screen takes the whole display and the keys float over its corners
  const padLayout = portrait ? 'below' : 'float'
  const scale = touch
    ? portrait
      ? screenScale(VIEW_W, VIEW_H, view.w, view.h, 330, 4)
      : screenScale(VIEW_W, VIEW_H, view.w, view.h, 0, 0)
    : screenScale(VIEW_W, VIEW_H, view.w, view.h)

  // the game's end-of-match callback is created once: give it the latest state
  const live = useRef({ setup, progress })
  useEffect(() => {
    live.current = { setup, progress }
  }, [setup, progress])

  const updateProgress = useCallback((p: Progress) => {
    setProgress(p)
    saveProgress(p)
  }, [])

  useEffect(() => {
    const game = new Game(canvasRef.current!, {
      onPauseChange: (p) => setScreen(p ? 'paused' : 'fight'),
      onMatchEnd: (r) => {
        const { setup: s, progress: p } = live.current
        if (s?.mode === 'tower') {
          if (r.winner === 0) {
            const out = recordWin(p, s.cpu)
            setProgress(out.progress)
            saveProgress(out.progress)
            setOutcome({
              won: true,
              opponent: s.cpu,
              unlockedFloor: out.unlockedFloor,
              becameCeo: out.becameCeo,
              newOpponent: out.newOpponent ? characterById(out.newOpponent).name : undefined,
            })
            if (out.unlockedFloor || out.becameCeo || out.newOpponent) window.setTimeout(() => audio.play('unlock'), 900)
          } else setOutcome({ won: false, opponent: s.cpu })
        } else setOutcome(null)
        setResult(r)
        setScreen('over')
      },
    })
    gameRef.current = game
    game.startAttract()
    ;(window as unknown as { __game?: Game }).__game = game // handy for debugging in the console
    // browsers only allow sound after the first tap / key press
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      game.destroy()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // music follows the screen
  useEffect(() => {
    if (screen === 'title' || screen === 'tower' || screen === 'select') audio.music('menu')
    else if ((screen === 'vs' || screen === 'fight') && setup) audio.music(fightTune(setup))
    else if (screen === 'over') audio.music(null)
    audio.duck(screen === 'paused')
  }, [screen, setup])

  const fight = useCallback(
    (s: Setup) => {
      gameRef.current?.startMatch({ ...s, difficulty })
      setOutcome(null)
      setScreen('fight')
    },
    [difficulty],
  )

  const toTitle = useCallback(() => {
    gameRef.current?.startAttract()
    setScreen('title')
  }, [])

  const toTower = useCallback(() => {
    gameRef.current?.startAttract()
    setScreen('tower')
  }, [])

  /** tower fight: the opponent's home room */
  const versus = useCallback((p1: string, cpu: string) => {
    setTarget(cpu)
    setSetup({ p1, cpu, stageId: HOME_ROOM[cpu] ?? STAGES[0].id, mode: 'tower' })
    setScreen('vs')
  }, [])

  const quick = useCallback((p1: string) => {
    setSetup({ p1, cpu: pick(ROSTER.filter((c) => c.id !== p1)).id, stageId: pick(STAGES).id, mode: 'quick' })
    setScreen('vs')
  }, [])

  const openSelect = useCallback((why: SelectPurpose) => {
    setPurpose(why)
    setScreen('select')
  }, [])

  const cycleDifficulty = useCallback((dir: 1 | -1) => {
    setDifficulty((d) => DIFFICULTIES[(DIFFICULTIES.indexOf(d) + dir + DIFFICULTIES.length) % DIFFICULTIES.length])
  }, [])

  const toggleMute = useCallback(() => setMuted(audio.toggleMute()), [])

  // menu keys for title / pause / result (tower and select screens handle their own)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyM') toggleMute()
      if (screen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          audio.play('confirm')
          setScreen('tower')
        }
        if (e.code === 'ArrowLeft') cycleDifficulty(-1)
        if (e.code === 'ArrowRight') cycleDifficulty(1)
      } else if (screen === 'paused') {
        if (e.code === 'Enter') gameRef.current?.setPaused(false)
        if (e.code === 'KeyQ') toTitle()
      } else if (screen === 'over' && setup) {
        const towerWin = setup.mode === 'tower' && outcome?.won
        if (e.code === 'Enter' || e.code === 'Space') {
          if (towerWin) toTower()
          else fight(setup)
        }
        if (e.code === 'KeyR') fight(setup)
        if (e.code === 'KeyT') toTower()
        if (e.code === 'KeyS') openSelect(setup.mode === 'quick' ? 'quick' : 'change')
        if (e.code === 'Escape') toTitle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, setup, outcome, fight, toTitle, toTower, openSelect, cycleDifficulty, toggleMute])

  const p1 = setup && (screen === 'fight' || screen === 'paused' || screen === 'over') ? characterById(setup.p1) : null
  const next = target ? characterById(target) : null
  const selectHint =
    purpose === 'fight' && next
      ? `← → CHOOSE · ENTER CONFIRM · NEXT: ${next.name} IN THE ${stageById(HOME_ROOM[next.id]).name}`
      : purpose === 'quick'
        ? '← → CHOOSE · ENTER FIGHT · ESC BACK · RANDOM ROOM, NEW OPPONENT EVERY ROUND'
        : '← → CHOOSE · ENTER CONFIRM · ESC BACK TO THE TOWER'

  return (
    <div className={`app ${touch ? `touch pad-${padLayout}` : ''}`}>
      <div
        className="cabinet"
        style={{ width: VIEW_W * scale, height: VIEW_H * scale, ['--s' as string]: String(scale) }}
      >
        <canvas ref={canvasRef} className="screen" width={VIEW_W} height={VIEW_H} />
        <div className="scanlines" />
        {screen === 'title' && (
          <TitleOverlay
            difficulty={difficulty}
            onCycle={cycleDifficulty}
            onStart={() => {
              audio.play('confirm')
              setScreen('tower')
            }}
            touch={touch}
            muted={muted}
            onMute={toggleMute}
          />
        )}
        {screen === 'tower' && (
          <TowerScreen
            progress={progress}
            fighter={progress.fighter}
            last={target}
            onPick={(id) => {
              audio.play('confirm')
              setTarget(id)
              if (progress.fighter) versus(progress.fighter, id)
              else openSelect('fight')
            }}
            onChangeFighter={() => openSelect('change')}
            onQuick={() => openSelect('quick')}
            onReset={() => {
              updateProgress({ ...progress, unlocked: 1, beaten: [], ceo: false })
              setTarget(null)
            }}
            onBack={toTitle}
            onDenied={() => audio.play('deny')}
            onMove={() => audio.play('select')}
          />
        )}
        {screen === 'select' && (
          <SelectScreen
            initial={progress.fighter}
            hint={selectHint}
            onBack={toTower}
            onMove={() => audio.play('select')}
            onDone={(id) => {
              audio.play('confirm')
              updateProgress({ ...progress, fighter: id })
              if (purpose === 'fight' && target) versus(id, target)
              else if (purpose === 'quick') quick(id)
              else setScreen('tower')
            }}
          />
        )}
        {screen === 'vs' && setup && <VersusScreen setup={setup} onDone={() => fight(setup)} />}
        {screen === 'paused' && (
          <PauseOverlay onResume={() => gameRef.current?.setPaused(false)} onQuit={toTitle} />
        )}
        {screen === 'over' && result && setup && (
          <ResultOverlay
            result={result}
            tower={outcome}
            topFloor={TOP_FLOOR}
            onRematch={() => fight(setup)}
            onTower={toTower}
            onChange={() => openSelect(setup.mode === 'quick' ? 'quick' : 'change')}
            onQuit={toTitle}
          />
        )}
      </div>
      {touch && portrait && <div className="rotate-hint">↻ TURN YOUR PHONE SIDEWAYS FOR A BIGGER SCREEN</div>}
      {touch ? (
        <TouchControls
          layout={padLayout}
          fighting={screen === 'fight'}
          special={p1 ? { name: p1.special.move.name, label: p1.special.label } : null}
          muted={muted}
          onMute={toggleMute}
        />
      ) : (
        <ControlsBar
          special={p1 ? { name: p1.special.move.name, label: p1.special.label } : null}
          muted={muted}
          onMute={toggleMute}
        />
      )}
    </div>
  )
}
