import { useState, useCallback } from 'react'
import ScalesTab from '../components/ScalesTab'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useKeyboardInput } from '../hooks/useKeyboardInput'

const WAVEFORMS = ['triangle', 'sine', 'square', 'sawtooth']

export default function ScalesPage() {
  const [baseOctave, setBaseOctave] = useState(4)
  const [waveform,   setWaveform]   = useState('triangle')
  const [activeNotes, setActiveNotes] = useState(new Set())

  const { playNote, stopNote } = useAudioEngine()

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
      <div className="freeplay-piano-controls" style={{ flexShrink: 0 }}>
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
      <ScalesTab
        baseOctave={baseOctave}
        activeNotes={activeNotes}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />
    </div>
  )
}
