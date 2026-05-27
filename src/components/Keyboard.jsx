import { useRef, useEffect, useState } from 'react'
import { NOTE_NAMES } from '../lib/tunings'
import { KB_MAP, semiToMidi } from '../hooks/useKeyboardInput'
import './Keyboard.css'

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16]
const BLACK_SEMITONES = [1, 3, 6, 8, 10, 13, 15]

// Position of black key relative to its left white key index
const BLACK_POSITIONS = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5, 13: 7, 15: 8 }

// Build reverse map: semi -> kb label
const SEMI_TO_KEY = {}
Object.entries(KB_MAP).forEach(([k, { semi }]) => {
  SEMI_TO_KEY[semi] = k === ';' ? ';' : k.toUpperCase()
})

export default function Keyboard({ baseOctave, activeNotes, scaleNotes = new Set(), onNoteOn, onNoteOff }) {
  const wrapRef = useRef(null)
  const [keyWidth, setKeyWidth] = useState(52)

  useEffect(() => {
    function measure() {
      if (wrapRef.current) {
        setKeyWidth(Math.floor(wrapRef.current.offsetWidth / WHITE_SEMITONES.length))
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  function getMidi(semi) {
    return semiToMidi(semi, baseOctave)
  }

  function handlePointerDown(e, semi) {
    e.preventDefault()
    onNoteOn(getMidi(semi), semi)
  }

  function handlePointerUp(semi) {
    onNoteOff(getMidi(semi))
  }

  function handlePointerLeave(semi) {
    onNoteOff(getMidi(semi))
  }

  const bw = Math.round(keyWidth * 0.6)

  return (
    <div className="keyboard-wrap" ref={wrapRef}>
      {/* White keys */}
      {WHITE_SEMITONES.map((semi, i) => {
        const midi = getMidi(semi)
        const isActive = activeNotes.has(midi)
        const inScale = scaleNotes.size > 0 && scaleNotes.has(midi % 12)
        return (
          <div
            key={semi}
            className={`key white${inScale ? ' in-scale' : ''}${isActive ? ' active' : ''}`}
            style={{ left: i * keyWidth, width: keyWidth - 2 }}
            onPointerDown={e => handlePointerDown(e, semi)}
            onPointerUp={() => handlePointerUp(semi)}
            onPointerLeave={() => handlePointerLeave(semi)}
          >
            <div className="key-bottom">
              <span className="key-note">{NOTE_NAMES[midi % 12]}</span>
              <span className="key-kb">{SEMI_TO_KEY[semi] || ''}</span>
            </div>
          </div>
        )
      })}

      {/* Black keys */}
      {BLACK_SEMITONES.map(semi => {
        const pos = BLACK_POSITIONS[semi]
        if (pos === undefined) return null
        const midi = getMidi(semi)
        const isActive = activeNotes.has(midi)
        const inScale = scaleNotes.size > 0 && scaleNotes.has(midi % 12)
        return (
          <div
            key={semi}
            className={`key black${inScale ? ' in-scale' : ''}${isActive ? ' active' : ''}`}
            style={{
              left: pos * keyWidth + keyWidth - Math.round(bw / 2) - 1,
              width: bw,
            }}
            onPointerDown={e => handlePointerDown(e, semi)}
            onPointerUp={() => handlePointerUp(semi)}
            onPointerLeave={() => handlePointerLeave(semi)}
          >
            <div className="key-bottom">
              <span className="key-note">{NOTE_NAMES[midi % 12]}</span>
              <span className="key-kb">{SEMI_TO_KEY[semi] || ''}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
