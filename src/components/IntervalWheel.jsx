import { useRef, useEffect } from 'react'
import { getFrequency } from '../lib/tunings'
import './IntervalWheel.css'

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

// C at top, clockwise
function noteAngle(i) {
  return -Math.PI / 2 + (i * Math.PI * 2) / 12
}

// Returns 0 (dissonant) → 1 (pure consonant) for a given interval in semitones
function computeConsonance(intervalSemi, tuningKey, a4, equalDivisions, equalOctaveRatio) {
  if (intervalSemi === 0) return 1
  const opts = tuningKey === 'equal' ? { divisions: equalDivisions, octaveRatio: equalOctaveRatio } : {}
  const base = getFrequency(69, tuningKey, a4, opts)
  const note = getFrequency(69 + intervalSemi, tuningKey, a4, opts)
  let ratio = note / base
  while (ratio >= 2) ratio /= 2
  while (ratio < 1) ratio *= 2

  // Simple ratios sorted roughly by consonance
  const targets = [
    [3 / 2,  1.00],  // perfect fifth
    [4 / 3,  0.90],  // perfect fourth
    [5 / 4,  0.85],  // major third
    [6 / 5,  0.80],  // minor third
    [5 / 3,  0.75],  // major sixth
    [8 / 5,  0.70],  // minor sixth
    [7 / 4,  0.55],  // harmonic seventh
    [9 / 8,  0.45],  // major second
    [16 / 9, 0.40],  // minor seventh
    [15 / 8, 0.28],  // major seventh
    [16 / 15, 0.18], // minor second
    [45 / 32, 0.12], // tritone
  ]

  let best = 0
  for (const [target, weight] of targets) {
    const cents = Math.abs(1200 * Math.log2(ratio / target))
    const proximity = Math.max(0, 1 - cents / 22) // 0 at 22+ cents off
    const score = proximity * weight
    if (score > best) best = score
  }
  return best
}

// Consonant (1) → accent blue; Dissonant (0) → warm muted
function consonanceColor(c) {
  const r = Math.round(107 + 40 * c)
  const g = Math.round(104 + 76 * c)
  const b = Math.round(98 + 142 * c)
  return [r, g, b]
}

export default function IntervalWheel({ activeNotes, tuningKey, a4, equalDivisions, equalOctaveRatio }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  // Animated values
  const dotOpacity = useRef(Array(12).fill(0.3))
  const lineState = useRef({}) // "i-j" → { opacity, consonance }

  // Cached consonance for all 12 intervals — recomputed only when tuning changes
  const consonanceCache = useRef(Array(12).fill(0))

  // Live refs for RAF closure
  const activeClassesRef = useRef(new Set())
  const consonanceCacheRef = useRef(consonanceCache.current)

  // Rebuild consonance cache whenever tuning params change
  useEffect(() => {
    const cache = Array.from({ length: 12 }, (_, i) =>
      computeConsonance(i, tuningKey, a4, equalDivisions, equalOctaveRatio)
    )
    consonanceCache.current = cache
    consonanceCacheRef.current = cache
  }, [tuningKey, a4, equalDivisions, equalOctaveRatio])

  // Sync active notes to a ref (chromatic classes only)
  useEffect(() => {
    const s = new Set()
    for (const midi of activeNotes) s.add(midi % 12)
    activeClassesRef.current = s
  }, [activeNotes])

  // Mount-once canvas + RAF loop
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

    function frame() {
      rafRef.current = requestAnimationFrame(frame)
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2
      const size = Math.min(W, H)
      const ringR   = size * 0.32
      const labelR  = ringR + size * 0.09
      const dotR    = size * 0.024
      const active  = activeClassesRef.current
      const cache   = consonanceCacheRef.current

      // ── Dot opacity animation ────────────────────────────────
      for (let i = 0; i < 12; i++) {
        const target = active.has(i) ? 1.0 : 0.28
        dotOpacity.current[i] += (target - dotOpacity.current[i]) * 0.14
      }

      // ── Build active pairs ───────────────────────────────────
      const activeArr = Array.from(active)
      const activePairs = {}
      for (let i = 0; i < activeArr.length; i++) {
        for (let j = i + 1; j < activeArr.length; j++) {
          const a = Math.min(activeArr[i], activeArr[j])
          const b = Math.max(activeArr[i], activeArr[j])
          const interval = b - a
          activePairs[`${a}-${b}`] = cache[interval] ?? 0
        }
      }

      // ── Animate line state ───────────────────────────────────
      const allKeys = new Set([...Object.keys(lineState.current), ...Object.keys(activePairs)])
      for (const key of allKeys) {
        if (!lineState.current[key]) lineState.current[key] = { opacity: 0, consonance: 0 }
        const ls = lineState.current[key]
        const targetOp   = activePairs[key] !== undefined ? 1 : 0
        const targetCons = activePairs[key] ?? ls.consonance
        ls.opacity    += (targetOp   - ls.opacity)    * 0.13
        ls.consonance += (targetCons - ls.consonance) * 0.09
        if (ls.opacity < 0.003 && targetOp === 0) delete lineState.current[key]
      }

      // ── Draw lines ───────────────────────────────────────────
      for (const [key, ls] of Object.entries(lineState.current)) {
        if (ls.opacity < 0.003) continue
        const [ai, bi] = key.split('-').map(Number)
        const x1 = cx + ringR * Math.cos(noteAngle(ai))
        const y1 = cy + ringR * Math.sin(noteAngle(ai))
        const x2 = cx + ringR * Math.cos(noteAngle(bi))
        const y2 = cy + ringR * Math.sin(noteAngle(bi))

        const [cr, cg, cb] = consonanceColor(ls.consonance)
        const alpha = ls.opacity * (0.12 + ls.consonance * 0.88)

        ctx.beginPath()
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx.lineWidth   = (0.5 + ls.consonance * 2.5) * dpr
        ctx.lineCap     = 'round'
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // ── Draw dots & labels ───────────────────────────────────
      for (let i = 0; i < 12; i++) {
        const angle  = noteAngle(i)
        const x      = cx + ringR * Math.cos(angle)
        const y      = cy + ringR * Math.sin(angle)
        const op     = dotOpacity.current[i]
        const isActive = active.has(i)

        // Soft glow behind active notes
        if (isActive && op > 0.1) {
          ctx.beginPath()
          ctx.arc(x, y, dotR * 3 * dpr, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(147,180,240,${op * 0.10})`
          ctx.fill()
        }

        // Dot
        ctx.beginPath()
        ctx.arc(x, y, dotR * (0.75 + op * 0.45) * dpr, 0, Math.PI * 2)
        ctx.fillStyle = isActive
          ? `rgba(147,180,240,${op})`
          : `rgba(168,164,158,${op})`
        ctx.fill()

        // Label
        const lx = cx + labelR * Math.cos(angle)
        const ly = cy + labelR * Math.sin(angle)
        ctx.font         = `${Math.round(10 * dpr)}px "DM Mono", monospace`
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle    = isActive
          ? `rgba(240,237,232,${Math.min(1, op + 0.05)})`
          : `rgba(107,104,98,${op * 0.4 + 0.45})`
        ctx.fillText(NOTES[i], lx, ly)
      }
    }

    frame()
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="interval-wheel">
      <canvas ref={canvasRef} className="interval-wheel-canvas" />
    </div>
  )
}
