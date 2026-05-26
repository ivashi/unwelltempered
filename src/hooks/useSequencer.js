import { useState, useRef, useCallback, useEffect } from 'react'
import { DRUM_TRACKS } from '../lib/drumSynth'

const LOOKAHEAD  = 0.1   // seconds ahead to schedule
const TICK_MS    = 25    // scheduler poll interval
const NOTE_RATIO = 0.78  // melodic note length as fraction of step

export function useSequencer({
  scheduleNote, getAudioNodes,
  tuningKey, a4, waveform, equalDivisions, equalOctaveRatio,
}) {
  const [bpm, setBpm]                 = useState(120)
  const [playing, setPlaying]         = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [trackLevels, setTrackLevels] = useState(() => DRUM_TRACKS.map(() => 1.0))

  const [drumPattern, setDrumPattern] = useState(
    () => DRUM_TRACKS.map(() => Array(16).fill(false))
  )
  const [melSteps, setMelSteps] = useState(
    () => Array.from({ length: 16 }, () => ({ on: false, midi: 60 }))
  )

  // Scheduler refs
  const playingRef     = useRef(false)
  const bpmRef         = useRef(120)
  const drumRef        = useRef(drumPattern)
  const melRef         = useRef(melSteps)
  const nextTimeRef    = useRef(0)
  const nextIndexRef   = useRef(0)
  const tickerRef      = useRef(null)
  const trackGainRefs  = useRef(null)  // per-track GainNodes, lazy-init

  // Settings refs — updated without restarting the scheduler
  const tuningKeyRef        = useRef(tuningKey)
  const a4Ref               = useRef(a4)
  const waveformRef         = useRef(waveform)
  const equalDivisionsRef   = useRef(equalDivisions)
  const equalOctaveRatioRef = useRef(equalOctaveRatio)

  useEffect(() => { bpmRef.current = bpm },               [bpm])
  useEffect(() => { drumRef.current = drumPattern },      [drumPattern])
  useEffect(() => { melRef.current = melSteps },          [melSteps])
  useEffect(() => { tuningKeyRef.current = tuningKey },   [tuningKey])
  useEffect(() => { a4Ref.current = a4 },                 [a4])
  useEffect(() => { waveformRef.current = waveform },     [waveform])
  useEffect(() => { equalDivisionsRef.current = equalDivisions },   [equalDivisions])
  useEffect(() => { equalOctaveRatioRef.current = equalOctaveRatio }, [equalOctaveRatio])

  function stepDuration() { return 60 / bpmRef.current / 4 }

  function tick() {
    const { ac, master } = getAudioNodes()

    // Lazy-init one GainNode per drum track so each has independent volume
    if (!trackGainRefs.current) {
      trackGainRefs.current = DRUM_TRACKS.map(() => {
        const g = ac.createGain()
        g.gain.value = 1.0
        g.connect(master)
        return g
      })
    }
    const trackGains = trackGainRefs.current

    const now = ac.currentTime

    while (nextTimeRef.current < now + LOOKAHEAD) {
      const idx      = nextIndexRef.current
      const stepTime = nextTimeRef.current
      const dur      = stepDuration()

      // Drum hits → routed through per-track gain
      drumRef.current.forEach((track, ti) => {
        if (track[idx]) DRUM_TRACKS[ti].synth(ac, trackGains[ti], stepTime)
      })

      // Melodic note
      const mel = melRef.current[idx]
      if (mel?.on && mel.midi != null) {
        const opts = tuningKeyRef.current === 'equal'
          ? { divisions: equalDivisionsRef.current, octaveRatio: equalOctaveRatioRef.current }
          : {}
        scheduleNote(
          mel.midi, tuningKeyRef.current, a4Ref.current,
          waveformRef.current, opts, stepTime, dur * NOTE_RATIO
        )
      }

      // Visual indicator — synced to audio via delayed setState
      const delay = Math.max(0, (stepTime - now) * 1000)
      setTimeout(() => {
        if (playingRef.current) setCurrentStep(idx)
      }, delay)

      nextTimeRef.current += dur
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

  // Drum actions
  const toggleDrumCell = useCallback((ti, si) => {
    setDrumPattern(prev => {
      const next = prev.map(r => [...r])
      next[ti][si] = !next[ti][si]
      return next
    })
  }, [])

  const clearDrumTrack = useCallback((ti) => {
    setDrumPattern(prev => {
      const next = prev.map(r => [...r])
      next[ti] = Array(16).fill(false)
      return next
    })
  }, [])

  // Melodic actions
  const toggleMelStep = useCallback((si) => {
    setMelSteps(prev => {
      const next = [...prev]
      next[si] = { ...next[si], on: !next[si].on }
      return next
    })
  }, [])

  const setMelStepNote = useCallback((si, midi) => {
    setMelSteps(prev => {
      const next = [...prev]
      next[si] = { ...next[si], midi, on: true }
      return next
    })
  }, [])

  const clearMelStep = useCallback((si) => {
    setMelSteps(prev => {
      const next = [...prev]
      next[si] = { ...next[si], on: false }
      return next
    })
  }, [])

  // Per-track volume — updates GainNode immediately + React state for UI
  const setTrackLevel = useCallback((ti, val) => {
    setTrackLevels(prev => {
      const next = [...prev]
      next[ti] = val
      return next
    })
    if (trackGainRefs.current?.[ti]) {
      trackGainRefs.current[ti].gain.value = val
    }
  }, [])

  useEffect(() => () => clearInterval(tickerRef.current), [])

  return {
    bpm, setBpm,
    playing, start, stop,
    currentStep,
    drumPattern, toggleDrumCell, clearDrumTrack,
    melSteps, toggleMelStep, setMelStepNote, clearMelStep,
    trackLevels, setTrackLevel,
  }
}
