import { useCallback } from 'react'
import BouncerTab from '../components/BouncerTab'
import { useAudioEngine } from '../hooks/useAudioEngine'

export default function BouncerPage() {
  const { playNote, stopNote } = useAudioEngine()

  // Stable handlers — Bouncer never arms sequencer steps, so no cross-tab state bleed
  const handleNoteOn = useCallback((midi) => {
    playNote(midi, 'equal', 440, 'triangle', {})
  }, [playNote])

  const handleNoteOff = useCallback((midi) => {
    stopNote(midi)
  }, [stopNote])

  return (
    <div className="tab-pane tab-pane--canvas">
      <BouncerTab onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
    </div>
  )
}
