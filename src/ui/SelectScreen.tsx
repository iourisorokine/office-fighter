import { useEffect, useMemo, useState } from 'react'
import { ROSTER, characterById } from '../game/characters'
import { portraitURL } from '../game/render/portraits'
import { stageById } from '../game/render/stages'
import type { CharacterDef } from '../game/types'

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

/** Pick your employee. What happens next (opponent, room) is up to the caller. */
export function SelectScreen(props: { initial?: string | null; hint: string; onDone: (p1: string) => void; onBack: () => void; onMove?: () => void }) {
  const [cursor, setCursor] = useState(() => Math.max(0, ROSTER.findIndex((c) => c.id === props.initial)))
  const chosen = ROSTER[cursor]

  const confirm = (i = cursor) => props.onDone(ROSTER[i].id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const n = ROSTER.length
      if (e.code === 'ArrowLeft') {
        props.onMove?.()
        setCursor((c) => (c + n - 1) % n)
      } else if (e.code === 'ArrowRight') {
        props.onMove?.()
        setCursor((c) => (c + 1) % n)
      }
      else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyX') confirm()
      else if (e.code === 'Escape' || e.code === 'KeyC') props.onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const portraits = useMemo(() => ROSTER.map((c) => portraitURL(c)), [])

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
            onClick={() => confirm(i)}
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
      <p className="hint">{props.hint}</p>
    </div>
  )
}

/** The classic "VS" splash before the fight. */
export function VersusScreen(props: { setup: SelectResult; onDone: () => void }) {
  const a = characterById(props.setup.p1)
  const b = characterById(props.setup.cpu)
  const stage = stageById(props.setup.stageId)
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
