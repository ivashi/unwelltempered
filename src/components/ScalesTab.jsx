import { useState, useRef, useEffect } from 'react'
import Keyboard from './Keyboard'
import './ScalesTab.css'

const SCALES = [
  { id: 'major',         name: 'Major',           intervals: [0,2,4,5,7,9,11],  formula: 'W·W·H·W·W·W·H',  category: 'Diatonic',   desc: 'Foundation of Western harmony. Bright, stable, and uplifting.' },
  { id: 'naturalMinor',  name: 'Natural Minor',    intervals: [0,2,3,5,7,8,10],  formula: 'W·H·W·W·H·W·W',  category: 'Diatonic',   desc: 'Relative minor of the major scale. Dark, expressive, and universally resonant.' },
  { id: 'harmonicMinor', name: 'Harmonic Minor',   intervals: [0,2,3,5,7,8,11],  formula: 'W·H·W·W·H·A·H',  category: 'Diatonic',   desc: 'Raised 7th creates an exotic, tension-rich leading tone. Common in classical and flamenco.' },
  { id: 'melodicMinor',  name: 'Melodic Minor',    intervals: [0,2,3,5,7,9,11],  formula: 'W·H·W·W·W·W·H',  category: 'Diatonic',   desc: 'Raised 6th and 7th for a smooth ascending line. A jazz musician\'s everyday scale.' },
  { id: 'pentatonicMaj', name: 'Major Pentatonic', intervals: [0,2,4,7,9],       formula: 'W·W·WH·W·WH',    category: 'Pentatonic', desc: 'Major without the 4th and 7th. No clashing half steps — bright and universally accessible.' },
  { id: 'pentatonicMin', name: 'Minor Pentatonic', intervals: [0,3,5,7,10],      formula: 'WH·W·W·WH·W',    category: 'Pentatonic', desc: 'The soul of blues and rock. Five notes, infinite expression.' },
  { id: 'blues',         name: 'Blues',            intervals: [0,3,5,6,7,10],    formula: 'WH·W·H·H·WH·W',  category: 'Pentatonic', desc: 'Minor pentatonic plus the flat 5 "blue note". That bent, yearning sound.' },
  { id: 'dorian',        name: 'Dorian',           intervals: [0,2,3,5,7,9,10],  formula: 'W·H·W·W·W·H·W',  category: 'Modal',      desc: 'Minor with a raised 6th — brighter and more sophisticated. Santana, Miles Davis.' },
  { id: 'phrygian',      name: 'Phrygian',         intervals: [0,1,3,5,7,8,10],  formula: 'H·W·W·W·H·W·W',  category: 'Modal',      desc: 'Flat 2nd gives a dark Spanish intensity. Beloved in metal and flamenco.' },
  { id: 'lydian',        name: 'Lydian',           intervals: [0,2,4,6,7,9,11],  formula: 'W·W·W·H·W·W·H',  category: 'Modal',      desc: 'Raised 4th floats above the major scale. Dreamy, cinematic, otherworldly.' },
  { id: 'mixolydian',    name: 'Mixolydian',       intervals: [0,2,4,5,7,9,10],  formula: 'W·W·H·W·W·H·W',  category: 'Modal',      desc: 'Major with a flat 7th. Rock, funk, and Celtic music live here.' },
  { id: 'wholeTone',     name: 'Whole Tone',       intervals: [0,2,4,6,8,10],    formula: 'W·W·W·W·W·W',    category: 'Exotic',     desc: 'All whole steps — perfectly symmetrical. Ambiguous and weightless à la Debussy.' },
]

const ROOT_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_STEP_MS = 550

function getBaseMidi(rootSemi, baseOctave) {
  return (baseOctave + 1) * 12 + rootSemi
}

export default function ScalesTab({ baseOctave, activeNotes, onNoteOn, onNoteOff }) {
  const [rootSemi, setRootSemi] = useState(0)
  const [scaleId,  setScaleId]  = useState('major')
  const [playing,  setPlaying]  = useState(false)
  const timeoutsRef = useRef([])

  const scale = SCALES.find(s => s.id === scaleId)

  const scaleNotes = new Set(scale.intervals.map(i => (rootSemi + i) % 12))

  function getPlayMidis() {
    const base = getBaseMidi(rootSemi, baseOctave)
    const notes = scale.intervals.map(i => base + i)
    notes.push(base + 12)
    return notes
  }

  function stopPlay() {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setPlaying(false)
  }

  function playScale() {
    if (playing) { stopPlay(); return }
    const midis = getPlayMidis()
    setPlaying(true)
    const ts = []
    midis.forEach((midi, i) => {
      ts.push(setTimeout(() => onNoteOn(midi), i * NOTE_STEP_MS))
      ts.push(setTimeout(() => {
        onNoteOff(midi)
        if (i === midis.length - 1) { setPlaying(false); timeoutsRef.current = [] }
      }, i * NOTE_STEP_MS + NOTE_STEP_MS - 100))
    })
    timeoutsRef.current = ts
  }

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])

  const noteNames = scale.intervals.map(i => ROOT_NAMES[(rootSemi + i) % 12])
  noteNames.push(ROOT_NAMES[rootSemi] + '\'')

  return (
    <div className="scales-tab">

      <div className="scales-top-row">
        {/* Root note picker */}
        <div className="scales-section">
          <div className="scales-section-label">Root Note</div>
          <div className="root-picker">
            {ROOT_NAMES.map((name, i) => (
              <button
                key={i}
                className={`root-btn${rootSemi === i ? ' active' : ''}${name.includes('#') ? ' sharp' : ''}`}
                onClick={() => setRootSemi(i)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="scales-main-row">
        {/* Scale picker */}
        <div className="scales-section scales-picker-section">
          <div className="scales-section-label">Scale Type</div>
          <div className="scale-list">
            {SCALES.map(s => (
              <button
                key={s.id}
                className={`scale-list-btn${scaleId === s.id ? ' active' : ''}`}
                onClick={() => setScaleId(s.id)}
              >
                <span className="scale-list-name">{s.name}</span>
                <span className="scale-list-cat">{s.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info + keyboard */}
        <div className="scales-right">
          <div className="scale-info-card">
            <div className="scale-info-top">
              <div className="scale-info-title-block">
                <div className="scale-info-title">{ROOT_NAMES[rootSemi]} {scale.name}</div>
                <div className="scale-info-formula">{scale.formula}</div>
              </div>
              <button
                className={`play-scale-btn${playing ? ' stop' : ''}`}
                onClick={playScale}
              >
                {playing ? '■ STOP' : '▶ PLAY SCALE'}
              </button>
            </div>

            <div className="scale-info-notes">
              {noteNames.map((n, i) => (
                <span key={i} className={`scale-degree${i === scale.intervals.length ? ' octave' : ''}`}>
                  {n}
                </span>
              ))}
            </div>

            <div className="scale-info-desc">{scale.desc}</div>
          </div>

          <div className="keyboard-container">
            <Keyboard
              baseOctave={baseOctave}
              activeNotes={activeNotes}
              scaleNotes={scaleNotes}
              onNoteOn={onNoteOn}
              onNoteOff={onNoteOff}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
