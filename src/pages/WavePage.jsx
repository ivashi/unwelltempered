import { useState, useCallback } from 'react'
import WaveTab from '../components/WaveTab'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useKeyboardInput } from '../hooks/useKeyboardInput'

export default function WavePage() {
  const [baseOctave,  setBaseOctave]  = useState(4)
  const [activeNotes, setActiveNotes] = useState(new Set())

  // The WaveTab controls the waveform; we always play with the custom wave ('draw').
  // setCustomWave is wired up via onWaveChange so the engine always has the latest coefficients.
  const { playNote, stopNote, setCustomWave } = useAudioEngine()

  // Memoised to prevent WaveTab's useEffect from firing on every render (bug fix)
  const handleWaveChange = useCallback((real, imag) => {
    setCustomWave(real, imag)
  }, [setCustomWave])

  const handleNoteOn = useCallback((midi) => {
    playNote(midi, 'equal', 440, 'draw', {})
    setActiveNotes(prev => new Set([...prev, midi]))
  }, [playNote])

  const handleNoteOff = useCallback((midi) => {
    stopNote(midi)
    setActiveNotes(prev => { const n = new Set(prev); n.delete(midi); return n })
  }, [stopNote])

  useKeyboardInput({ baseOctave, onNoteOn: handleNoteOn, onNoteOff: handleNoteOff })

  return (
    <div className="tab-pane tab-pane--canvas">
      <WaveTab
        onWaveChange={handleWaveChange}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
        activeNotes={activeNotes}
        baseOctave={baseOctave}
        setBaseOctave={setBaseOctave}
      />
    </div>
  )
}
