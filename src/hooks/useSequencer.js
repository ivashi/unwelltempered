import { useState, useRef, useCallback, useEffect } from 'react'
import { DRUM_TRACKS } from '../lib/drumSynth'

const LOOKAHEAD  = 0.1
const TICK_MS    = 25
const NOTE_RATIO = 0.78

export function useSequencer({
  scheduleNote, getAudioNodes,
  tuningKey, a4, waveform, equalDivisions, equalOctaveRatio,
}) {
  const [bpm, setBpm]                 = useState(120)
  const [playing, setPlaying]         = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [trackLevels, setTrackLevels] = useState(() => DRUM_TRACKS.map(() => 1.0))
  const [trackPans,   setTrackPans]   = useState(() => DRUM_TRACKS.map(() => 0))
  const [trackMutes,  setTrackMutes]  = useState(() => DRUM_TRACKS.map(() => false))

  const [drumPattern, setDrumPattern] = useState(
    () => DRUM_TRACKS.map(() => Array(16).fill(false))
  )
  const [melSteps, setMelSteps] = useState(
    () => Array.from({ length: 16 }, () => ({ on: false, midi: 60, velocity: 0.8, pan: 0, length: 1 }))
  )

  // Scheduler refs
  const playingRef      = useRef(false)
  const bpmRef          = useRef(120)
  const drumRef         = useRef(drumPattern)
  const melRef          = useRef(melSteps)
  const muteRef         = useRef(trackMutes)
  const nextTimeRef     = useRef(0)
  const nextIndexRef    = useRef(0)
  const tickerRef       = useRef(null)
  const trackGainRefs   = useRef(null)   // GainNode[]
  const trackPannerRefs = useRef(null)   // StereoPannerNode[]

  // Settings refs — updated without restarting the scheduler
  const tuningKeyRef        = useRef(tuningKey)
  const a4Ref               = useRef(a4)
  const waveformRef         = useRef(waveform)
  const equalDivisionsRef   = useRef(equalDivisions)
  const equalOctaveRatioRef = useRef(equalOctaveRatio)

  useEffect(() => { bpmRef.current = bpm },               [bpm])
  useEffect(() => { drumRef.current = drumPattern },      [drumPattern])
  useEffect(() => { melRef.current = melSteps },          [melSteps])
  useEffect(() => { muteRef.current = trackMutes },       [trackMutes])
  useEffect(() => { tuningKeyRef.current = tuningKey },   [tuningKey])
  useEffect(() => { a4Ref.current = a4 },                 [a4])
  useEffect(() => { waveformRef.current = waveform },     [waveform])
  useEffect(() => { equalDivisionsRef.current = equalDivisions },   [equalDivisions])
  useEffect(() => { equalOctaveRatioRef.current = equalOctaveRatio }, [equalOctaveRatio])

  function stepDuration() { return 60 / bpmRef.current / 4 }

  // Lazy-init per-track gain → panner → master chain
  function initTrackNodes(ac, master) {
    if (trackGainRefs.current) return
    const panners = DRUM_TRACKS.map(() => {
      const p = ac.createStereoPanner()
      p.pan.value = 0
      p.connect(master)
      return p
    })
    trackPannerRefs.current = panners
    trackGainRefs.current = DRUM_TRACKS.map((_, i) => {
      const g = ac.createGain()
      g.gain.value = 1.0
      g.connect(panners[i])
      return g
    })
  }

  function tick() {
    const { ac, master } = getAudioNodes()
    initTrackNodes(ac, master)
    const trackGains = trackGainRefs.current
    const now = ac.currentTime

    while (nextTimeRef.current < now + LOOKAHEAD) {
      const idx      = nextIndexRef.current
      const stepTime = nextTimeRef.current
      const dur      = stepDuration()

      // Drum hits — skipped if track is muted
      drumRef.current.forEach((track, ti) => {
        if (track[idx] && !muteRef.current[ti]) {
          DRUM_TRACKS[ti].synth(ac, trackGains[ti], stepTime)
        }
      })

      // Melodic note — length multiplier, velocity, and pan per step
      const mel = melRef.current[idx]
      if (mel?.on && mel.midi != null) {
        const opts = tuningKeyRef.current === 'equal'
          ? { divisions: equalDivisionsRef.current, octaveRatio: equalOctaveRatioRef.current }
          : {}
        scheduleNote(
          mel.midi, tuningKeyRef.current, a4Ref.current,
          waveformRef.current, opts,
          stepTime,
          dur * (mel.length ?? 1) * NOTE_RATIO,
          mel.velocity ?? 0.8,
          mel.pan ?? 0
        )
      }

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

  // Drum pattern actions
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

  const setMelStepVelocity = useCallback((si, velocity) => {
    setMelSteps(prev => {
      const next = [...prev]
      next[si] = { ...next[si], velocity }
      return next
    })
  }, [])

  const setMelStepPan = useCallback((si, pan) => {
    setMelSteps(prev => {
      const next = [...prev]
      next[si] = { ...next[si], pan }
      return next
    })
  }, [])

  const MEL_LENGTHS = [1, 2, 4, 8]
  const cycleMelStepLength = useCallback((si) => {
    setMelSteps(prev => {
      const next = [...prev]
      const cur = next[si].length ?? 1
      const idx = MEL_LENGTHS.indexOf(cur)
      next[si] = { ...next[si], length: MEL_LENGTHS[(idx + 1) % MEL_LENGTHS.length] }
      return next
    })
  }, [])

  // Per-track volume
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

  // Per-track pan
  const setTrackPan = useCallback((ti, val) => {
    setTrackPans(prev => {
      const next = [...prev]
      next[ti] = val
      return next
    })
    if (trackPannerRefs.current?.[ti]) {
      trackPannerRefs.current[ti].pan.value = val
    }
  }, [])

  // Per-track mute (skips scheduling; gain node keeps its level value)
  const toggleMute = useCallback((ti) => {
    setTrackMutes(prev => {
      const next = [...prev]
      next[ti] = !next[ti]
      return next
    })
  }, [])

  useEffect(() => () => clearInterval(tickerRef.current), [])

  return {
    bpm, setBpm,
    playing, start, stop,
    currentStep,
    drumPattern, toggleDrumCell, clearDrumTrack,
    melSteps, toggleMelStep, setMelStepNote, clearMelStep,
    setMelStepVelocity, setMelStepPan, cycleMelStepLength,
    trackLevels, setTrackLevel,
    trackPans,   setTrackPan,
    trackMutes,  toggleMute,
  }
}
