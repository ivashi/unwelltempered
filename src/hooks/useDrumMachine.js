import { useState, useRef, useCallback, useEffect } from 'react'
import { DRUM_TRACKS } from '../lib/drumSynth'

const LOOKAHEAD = 0.1  // seconds ahead
const TICK_MS   = 25   // scheduler poll interval

export function useDrumMachine({ getAudioNodes }) {
  const [bpm, setBpm]         = useState(120)
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)

  // pattern[trackIndex][stepIndex] = boolean
  const [pattern, setPattern] = useState(
    () => DRUM_TRACKS.map(() => Array(16).fill(false))
  )

  const playingRef     = useRef(false)
  const bpmRef         = useRef(120)
  const patternRef     = useRef(pattern)
  const nextTimeRef    = useRef(0)
  const nextIndexRef   = useRef(0)
  const tickerRef      = useRef(null)

  useEffect(() => { bpmRef.current = bpm },       [bpm])
  useEffect(() => { patternRef.current = pattern }, [pattern])

  function stepDuration() {
    return 60 / bpmRef.current / 4
  }

  function tick() {
    const { ac, master } = getAudioNodes()
    const now = ac.currentTime

    while (nextTimeRef.current < now + LOOKAHEAD) {
      const idx      = nextIndexRef.current
      const stepTime = nextTimeRef.current

      // Fire any active drums on this step
      patternRef.current.forEach((track, ti) => {
        if (track[idx]) {
          DRUM_TRACKS[ti].synth(ac, master, stepTime)
        }
      })

      // Visual sync
      const delay = Math.max(0, (stepTime - now) * 1000)
      setTimeout(() => {
        if (playingRef.current) setCurrentStep(idx)
      }, delay)

      nextTimeRef.current += stepDuration()
      nextIndexRef.current = (idx + 1) % 16
    }
  }

  const start = useCallback(() => {
    const { ac } = getAudioNodes()
    nextTimeRef.current  = ac.currentTime + 0.05
    nextIndexRef.current = 0
    playingRef.current   = true
    setPlaying(true)
    setCurrentStep(-1)
    tickerRef.current = setInterval(tick, TICK_MS)
  }, [getAudioNodes])

  const stop = useCallback(() => {
    clearInterval(tickerRef.current)
    playingRef.current = false
    setPlaying(false)
    setCurrentStep(-1)
  }, [])

  const toggleCell = useCallback((trackIndex, stepIndex) => {
    setPattern(prev => {
      const next = prev.map(row => [...row])
      next[trackIndex][stepIndex] = !next[trackIndex][stepIndex]
      return next
    })
  }, [])

  const clearTrack = useCallback((trackIndex) => {
    setPattern(prev => {
      const next = prev.map(row => [...row])
      next[trackIndex] = Array(16).fill(false)
      return next
    })
  }, [])

  useEffect(() => () => clearInterval(tickerRef.current), [])

  return { bpm, setBpm, playing, start, stop, currentStep, pattern, toggleCell, clearTrack }
}
