import { useState, useRef, useCallback, useEffect } from 'react'

const MAX_MS = 10000

export function useLooper({ playNote, stopNote, stopAll, tuningKey, a4, waveform }) {
  const [status, setStatus] = useState('idle')
  const [loopDuration, setLoopDuration] = useState(0)
  const [recordElapsed, setRecordElapsed] = useState(0)
  const [hasLoop, setHasLoop] = useState(false)

  const eventsRef = useRef([])
  const savedEventsRef = useRef([])
  const savedDurationRef = useRef(0)
  const recordStartRef = useRef(null)
  const tickRef = useRef(null)
  const timeoutsRef = useRef([])
  const statusRef = useRef('idle')

  // Use refs so loop playback always uses current settings without needing to re-schedule
  const tuningKeyRef = useRef(tuningKey)
  const a4Ref = useRef(a4)
  const waveformRef = useRef(waveform)
  useEffect(() => { tuningKeyRef.current = tuningKey }, [tuningKey])
  useEffect(() => { a4Ref.current = a4 }, [a4])
  useEffect(() => { waveformRef.current = waveform }, [waveform])

  const stopRecording = useCallback(() => {
    if (statusRef.current !== 'recording') return
    clearInterval(tickRef.current)
    const duration = Math.min(performance.now() - recordStartRef.current, MAX_MS)
    stopAll()
    savedEventsRef.current = [...eventsRef.current]
    savedDurationRef.current = duration
    setLoopDuration(duration)
    setRecordElapsed(0)
    setHasLoop(eventsRef.current.length > 0)
    statusRef.current = 'idle'
    setStatus('idle')
  }, [stopAll])

  const startRecording = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    stopAll()
    eventsRef.current = []
    recordStartRef.current = performance.now()
    setRecordElapsed(0)
    statusRef.current = 'recording'
    setStatus('recording')

    tickRef.current = setInterval(() => {
      const elapsed = performance.now() - recordStartRef.current
      if (elapsed >= MAX_MS) {
        stopRecording()
      } else {
        setRecordElapsed(elapsed)
      }
    }, 50)
  }, [stopAll, stopRecording])

  const recordEvent = useCallback((type, midi) => {
    if (statusRef.current !== 'recording') return
    const t = performance.now() - recordStartRef.current
    if (t > MAX_MS) return
    eventsRef.current.push({ type, midi, t })
  }, [])

  const stopPlaying = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    stopAll()
    statusRef.current = 'idle'
    setStatus('idle')
  }, [stopAll])

  const startPlaying = useCallback(() => {
    if (!savedEventsRef.current.length) return
    statusRef.current = 'playing'
    setStatus('playing')

    function scheduleIteration() {
      savedEventsRef.current.forEach(({ type, midi, t }) => {
        const id = setTimeout(() => {
          if (statusRef.current !== 'playing') return
          if (type === 'on') playNote(midi, tuningKeyRef.current, a4Ref.current, waveformRef.current)
          else stopNote(midi)
        }, t)
        timeoutsRef.current.push(id)
      })

      const id = setTimeout(() => {
        if (statusRef.current !== 'playing') return
        stopAll()
        timeoutsRef.current = []
        scheduleIteration()
      }, savedDurationRef.current)
      timeoutsRef.current.push(id)
    }

    scheduleIteration()
  }, [playNote, stopNote, stopAll])

  useEffect(() => () => {
    clearInterval(tickRef.current)
    timeoutsRef.current.forEach(clearTimeout)
  }, [])

  return { status, loopDuration, recordElapsed, hasLoop, startRecording, stopRecording, startPlaying, stopPlaying, recordEvent }
}
