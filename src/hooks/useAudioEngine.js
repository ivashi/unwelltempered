import { useRef, useCallback } from 'react'
import { getFrequency } from '../lib/tunings'

export function useAudioEngine() {
  const ctxRef = useRef(null)
  const activeNodesRef = useRef({})

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }

  const playNote = useCallback((midiNote, tuningKey, a4, waveform = 'triangle') => {
    if (activeNodesRef.current[midiNote]) return
    const ac = getCtx()
    const freq = getFrequency(midiNote, tuningKey, a4)

    const osc = ac.createOscillator()
    const gainNode = ac.createGain()

    // Slight attack to avoid clicks
    osc.type = waveform
    osc.frequency.setValueAtTime(freq, ac.currentTime)

    gainNode.gain.setValueAtTime(0, ac.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.22, ac.currentTime + 0.008)

    osc.connect(gainNode)
    gainNode.connect(ac.destination)
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

  return { playNote, stopNote, stopAll }
}
