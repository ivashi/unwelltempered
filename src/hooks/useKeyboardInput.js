import { useEffect, useRef } from 'react'

// Maps keyboard keys -> semitone offset from base octave root (C)
// Two octaves: lower starting at baseOctave, upper at baseOctave+1
export const KB_MAP = {
  a: { semi: 0 },   // C
  w: { semi: 1 },   // C#
  s: { semi: 2 },   // D
  e: { semi: 3 },   // D#
  d: { semi: 4 },   // E
  f: { semi: 5 },   // F
  t: { semi: 6 },   // F#
  g: { semi: 7 },   // G
  y: { semi: 8 },   // G#
  h: { semi: 9 },   // A
  u: { semi: 10 },  // A#
  j: { semi: 11 },  // B
  k: { semi: 12 },  // C  (octave up)
  o: { semi: 13 },  // C#
  l: { semi: 14 },  // D
  p: { semi: 15 },  // D#
  ';': { semi: 16 }, // E
}

export function semiToMidi(semi, baseOctave) {
  const extraOct = semi >= 12 ? 1 : 0
  return 12 * (baseOctave + extraOct) + (semi % 12) + 12
}

export function useKeyboardInput({ baseOctave, onNoteOn, onNoteOff }) {
  const pressedRef = useRef(new Set())

  useEffect(() => {
    function handleDown(e) {
      if (e.repeat || e.metaKey || e.ctrlKey) return
      const key = e.key === ';' ? ';' : e.key.toLowerCase()
      const mapping = KB_MAP[key]
      if (!mapping) return
      if (pressedRef.current.has(key)) return
      pressedRef.current.add(key)
      const midi = semiToMidi(mapping.semi, baseOctave)
      onNoteOn(midi, mapping.semi)
    }

    function handleUp(e) {
      const key = e.key === ';' ? ';' : e.key.toLowerCase()
      const mapping = KB_MAP[key]
      if (!mapping) return
      pressedRef.current.delete(key)
      const midi = semiToMidi(mapping.semi, baseOctave)
      onNoteOff(midi)
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      // Release any currently-pressed notes before the octave/handlers update,
      // otherwise the old midi numbers are orphaned and the note gets stuck.
      for (const key of pressedRef.current) {
        const mapping = KB_MAP[key]
        if (mapping) onNoteOff(semiToMidi(mapping.semi, baseOctave))
      }
      pressedRef.current.clear()
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [baseOctave, onNoteOn, onNoteOff])
}
