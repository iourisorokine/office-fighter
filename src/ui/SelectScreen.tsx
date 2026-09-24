import { useEffect, useMemo, useState } from 'react'
import { ROSTER, characterById } from '../game/characters'
import { portraitURL } from '../game/render/portraits'
import { STAGES } from '../game/render/stages'
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

/**
 * Pick your employee. The CPU gets a different one at random, and the room
 * is drawn at random too.
 */
export function SelectScreen(props: { initial?: SelectResult | null; onDone: (r: SelectResult) => void; onBack: () => void }) {
  const [cursor, setCursor] = useState(() => Math.max(0, ROSTER.findIndex((c) => c.id === props.initial?.p1)))
  const chosen = ROSTER[cursor]

  const confirm = (i = cursor) => {
    const me = ROSTER[i]
    const others = ROSTER.filter((c) => c !== me)
    props.onDone({
      p1: me.id,
      cpu: others[Math.floor(Math.random() * others.length)].id,
      stageId: STAGES[Math.floor(Math.random() * STAGES.length)].id,
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const n = ROSTER.length
      if (e.code === 'ArrowLeft') setCursor((c) => (c + n - 1) % n)
      else if (e.code === 'ArrowRight') setCursor((c) => (c + 1) % n)
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
      <p className="hint">← → CHOOSE · ENTER FIGHT · ESC BACK · RANDOM ROOM, NEW OPPONENT EVERY ROUND</p>
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
