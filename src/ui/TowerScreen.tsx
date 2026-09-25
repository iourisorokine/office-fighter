import { useEffect, useMemo, useState } from 'react'
import { FLOORS, HOME_ROOM, TOP_FLOOR, type Progress } from '../game/campaign'
import { characterById } from '../game/characters'
import { portraitURL } from '../game/render/portraits'
import { stageById } from '../game/render/stages'
import { TOWER, towerBackdropURL } from '../game/render/tower'

const px = (n: number) => `calc(var(--px) * ${n})`

interface Cursor {
  level: number
  i: number
}

/** Where the cursor starts: the highest open floor, first opponent not beaten yet. */
function startCursor(p: Progress, last: string | null): Cursor {
  if (last) {
    const f = FLOORS.find((fl) => fl.opponents.includes(last))
    if (f && f.level <= p.unlocked) return { level: f.level, i: f.opponents.indexOf(last) }
  }
  const f = FLOORS[p.unlocked - 1]
  const i = f.opponents.findIndex((id) => !p.beaten.includes(id))
  return { level: f.level, i: Math.max(0, i) }
}

/**
 * The main menu: an office tower. Each floor is a level with its own
 * opponents; beat any one of them to open the next floor. The VC is on top.
 */
export function TowerScreen(props: {
  progress: Progress
  fighter: string | null
  last: string | null
  onPick: (opponentId: string) => void
  onChangeFighter: () => void
  onQuick: () => void
  onReset: () => void
  onBack: () => void
  onDenied: () => void
  onMove: () => void
}) {
  const { progress } = props
  const [cur, setCur] = useState<Cursor>(() => startCursor(progress, props.last))
  const [confirmReset, setConfirmReset] = useState(false)
  const floor = FLOORS[cur.level - 1]
  const oppId = floor.opponents[Math.min(cur.i, floor.opponents.length - 1)]
  const opp = characterById(oppId)
  const locked = cur.level > progress.unlocked
  const me = props.fighter ? characterById(props.fighter) : null

  const pick = (level = cur.level, i = cur.i) => {
    if (level > progress.unlocked) {
      props.onDenied()
      return
    }
    const f = FLOORS[level - 1]
    props.onPick(f.opponents[Math.min(i, f.opponents.length - 1)])
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const move = (level: number, i: number) => {
        const f = FLOORS[level - 1]
        const ni = Math.max(0, Math.min(f.opponents.length - 1, i))
        if (level !== cur.level || ni !== cur.i) props.onMove()
        setCur({ level, i: ni })
      }
      if (e.code === 'ArrowUp') move(Math.min(TOP_FLOOR, cur.level + 1), cur.i)
      else if (e.code === 'ArrowDown') move(Math.max(1, cur.level - 1), cur.i)
      else if (e.code === 'ArrowLeft') move(cur.level, cur.i - 1)
      else if (e.code === 'ArrowRight') move(cur.level, cur.i + 1)
      else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyX') pick()
      else if (e.code === 'KeyS') props.onChangeFighter()
      else if (e.code === 'KeyQ') props.onQuick()
      else if (e.code === 'Escape' || e.code === 'KeyC') props.onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const portraits = useMemo(() => {
    const m: Record<string, string> = {}
    for (const f of FLOORS) for (const id of f.opponents) m[id] = portraitURL(characterById(id))
    return m
  }, [])

  const status = locked
    ? `LOCKED · CLEAR FLOOR ${cur.level - 1} FIRST`
    : cur.level === TOP_FLOOR
      ? progress.ceo
        ? 'YOU ALREADY RUN THIS PLACE'
        : 'BEAT THE VC TO BECOME CEO'
      : cur.level < progress.unlocked
        ? 'FLOOR CLEARED · REMATCH ANYONE'
        : `BEAT ONE TO OPEN ${cur.level + 1 === TOP_FLOOR ? 'THE TOP FLOOR' : `FLOOR ${cur.level + 1}`}`

  return (
    <div className="overlay tower-overlay" style={{ backgroundImage: `url(${towerBackdropURL()})` }}>
      <h2 className="tower-title" style={{ left: px(6), top: px(6) }}>
        CLIMB THE TOWER
      </h2>
      <p className="tower-count" style={{ right: px(6), top: px(8) }}>
        {progress.ceo ? 'CEO' : `FLOOR ${progress.unlocked}/${TOP_FLOOR}`}
      </p>
      {progress.ceo && me && (
        <p className="tower-ceo" style={{ left: px(TOWER.x), width: px(TOWER.w), top: px(TOWER.roofY - 14) }}>
          CEO: {me.name}
        </p>
      )}

      {FLOORS.map((f) => {
        const band = TOWER.floors[f.level]
        const open = f.level <= progress.unlocked
        return (
          <div key={f.level} className="tower-floor">
            <span
              className={`tower-floor-label ${open ? '' : 'locked'} ${cur.level === f.level ? 'current' : ''}`}
              style={{ left: px(TOWER.x - 15), top: px(band.y + band.h / 2 - 3) }}
            >
              {f.label}
            </span>
            {f.opponents.map((id, i) => {
              const c = TOWER.cell(f.level, i, f.opponents.length)
              const beaten = progress.beaten.includes(id)
              const active = cur.level === f.level && cur.i === i
              return (
                <button
                  key={id}
                  className={`tower-cell ${open ? 'open' : 'locked'} ${active ? 'active' : ''} ${beaten ? 'beaten' : ''} ${id === 'vc' ? 'boss' : ''}`}
                  style={{ left: px(c.x), top: px(c.y), width: px(c.w), height: px(c.h) }}
                  onMouseEnter={() => setCur({ level: f.level, i })}
                  onFocus={() => setCur({ level: f.level, i })}
                  onClick={() => {
                    setCur({ level: f.level, i })
                    pick(f.level, i)
                  }}
                  aria-label={open ? `Fight ${characterById(id).name}` : 'Locked floor'}
                >
                  <img src={portraits[id]} alt="" />
                  {!open && <span className="cell-lock">?</span>}
                  {beaten && <span className="cell-stamp">BEATEN</span>}
                </button>
              )
            })}
          </div>
        )
      })}

      <div className="tower-panel left" style={{ left: px(6), top: px(36), width: px(96) }}>
        <p className="panel-floor">
          {floor.level === TOP_FLOOR ? 'TOP FLOOR' : `FLOOR ${floor.level}`}
          <br />
          <span>{floor.title}</span>
        </p>
        {locked ? (
          <p className="panel-name">???</p>
        ) : (
          <>
            <p className="panel-name">{opp.name}</p>
            <p className="panel-sub">{opp.title.toUpperCase()}</p>
            <p className="panel-room">ROOM: {stageById(HOME_ROOM[opp.id]).name}</p>
          </>
        )}
        <p className={`panel-status ${locked ? 'locked' : ''}`}>{status}</p>
        {!locked && <p className="panel-go blink">▶ FIGHT</p>}
      </div>

      <div className="tower-panel right" style={{ left: px(274), top: px(36), width: px(104) }}>
        <p className="panel-you">YOU</p>
        {me ? (
          <>
            <img className="panel-me" src={portraitURL(me)} alt="" />
            <p className="panel-name">{me.name}</p>
          </>
        ) : (
          <p className="panel-sub">PICK A FIGHTER ON YOUR FIRST FIGHT</p>
        )}
        <button className="tower-btn" onClick={props.onChangeFighter}>
          {me ? 'CHANGE FIGHTER' : 'PICK FIGHTER'} <kbd>S</kbd>
        </button>
        <button className="tower-btn" onClick={props.onQuick}>
          QUICK FIGHT <kbd>Q</kbd>
        </button>
        <button
          className={`tower-btn danger ${confirmReset ? 'confirm' : ''}`}
          onClick={() => {
            if (confirmReset) {
              props.onReset()
              setConfirmReset(false)
              setCur({ level: 1, i: 0 })
            } else setConfirmReset(true)
          }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? 'SURE? CLICK AGAIN' : 'RESET PROGRESS'}
        </button>
        <button className="tower-btn" onClick={props.onBack}>
          TITLE <kbd>ESC</kbd>
        </button>
      </div>
    </div>
  )
}
