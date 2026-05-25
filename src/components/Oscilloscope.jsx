import { useRef, useEffect } from 'react'
import './Oscilloscope.css'

export default function Oscilloscope({ analyserRef }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      const analyser = analyserRef.current

      if (!analyser) {
        // Draw a dim flat line while no audio context yet
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(147, 180, 240, 0.15)'
        ctx.lineWidth = 1 * dpr
        ctx.moveTo(0, H / 2)
        ctx.lineTo(W, H / 2)
        ctx.stroke()
        return
      }

      const bufferLength = analyser.fftSize
      const dataArray = new Float32Array(bufferLength)
      analyser.getFloatTimeDomainData(dataArray)

      // Find a positive-going zero crossing to stabilise the display
      let startSample = 0
      for (let i = 1; i < bufferLength / 2; i++) {
        if (dataArray[i - 1] < 0 && dataArray[i] >= 0) {
          startSample = i
          break
        }
      }

      // Show roughly half the buffer from that crossing
      const displayLength = Math.floor(bufferLength / 2)

      // Check if there's actual signal
      let maxAmp = 0
      for (let i = startSample; i < startSample + displayLength; i++) {
        const v = Math.abs(dataArray[i] || 0)
        if (v > maxAmp) maxAmp = v
      }

      const hasSignal = maxAmp > 0.005

      // Faint center line always present
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(147, 180, 240, 0.08)'
      ctx.lineWidth = 1 * dpr
      ctx.moveTo(0, H / 2)
      ctx.lineTo(W, H / 2)
      ctx.stroke()

      // Waveform
      ctx.beginPath()
      ctx.strokeStyle = hasSignal ? '#93b4f0' : 'rgba(147, 180, 240, 0.2)'
      ctx.lineWidth = 1.5 * dpr
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      const sliceWidth = W / displayLength
      let x = 0
      for (let i = 0; i < displayLength; i++) {
        const v = dataArray[startSample + i] || 0
        const y = ((1 - v) / 2) * H
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.stroke()
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [analyserRef])

  return (
    <div className="oscilloscope">
      <canvas ref={canvasRef} className="oscilloscope-canvas" />
    </div>
  )
}
