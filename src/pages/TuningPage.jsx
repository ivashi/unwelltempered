import { useState, useCallback } from 'react'
import Keyboard from '../components/Keyboard'
import TuningPanel from '../components/TuningPanel'
import Oscilloscope from '../components/Oscilloscope'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { TUNINGS, getFrequency, NOTE_NAMES } from '../lib/tunings'

const WAVEFORMS = ['triangle', 'sine', 'square', 'sawtooth']
const A4_OPTIONS = [
  { label: '432 Hz', value: 432 },
  { label: '440 Hz', value: 440 },
  { label: '444 Hz', value: 444 },
  { label: '415 Hz (Baroque)', value: 415 },
]

export default function TuningPage() {
  const [tuningKey,        setTuningKey]        = useState('equal')
  const [baseOctave,       setBaseOctave]       = useState(4)
  const [a4,               setA4]               = useState(440)
  const [waveform,         setWaveform]         = useState('triangle')
  const [activeNotes,      setActiveNotes]      = useState(new Set())
  const [equalDivisions,   setEqualDivisions]   = useState(12)
  const [equalOctaveRatio, setEqualOctaveRatio] = useState(2)

  const { playNote, stopNote, stopAll, analyserRef } = useAudioEngine()

  const handleNoteOn = useCallback((midi) => {
    const opts = tuningKey === 'equal' ? { divisions: equalDivisions, octaveRatio: equalOctaveRatio } : {}
    playNote(midi, tuningKey, a4, waveform, opts)
    setActiveNotes(prev => new Set([...prev, midi]))
  }, [playNote, tuningKey, a4, waveform, equalDivisions, equalOctaveRatio])

  const handleNoteOff = useCallback((midi) => {
    stopNote(midi)
    setActiveNotes(prev => { const n = new Set(prev); n.delete(midi); return n })
  }, [stopNote])

  useKeyboardInput({ baseOctave, onNoteOn: handleNoteOn, onNoteOff: handleNoteOff })

  function handleTuningChange(key) {
    stopAll()
    setActiveNotes(new Set())
    setTuningKey(key)
  }

  const t = TUNINGS[tuningKey]

  return (
    <div className="tab-pane">
      <div className="tuning-lab">

        <div className="tuning-lab-sidebar">
          <TuningPanel currentTuning={tuningKey} onChange={handleTuningChange} />
        </div>

        <div className="tuning-lab-main">
          <div className="tuning-info-card">
            <div className="tuning-info-header">
              <div className="tuning-info-name">{t.name}</div>
              {tuningKey === 'equal' ? (
                <div className="tuning-info-short">
                  {Number.isInteger(equalDivisions) ? equalDivisions : equalDivisions.toFixed(1)}-TET
                  {equalOctaveRatio !== 2 ? ` · ${equalOctaveRatio.toFixed(2)}:1` : ''}
                </div>
              ) : (
                t.short && t.short !== t.name && <div className="tuning-info-short">{t.short}</div>
              )}
              <div className="tuning-info-era">
                {tuningKey === 'equal' && (equalDivisions !== 12 || equalOctaveRatio !== 2) ? 'Custom' : t.era}
              </div>
              <div className="tuning-a4-chip">
                <label className="control-label">A4</label>
                <select value={a4} onChange={e => setA4(Number(e.target.value))} className="control-select">
                  {A4_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="control-chip" style={{ marginLeft: 8 }}>
                <label className="control-label">Timbre</label>
                <select value={waveform} onChange={e => setWaveform(e.target.value)} className="control-select">
                  {WAVEFORMS.map(w => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
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
            <p className="tuning-info-desc">{t.desc}</p>

            {tuningKey === 'equal' && (
              <div className="equal-custom">
                <div className="equal-slider-row">
                  <div className="equal-slider-header">
                    <span className="equal-slider-label">Steps per octave</span>
                    <span className="equal-slider-value">
                      {Number.isInteger(equalDivisions) ? equalDivisions : equalDivisions.toFixed(1)}
                    </span>
                  </div>
                  <input type="range" className="equal-slider"
                    min="5" max="48" step="0.5" value={equalDivisions}
                    onChange={e => setEqualDivisions(Number(e.target.value))} />
                  <span className="equal-slider-sub">
                    ratio {Math.pow(equalOctaveRatio, 1 / equalDivisions).toFixed(5)}
                    {' · '}{(Math.log2(equalOctaveRatio) * 1200 / equalDivisions).toFixed(1)}¢ / step
                  </span>
                </div>
                <div className="equal-slider-row">
                  <div className="equal-slider-header">
                    <span className="equal-slider-label">Octave ratio</span>
                    <span className="equal-slider-value">{equalOctaveRatio.toFixed(2)} : 1</span>
                  </div>
                  <input type="range" className="equal-slider"
                    min="1.5" max="2.5" step="0.01" value={equalOctaveRatio}
                    onChange={e => setEqualOctaveRatio(Number(e.target.value))} />
                  <span className="equal-slider-sub">
                    {equalOctaveRatio === 2 ? 'standard octave'
                      : equalOctaveRatio < 2
                        ? `compressed (${((equalOctaveRatio / 2 - 1) * 100).toFixed(1)}%)`
                        : `stretched (+${((equalOctaveRatio / 2 - 1) * 100).toFixed(1)}%)`}
                  </span>
                </div>
                {(equalDivisions !== 12 || equalOctaveRatio !== 2) && (
                  <button className="equal-reset-btn"
                    onClick={() => { setEqualDivisions(12); setEqualOctaveRatio(2) }}>
                    reset to 12-TET
                  </button>
                )}
              </div>
            )}
          </div>

          <Oscilloscope analyserRef={analyserRef} />

          <div className="freq-readout">
            {activeNotes.size === 0 ? (
              <span className="freq-readout-hint">play notes to see frequencies</span>
            ) : (
              [...activeNotes].sort((a, b) => a - b).map(midi => {
                const opts = tuningKey === 'equal' ? { divisions: equalDivisions, octaveRatio: equalOctaveRatio } : {}
                const freq    = getFrequency(midi, tuningKey, a4, opts)
                const eqFreq  = getFrequency(midi, 'equal', a4, {})
                const cents   = 1200 * Math.log2(freq / eqFreq)
                const name    = NOTE_NAMES[midi % 12]
                const octave  = Math.floor(midi / 12) - 1
                const centsStr  = (cents >= 0 ? '+' : '') + cents.toFixed(1) + '¢'
                const centsClass = Math.abs(cents) < 0.5 ? '' : cents > 0 ? ' freq-sharp' : ' freq-flat'
                return (
                  <div key={midi} className="freq-row">
                    <span className="freq-note">{name}<span className="freq-octave">{octave}</span></span>
                    <span className="freq-hz">{freq.toFixed(2)} Hz</span>
                    <span className={`freq-cents${centsClass}`}>{centsStr}</span>
                  </div>
                )
              })
            )}
          </div>

          <div className="keyboard-container">
            <Keyboard
              baseOctave={baseOctave}
              activeNotes={activeNotes}
              onNoteOn={handleNoteOn}
              onNoteOff={handleNoteOff}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
