import { useState, useCallback } from 'react'
import Keyboard from '../components/Keyboard'
import Sequencer from '../components/Sequencer'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { useSequencer } from '../hooks/useSequencer'

const WAVEFORMS = ['triangle', 'sine', 'square', 'sawtooth']

export default function SequencerPage() {
  const [tuningKey,        setTuningKey]        = useState('equal')
  const [baseOctave,       setBaseOctave]       = useState(4)
  const [a4,               setA4]               = useState(440)
  const [waveform,         setWaveform]         = useState('triangle')
  const [activeNotes,      setActiveNotes]      = useState(new Set())
  const [equalDivisions,   setEqualDivisions]   = useState(12)
  const [equalOctaveRatio, setEqualOctaveRatio] = useState(2)
  const [selectedStep,     setSelectedStep]     = useState(null)

  const { playNote, stopNote, scheduleNote, getAudioNodes } = useAudioEngine()

  const {
    bpm, setBpm,
    playing: seqPlaying, start: seqStart, stop: seqStop,
    currentStep,
    drumPattern, toggleDrumCell, clearDrumTrack,
    melSteps, setMelStepNote, clearMelStep,
    setMelStepVelocity, setMelStepPan, cycleMelStepLength,
    trackLevels, setTrackLevel,
    trackPans,   setTrackPan,
    trackMutes,  toggleMute,
  } = useSequencer({ scheduleNote, getAudioNodes, tuningKey, a4, waveform, equalDivisions, equalOctaveRatio })

  const handleNoteOn = useCallback((midi) => {
    const opts = tuningKey === 'equal' ? { divisions: equalDivisions, octaveRatio: equalOctaveRatio } : {}
    playNote(midi, tuningKey, a4, waveform, opts)
    setActiveNotes(prev => new Set([...prev, midi]))
    if (selectedStep !== null) setMelStepNote(selectedStep, midi)
  }, [playNote, tuningKey, a4, waveform, equalDivisions, equalOctaveRatio, selectedStep, setMelStepNote])

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

      <Sequencer
        drumPattern={drumPattern}
        melSteps={melSteps}
        playing={seqPlaying}
        currentStep={currentStep}
        bpm={bpm}
        selectedStep={selectedStep}
        trackLevels={trackLevels}
        trackPans={trackPans}
        trackMutes={trackMutes}
        onPlay={seqStart}
        onStop={seqStop}
        onBpmChange={setBpm}
        onToggleDrumCell={toggleDrumCell}
        onClearDrumTrack={clearDrumTrack}
        onMelStepClick={i => setSelectedStep(prev => prev === i ? null : i)}
        onMelStepRightClick={clearMelStep}
        onTrackLevelChange={setTrackLevel}
        onTrackPanChange={setTrackPan}
        onToggleMute={toggleMute}
        onSetMelVelocity={setMelStepVelocity}
        onSetMelPan={setMelStepPan}
        onCycleMelLength={cycleMelStepLength}
      />

      <div className="keyboard-container">
        <Keyboard
          baseOctave={baseOctave}
          activeNotes={activeNotes}
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
        />
      </div>
    </div>
  )
}
