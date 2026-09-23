import { useEffect, useMemo, useState } from 'react'
import { ROSTER, characterById } from '../game/characters'
import { portraitURL } from '../game/render/portraits'
import { STAGES, stageCanvas } from '../game/render/stages'
import type { CharacterDef } from '../game/types'

const thumbCache = new Map<string, string>()
function stageThumb(id: string) {
  let url = thumbCache.get(id)
  if (!url) {
    url = stageCanvas(id).toDataURL()
    thumbCache.set(id, url)
  }
  return url
}

function Stat(props: { label: string; value: number }) {
  return (
    <div className="stat">
      <span>{props.label}</span>
      <span className="pips" aria-label={`${props.value} of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= props.value ? 'on' : ''} />
        ))}
      </span>
    </div>
  )
}

const speedOf = (c: CharacterDef) => Math.max(1, Math.min(5, Math.round((c.stats.walkF - 1) * 5)))
const healthOf = (c: CharacterDef) => Math.max(1, Math.min(5, Math.round((c.stats.health - 80) / 8)))

export interface SelectResult {
  p1: string
  cpu: string
  stageId: string
}

/**
 * Two steps: pick your employee (the CPU gets a different one at random),
 * then pick the office room to fight in.
 */
export function SelectScreen(props: { initial?: SelectResult | null; onDone: (r: SelectResult) => void; onBack: () => void }) {
  const [step, setStep] = useState<'fighter' | 'stage'>('fighter')
  const [cursor, setCursor] = useState(() => Math.max(0, ROSTER.findIndex((c) => c.id === props.initial?.p1)))
  const [stageIdx, setStageIdx] = useState(() => Math.max(0, STAGES.findIndex((s) => s.id === props.initial?.stageId)))
  const [cpu, setCpu] = useState<string>('')

  const chosen = ROSTER[cursor]
  const stage = STAGES[stageIdx]

  const confirmFighter = (i = cursor) => {
    setCursor(i)
    const others = ROSTER.filter((c) => c !== ROSTER[i])
    setCpu(others[Math.floor(Math.random() * others.length)].id)
    setStep('stage')
  }
  const confirmStage = () => props.onDone({ p1: chosen.id, cpu, stageId: stage.id })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const n = step === 'fighter' ? ROSTER.length : STAGES.length
      const move = (d: number) =>
        step === 'fighter' ? setCursor((c) => (c + d + n) % n) : setStageIdx((s) => (s + d + n) % n)
      if (e.code === 'ArrowLeft') move(-1)
      else if (e.code === 'ArrowRight') move(1)
      else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyX') {
        if (step === 'fighter') confirmFighter()
        else confirmStage()
      } else if (e.code === 'Escape' || e.code === 'KeyC') {
        if (step === 'stage') setStep('fighter')
        else props.onBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const portraits = useMemo(() => ROSTER.map((c) => portraitURL(c)), [])

  if (step === 'fighter') {
    return (
      <div className="overlay select-overlay">
        <h2 className="select-title">CHOOSE YOUR EMPLOYEE</h2>
        <div className="cards" role="listbox" aria-label="Fighters">
          {ROSTER.map((c, i) => (
            <button
              key={c.id}
              role="option"
              aria-selected={i === cursor}
              className={`card ${i === cursor ? 'active' : ''}`}
              onMouseEnter={() => setCursor(i)}
              onFocus={() => setCursor(i)}
              onClick={() => confirmFighter(i)}
            >
              {i === cursor && <span className="p1-tag">1P</span>}
              <img src={portraits[i]} alt="" />
              <span className="card-name">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="info">
          <div className="info-main">
            <p className="info-title">{chosen.title.toUpperCase()}</p>
            <p className="bio">{chosen.bio}</p>
            <p className="special">
              <span className="special-name">{chosen.special.move.name.toUpperCase()}</span>
              <kbd>{chosen.special.label}</kbd>
            </p>
            <p className="bio">{chosen.special.description}</p>
          </div>
          <div className="stats">
            <Stat label="HEALTH" value={healthOf(chosen)} />
            <Stat label="POWER" value={chosen.stats.power} />
            <Stat label="SPEED" value={speedOf(chosen)} />
          </div>
        </div>
        <p className="hint">← → CHOOSE · ENTER CONFIRM · ESC BACK</p>
      </div>
    )
  }

  const cpuChar = characterById(cpu)
  return (
    <div className="overlay select-overlay">
      <h2 className="select-title">WHERE DOES IT GO DOWN?</h2>
      <div className="stage-pick">
        <img className="mini" src={portraitURL(chosen)} alt={chosen.name} />
        <div className="stage-center">
          <div className="stage-row">
            <button className="arrow" aria-label="Previous room" onClick={() => setStageIdx((s) => (s + STAGES.length - 1) % STAGES.length)}>
              ◀
            </button>
            <button className="thumb" onClick={confirmStage} aria-label={`Fight in ${stage.name}`}>
              <img src={stageThumb(stage.id)} alt="" />
            </button>
            <button className="arrow" aria-label="Next room" onClick={() => setStageIdx((s) => (s + 1) % STAGES.length)}>
              ▶
            </button>
          </div>
          <p className="stage-name">{stage.name}</p>
          <p className="bio">ON THE WALL: {stage.slogans.map((s) => `"${s}"`).join(' · ')}</p>
        </div>
        <img className="mini flip" src={portraitURL(cpuChar)} alt={cpuChar.name} />
      </div>
      <p className="vs-line">
        {chosen.name} <span>VS</span> {cpuChar.name} (CPU)
      </p>
      <p className="hint">← → ROOM · ENTER FIGHT · ESC BACK</p>
    </div>
  )
}

/** The classic "VS" splash before the fight. */
export function VersusScreen(props: { setup: SelectResult; onDone: () => void }) {
  const a = characterById(props.setup.p1)
  const b = characterById(props.setup.cpu)
  const stage = STAGES.find((s) => s.id === props.setup.stageId) ?? STAGES[0]
  useEffect(() => {
    const t = window.setTimeout(props.onDone, 2200)
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') props.onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  })
  return (
    <div className="overlay vs-overlay">
      <div className="vs-side left">
        <img src={portraitURL(a, 'win')} alt="" />
        <p>{a.name}</p>
        <p className="vs-title">{a.title.toUpperCase()}</p>
      </div>
      <div className="vs-mid">
        <span className="vs-big">VS</span>
        <span className="vs-stage">{stage.name}</span>
      </div>
      <div className="vs-side right">
        <img className="flip" src={portraitURL(b, 'win')} alt="" />
        <p>{b.name}</p>
        <p className="vs-title">{b.title.toUpperCase()}</p>
      </div>
    </div>
  )
}
