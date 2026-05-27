import { useState, useCallback } from 'react'
import Keyboard from '../components/Keyboard'
import Oscilloscope from '../components/Oscilloscope'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useKeyboardInput } from '../hooks/useKeyboardInput'

const WAVEFORMS = ['triangle', 'sine', 'square', 'sawtooth']

export default function FreePlayPage() {
  const [baseOctave, setBaseOctave] = useState(4)
  const [waveform,   setWaveform]   = useState('triangle')
  const [activeNotes, setActiveNotes] = useState(new Set())

  const { playNote, stopNote, analyserRef } = useAudioEngine()

  const handleNoteOn = useCallback((midi) => {
    playNote(midi, 'equal', 440, waveform, {})
    setActiveNotes(prev => new Set([...prev, midi]))
  }, [playNote, waveform])

  const handleNoteOff = useCallback((midi) => {
    stopNote(midi)
    setActiveNotes(prev => { const n = new Set(prev); n.delete(midi); return n })
  }, [stopNote])

  useKeyboardInput({ baseOctave, onNoteOn: handleNoteOn, onNoteOff: handleNoteOff })

  return (
    <div className="tab-pane">
      <div className="freeplay-headline">
        <span className="freeplay-tuning-name">Free Play</span>
        <span className="freeplay-hint">play notes · watch the wave</span>
      </div>

      <Oscilloscope analyserRef={analyserRef} />

      <div className="freeplay-keyboard-area">
        <div className="freeplay-piano-controls">
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
  )
}
