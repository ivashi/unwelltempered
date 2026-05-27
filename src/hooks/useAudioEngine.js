import { useRef, useCallback } from 'react'
import { getFrequency } from '../lib/tunings'

export function useAudioEngine() {
  const ctxRef = useRef(null)
  const activeNodesRef = useRef({})
  const analyserRef = useRef(null)
  const masterGainRef = useRef(null)

  function getCtx() {
    if (!ctxRef.current) {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = ac

      // Master bus: all voices → masterGain → analyser → destination
      const masterGain = ac.createGain()
      masterGain.gain.value = 1.0
      masterGainRef.current = masterGain

      const analyser = ac.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.1
      analyserRef.current = analyser

      masterGain.connect(analyser)
      analyser.connect(ac.destination)
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }

  const playNote = useCallback((midiNote, tuningKey, a4, waveform = 'triangle', options = {}) => {
    if (activeNodesRef.current[midiNote]) return
    const ac = getCtx()
    const freq = getFrequency(midiNote, tuningKey, a4, options)

    const osc = ac.createOscillator()
    const gainNode = ac.createGain()

    // Slight attack to avoid clicks
    osc.type = waveform
    osc.frequency.setValueAtTime(freq, ac.currentTime)

    gainNode.gain.setValueAtTime(0, ac.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.22, ac.currentTime + 0.008)

    osc.connect(gainNode)
    gainNode.connect(masterGainRef.current || ac.destination)
    osc.start()

    activeNodesRef.current[midiNote] = { osc, gainNode }
    return freq
  }, [])

  const stopNote = useCallback((midiNote) => {
    const nodes = activeNodesRef.current[midiNote]
    if (!nodes) return
    const ac = ctxRef.current
    const { gainNode, osc } = nodes
    const t = ac.currentTime
    gainNode.gain.setValueAtTime(gainNode.gain.value, t)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    osc.stop(t + 0.26)
    delete activeNodesRef.current[midiNote]
  }, [])

  const stopAll = useCallback(() => {
    Object.keys(activeNodesRef.current).forEach(midi => stopNote(Number(midi)))
  }, [stopNote])

  // Fully-scheduled, self-contained note for the sequencer.
  // Does not touch activeNodesRef — attack + release are baked in.
  const scheduleNote = useCallback((midiNote, tuningKey, a4, waveform = 'triangle', options = {}, startTime, duration = 0.1, velocity = 1, pan = 0) => {
    const ac = getCtx()
    const freq = getFrequency(midiNote, tuningKey, a4, options)

    const osc    = ac.createOscillator()
    const gain   = ac.createGain()
    const panner = ac.createStereoPanner()

    const atk    = 0.008
    const rel    = Math.min(0.05, duration * 0.25)
    const susEnd = startTime + duration - rel
    const peak   = 0.22 * Math.max(0.05, velocity)

    osc.type = waveform
    osc.frequency.setValueAtTime(freq, startTime)
    panner.pan.value = pan

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(peak, startTime + atk)
    if (susEnd > startTime + atk) gain.gain.setValueAtTime(peak, susEnd)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(gain)
    gain.connect(panner)
    panner.connect(masterGainRef.current || ac.destination)
    osc.start(startTime)
    osc.stop(startTime + duration + 0.01)
  }, [])

  // Returns current AudioContext time, creating the context if needed.
  const getAudioTime = useCallback(() => getCtx().currentTime, [])

  // Exposes the raw audio context + master gain for direct synthesis (e.g. drum machine).
  const getAudioNodes = useCallback(() => {
    const ac = getCtx()
    return { ac, master: masterGainRef.current }
  }, [])

  return { playNote, stopNote, stopAll, analyserRef, scheduleNote, getAudioTime, getAudioNodes }
}
