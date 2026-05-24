import { useState, useCallback } from 'react'
import Keyboard from './components/Keyboard'
import TuningPanel from './components/TuningPanel'
import CentsDisplay from './components/CentsDisplay'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useKeyboardInput } from './hooks/useKeyboardInput'
import { TUNINGS, NOTE_NAMES } from './lib/tunings'
import './App.css'

const WAVEFORMS = ['triangle', 'sine', 'square', 'sawtooth']
const A4_OPTIONS = [
  { label: '432 Hz', value: 432 },
  { label: '440 Hz', value: 440 },
  { label: '444 Hz', value: 444 },
  { label: '415 Hz (Baroque)', value: 415 },
]

export default function App() {
  const [tuningKey, setTuningKey] = useState('equal')
  const [baseOctave, setBaseOctave] = useState(4)
  const [a4, setA4] = useState(440)
  const [waveform, setWaveform] = useState('triangle')
  const [activeNotes, setActiveNotes] = useState(new Set())
  const [lastNote, setLastNote] = useState(null)
  const [sidebarTab, setSidebarTab] = useState('tuning')

  const { playNote, stopNote, stopAll } = useAudioEngine()

  const handleNoteOn = useCallback((midi) => {
    const freq = playNote(midi, tuningKey, a4, waveform)
    setActiveNotes(prev => new Set([...prev, midi]))
    setLastNote({ midi, freq, name: NOTE_NAMES[midi % 12], oct: Math.floor(midi / 12) - 1 })
  }, [playNote, tuningKey, a4, waveform])

  const handleNoteOff = useCallback((midi) => {
    stopNote(midi)
    setActiveNotes(prev => {
      const next = new Set(prev)
      next.delete(midi)
      return next
    })
  }, [stopNote])

  useKeyboardInput({ baseOctave, onNoteOn: handleNoteOn, onNoteOff: handleNoteOff })

  function handleTuningChange(key) {
    stopAll()
    setActiveNotes(new Set())
    setTuningKey(key)
  }

  const t = TUNINGS[tuningKey]

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-wordmark">
          <span className="app-wordmark-un">un</span>
          <span className="app-wordmark-well">well</span>
          <span className="app-wordmark-tempered">tempered</span>
        </div>
        <div className="app-controls">
          <div className="control-chip">
            <label className="control-label">A4</label>
            <select value={a4} onChange={e => setA4(Number(e.target.value))} className="control-select">
              {A4_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="control-chip">
            <label className="control-label">Timbre</label>
            <select value={waveform} onChange={e => setWaveform(e.target.value)} className="control-select">
              {WAVEFORMS.map(w => (
                <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="control-chip">
            <label className="control-label">Octave</label>
            <div className="octave-stepper">
              <button className="oct-btn" onClick={() => setBaseOctave(o => Math.max(1, o - 1))}>−</button>
              <span className="oct-val">{baseOctave}</span>
              <button className="oct-btn" onClick={() => setBaseOctave(o => Math.min(7, o + 1))}>+</button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button className={`sidebar-tab${sidebarTab === 'tuning' ? ' active' : ''}`} onClick={() => setSidebarTab('tuning')}>
              Tuning
            </button>
            <button className={`sidebar-tab${sidebarTab === 'cents' ? ' active' : ''}`} onClick={() => setSidebarTab('cents')}>
              Deviation
            </button>
          </div>
          <div className="sidebar-content">
            {sidebarTab === 'tuning' ? (
              <TuningPanel currentTuning={tuningKey} onChange={handleTuningChange} />
            ) : (
              <div>
                <div className="cents-section-title">{t.name}</div>
                <CentsDisplay tuningKey={tuningKey} />
              </div>
            )}
          </div>
        </aside>

        <main className="main-area">
          <div className="tuning-info-card">
            <div className="tuning-info-header">
              <div className="tuning-info-name">{t.name}</div>
              {t.short && t.short !== t.name && <div className="tuning-info-short">{t.short}</div>}
              <div className="tuning-info-era">{t.era}</div>
            </div>
            <p className="tuning-info-desc">{t.desc}</p>
          </div>

          <div className="note-display">
            {lastNote ? (
              <>
                <span className="note-display-name">{lastNote.name}{lastNote.oct}</span>
                <span className="note-display-freq">{lastNote.freq?.toFixed(2)} Hz</span>
              </>
            ) : (
              <span className="note-display-hint">press a key · keyboard: A – ; spans two octaves</span>
            )}
          </div>

          <div className="keyboard-container">
            <Keyboard baseOctave={baseOctave} activeNotes={activeNotes} onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
          </div>
        </main>
      </div>
    </div>
  )
}
