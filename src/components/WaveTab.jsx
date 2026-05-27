import { useRef, useEffect, useState, useCallback } from 'react'
import Keyboard from './Keyboard'
import './WaveTab.css'

const N_SAMPLES   = 256
const N_HARMONICS = 16

// Overtone series note names, assuming C fundamental
const OVERTONE_NOTES = [
  '', 'C', 'C', 'G', 'C', 'E', 'G', 'B♭', 'C', 'D', 'E', 'F♯', 'G', 'A♭', 'B♭', 'B', 'C',
]

function makeSamples(fn) {
  return Float32Array.from({ length: N_SAMPLES }, (_, i) => fn(i, N_SAMPLES))
}

// Build a waveform from harmonic sine amplitudes, normalized to [-1, 1]
function makeHarmonicWave(amps) {
  const s = makeSamples((i, N) => {
    let v = 0
    for (let k = 0; k < amps.length; k++) {
      v += amps[k] * Math.sin(2 * Math.PI * (k + 1) * i / N)
    }
    return v
  })
  const peak = Math.max(...s.map(Math.abs), 0.001)
  return s.map(v => v / peak)
}

const PRESETS = {
  sine:     makeSamples((i, N) => Math.sin(2 * Math.PI * i / N)),
  square:   makeSamples((i, N) => i < N / 2 ? 1 : -1),
  sawtooth: makeSamples((i, N) => 2 * i / N - 1),
  triangle: makeSamples((i, N) => { const t = i / N; return t < 0.5 ? 4*t - 1 : 3 - 4*t }),
  // Instrument approximations via harmonic series
  violin:   makeHarmonicWave([1.0, 0.50, 0.35, 0.40, 0.20, 0.12, 0.07, 0.05, 0.03]),
  trumpet:  makeHarmonicWave([1.0, 0.82, 0.90, 0.70, 0.55, 0.42, 0.30, 0.20, 0.12, 0.07, 0.04]),
  clarinet: makeHarmonicWave([1.0, 0.08, 0.80, 0.06, 0.48, 0.04, 0.28, 0.04, 0.16, 0.03, 0.08]),
  organ:    makeHarmonicWave([1.0, 0.55, 0.22, 0.08, 0.04, 0.02]),
}

const PRESET_GROUPS = [
  { label: 'WAVE', names: ['sine', 'square', 'sawtooth', 'triangle'] },
  { label: 'INSTRUMENT', names: ['violin', 'trumpet', 'clarinet', 'organ'] },
]

function computeCoeffs(samples) {
  const N = samples.length
  const real = new Float32Array(N_HARMONICS + 1)
  const imag  = new Float32Array(N_HARMONICS + 1)

  let dc = 0
  for (let n = 0; n < N; n++) dc += samples[n]
  real[0] = dc / N

  for (let k = 1; k <= N_HARMONICS; k++) {
    let a = 0, b = 0
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N
      a += samples[n] * Math.cos(angle)
      b += samples[n] * Math.sin(angle)
    }
    real[k] = (2 / N) * a
    imag[k]  = (2 / N) * b
  }
  return { real, imag }
}

function reconstruct(real, imag, N) {
  const out = new Float32Array(N)
  for (let n = 0; n < N; n++) {
    let v = real[0]
    for (let k = 1; k < real.length; k++) {
      const angle = (2 * Math.PI * k * n) / N
      v += real[k] * Math.cos(angle) + imag[k] * Math.sin(angle)
    }
    out[n] = v
  }
  return out
}

function drawCanvas(canvas, samples, coeffs) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
  for (let i = 1; i < 4; i++) {
    const x = (i / 4) * W
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  const y1 = H * 0.1, yn1 = H * 0.9
  ctx.beginPath(); ctx.moveTo(0, y1);  ctx.lineTo(W, y1);  ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, yn1); ctx.lineTo(W, yn1); ctx.stroke()

  function toY(v) { return H / 2 - v * (H * 0.42) }
  function toX(i) { return (i / (N_SAMPLES - 1)) * W }

  // Drawn waveform
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < N_SAMPLES; i++) {
    i === 0 ? ctx.moveTo(toX(i), toY(samples[i])) : ctx.lineTo(toX(i), toY(samples[i]))
  }
  ctx.stroke()

  // Reconstructed (band-limited)
  const rec = reconstruct(coeffs.real, coeffs.imag, N_SAMPLES)
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(147,180,240,0.85)'
  ctx.lineWidth = 2
  for (let i = 0; i < N_SAMPLES; i++) {
    i === 0 ? ctx.moveTo(toX(i), toY(rec[i])) : ctx.lineTo(toX(i), toY(rec[i]))
  }
  ctx.stroke()
}

export default function WaveTab({ onWaveChange, onNoteOn, onNoteOff, activeNotes, baseOctave, setBaseOctave }) {
  const canvasRef   = useRef(null)
  const samplesRef  = useRef(new Float32Array(PRESETS.sine))
  const drawingRef  = useRef(false)
  const lastXRef    = useRef(null)
  const lastYRef    = useRef(null)

  const [coeffs, setCoeffs] = useState(() => computeCoeffs(samplesRef.current))
  const [activePreset, setActivePreset] = useState('sine')

  useEffect(() => {
    onWaveChange(coeffs.real, coeffs.imag)
  }, [coeffs, onWaveChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCanvas(canvas, samplesRef.current, coeffs)
  }, [coeffs])

  useEffect(() => {
    const canvas = canvasRef.current
    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width  = rect.width
      canvas.height = rect.height
      drawCanvas(canvas, samplesRef.current, coeffs)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    resize()
    return () => ro.disconnect()
  }, [coeffs])

  function applyPreset(name) {
    const s = new Float32Array(PRESETS[name])
    samplesRef.current = s
    const c = computeCoeffs(s)
    setCoeffs(c)
    setActivePreset(name)
  }

  function commitDraw() {
    const c = computeCoeffs(samplesRef.current)
    setCoeffs(c)
    setActivePreset(null)
  }

  function getSamplePos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top)  / rect.height
    const idx = Math.round(x * (N_SAMPLES - 1))
    const val = -(y * 2 - 1) / 0.84
    return { idx: Math.max(0, Math.min(N_SAMPLES - 1, idx)), val: Math.max(-1, Math.min(1, val)) }
  }

  function handlePointerDown(e) {
    drawingRef.current = true
    canvasRef.current.setPointerCapture(e.pointerId)
    const { idx, val } = getSamplePos(e)
    samplesRef.current[idx] = val
    lastXRef.current = idx
    lastYRef.current = val
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return
    const { idx, val } = getSamplePos(e)
    const x0 = lastXRef.current, y0 = lastYRef.current
    const steps = Math.abs(idx - x0) + 1
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps
      const si = Math.round(x0 + (idx - x0) * t)
      const sv = y0 + (val - y0) * t
      if (si >= 0 && si < N_SAMPLES) samplesRef.current[si] = sv
    }
    lastXRef.current = idx
    lastYRef.current = val
    drawCanvas(canvasRef.current, samplesRef.current, coeffs)
  }

  function handlePointerUp() {
    if (!drawingRef.current) return
    drawingRef.current = false
    commitDraw()
  }

  const magnitudes = Array.from({ length: N_HARMONICS }, (_, i) => {
    const k = i + 1
    return Math.hypot(coeffs.real[k], coeffs.imag[k])
  })
  const maxMag = Math.max(...magnitudes, 0.001)

  return (
    <div className="wave-tab">

      <div className="wave-designer">

        <div className="wave-left">
          <div className="wave-section-label">Draw a waveform — one full cycle</div>
          <div className="wave-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="wave-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
            <div className="wave-canvas-legend">
              <span>drawn</span>
              <span className="wave-canvas-legend-accent">band-limited (what plays)</span>
            </div>
          </div>
          <div className="wave-preset-section">
            {PRESET_GROUPS.map(group => (
              <div key={group.label} className="wave-preset-group">
                <span className="wave-preset-group-label">{group.label}</span>
                <div className="wave-presets">
                  {group.names.map(name => (
                    <button
                      key={name}
                      className={`wave-preset-btn${activePreset === name ? ' active' : ''}`}
                      onClick={() => applyPreset(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wave-right">
          <div className="wave-section-label">Harmonic content</div>
          <div className="wave-section-sub">
            Each bar is an overtone. Together they form the overtone series — the same ratios that underpin just intonation.
          </div>
          <div className="harmonics-list">
            {magnitudes.map((mag, i) => {
              const k = i + 1
              const pct = (mag / maxMag) * 100
              return (
                <div key={k} className="harmonic-row">
                  <span className="harmonic-num">{k}</span>
                  <div className="harmonic-bar-wrap">
                    <div
                      className="harmonic-bar"
                      style={{ width: `${pct}%`, opacity: 0.3 + pct / 100 * 0.7 }}
                    />
                  </div>
                  <span className="harmonic-note">{OVERTONE_NOTES[k]}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <div className="wave-keyboard-area">
        <div className="wave-kb-controls">
          <div className="control-chip">
            <label className="control-label">Octave</label>
            <div className="octave-stepper">
              <button className="oct-btn" onClick={() => setBaseOctave(o => Math.max(1, o - 1))}>−</button>
              <span className="oct-val">{baseOctave}</span>
              <button className="oct-btn" onClick={() => setBaseOctave(o => Math.min(7, o + 1))}>+</button>
            </div>
          </div>
        </div>
        <div className="keyboard-container">
          <Keyboard baseOctave={baseOctave} activeNotes={activeNotes} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
        </div>
      </div>

    </div>
  )
}
