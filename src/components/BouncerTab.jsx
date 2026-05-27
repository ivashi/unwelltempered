import { useRef, useEffect, useState } from 'react'
import './BouncerTab.css'

const CIRCLE_NOTES = [
  { name: 'C',  semi: 0  },
  { name: 'G',  semi: 7  },
  { name: 'D',  semi: 2  },
  { name: 'A',  semi: 9  },
  { name: 'E',  semi: 4  },
  { name: 'B',  semi: 11 },
  { name: 'F#', semi: 6  },
  { name: 'D♭', semi: 1  },
  { name: 'A♭', semi: 8  },
  { name: 'E♭', semi: 3  },
  { name: 'B♭', semi: 10 },
  { name: 'F',  semi: 5  },
]

const ALL_12 = new Set([0,1,2,3,4,5,6,7,8,9,10,11])
const MIN_NOTES = 3

const AUTO_SPEEDS  = [0.012, 0.028, 0.064]
const SPEED_LABELS = ['SLOW', 'MED', 'FAST']

const RESTITUTION   = 1.0
const LAUNCH_SPEED  = 5
const BALL_RADIUS   = 9
const SPIN_FRICTION = 0.968
const MAX_BALLS     = 8
const NOTE_OFF_MS   = 240
const HIT_FRAMES    = 20
const MAX_SPEED     = 18
const MIDI_BASE     = 60
const SUBSTEPS      = 3   // physics substeps per frame — prevents tunneling at high speed

// Regular n-gon vertices
function vertices(cx, cy, R, rot, n) {
  const v = []
  for (let i = 0; i < n; i++) {
    const a = rot + i * (Math.PI * 2 / n)
    v.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) })
  }
  return v
}

function collide(ball, verts, cx, cy, angVel, glows, activeList, onHit) {
  const n = activeList.length
  for (let i = 0; i < n; i++) {
    const a = verts[i], b = verts[(i + 1) % n]
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    const ux = dx / len, uy = dy / len

    let nx = -uy, ny = ux
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
    if (nx * (cx - mx) + ny * (cy - my) < 0) { nx = -nx; ny = -ny }

    const t = Math.max(0, Math.min(len, (ball.x - a.x) * ux + (ball.y - a.y) * uy))
    const px = a.x + t * ux, py = a.y + t * uy
    const distX = ball.x - px, distY = ball.y - py
    const dist = Math.hypot(distX, distY)

    if (dist < BALL_RADIUS) {
      ball.x += (dist > 0.001 ? distX / dist : nx) * (BALL_RADIUS - dist)
      ball.y += (dist > 0.001 ? distY / dist : ny) * (BALL_RADIUS - dist)

      const rx = px - cx, ry = py - cy
      const rvx = ball.vx - (-angVel * ry)
      const rvy = ball.vy - ( angVel * rx)
      const vn = rvx * nx + rvy * ny

      if (vn < -0.05) {
        ball.vx -= (1 + RESTITUTION) * vn * nx
        ball.vy -= (1 + RESTITUTION) * vn * ny
        const speed = Math.hypot(ball.vx, ball.vy)
        if (speed > MAX_SPEED) { ball.vx = ball.vx / speed * MAX_SPEED; ball.vy = ball.vy / speed * MAX_SPEED }

        const origIdx = activeList[i].origIdx
        if (glows[origIdx] === 0) { onHit(i, origIdx); glows[origIdx] = HIT_FRAMES }
      }
    }
  }
}

function drawScene(ctx, W, H, s, activeList) {
  ctx.clearRect(0, 0, W, H)
  const { cx, cy, R, rotation, balls, glows, hitLabel } = s
  const n = activeList.length
  const verts = vertices(cx, cy, R, rotation, n)

  for (let i = 0; i < n; i++) {
    const a = verts[i], b = verts[(i + 1) % n]
    const origIdx = activeList[i].origIdx
    const g = glows[origIdx] / HIT_FRAMES

    if (g > 0) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = `rgba(147,180,240,${g * 0.22})`
      ctx.lineWidth = 16; ctx.stroke()
    }

    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
    ctx.strokeStyle = g > 0 ? `rgba(147,180,240,${0.3 + g * 0.7})` : 'rgba(255,255,255,0.13)'
    ctx.lineWidth = g > 0 ? 2 + g * 1.5 : 1.5
    ctx.stroke()

    const wmx = (a.x + b.x) / 2, wmy = (a.y + b.y) / 2
    let angle = Math.atan2(b.y - a.y, b.x - a.x)
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI
    ctx.save()
    ctx.translate(wmx, wmy); ctx.rotate(angle)
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = `${g > 0.2 ? '500' : '400'} 10px "DM Mono", monospace`
    ctx.fillStyle = g > 0 ? `rgba(147,180,240,${0.55 + g * 0.45})` : 'rgba(255,255,255,0.32)'
    ctx.fillText(activeList[i].name, 0, -9)
    ctx.restore()
  }

  if (hitLabel && hitLabel.frames > 0) {
    const alpha = Math.min(1, hitLabel.frames / 8) * (hitLabel.frames / HIT_FRAMES)
    ctx.save()
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = `400 36px "Bebas Neue", sans-serif`
    ctx.fillStyle = `rgba(147,180,240,${alpha})`
    ctx.fillText(hitLabel.name, cx, cy)
    ctx.restore()
  }

  for (const ball of balls) {
    const grad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS * 3.5)
    grad.addColorStop(0, 'rgba(240,237,232,0.16)')
    grad.addColorStop(1, 'rgba(240,237,232,0)')
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS * 3.5, 0, Math.PI * 2)
    ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#f0ede8'; ctx.fill()
  }

  if (balls.length === 0) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = '10px "DM Mono", monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.13)'
    ctx.fillText('CLICK TO LAUNCH  ·  DRAG TO SPIN', cx, cy)
  }
}

function buildActiveList(enabledSet) {
  return CIRCLE_NOTES
    .map((note, i) => ({ ...note, origIdx: i }))
    .filter(n => enabledSet.has(n.origIdx))
}

export default function BouncerTab({ onNoteOn, onNoteOff }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({
    balls: [],
    rotation: -Math.PI / 2 + Math.PI / 12,
    angularVel: 0,
    autoRotate: false,
    autoSpeed: AUTO_SPEEDS[1],
    sizeScale: 0.40,
    enabledNotes: new Set(ALL_12),
    glows: new Array(12).fill(0),
    hitLabel: null,
    cx: 0, cy: 0, R: 0,
    drag: null, isDragging: false, dragStartX: 0, dragStartY: 0,
  })
  const cbRef = useRef({ onNoteOn, onNoteOff })
  useEffect(() => { cbRef.current = { onNoteOn, onNoteOff } }, [onNoteOn, onNoteOff])

  const [autoRotate,   setAutoRotate]   = useState(false)
  const [speedIdx,     setSpeedIdx]     = useState(1)
  const [sizeScale,    setSizeScale]    = useState(0.40)
  const [ballCount,    setBallCount]    = useState(0)
  const [enabledNotes, setEnabledNotes] = useState(() => new Set(ALL_12))

  useEffect(() => { stateRef.current.autoRotate = autoRotate }, [autoRotate])
  useEffect(() => { stateRef.current.autoSpeed  = AUTO_SPEEDS[speedIdx] }, [speedIdx])
  useEffect(() => { stateRef.current.sizeScale  = sizeScale }, [sizeScale])

  function setEnabled(next) {
    stateRef.current.enabledNotes = next
    setEnabledNotes(new Set(next))
  }

  function toggleNote(i) {
    const cur = stateRef.current.enabledNotes
    const next = new Set(cur)
    if (next.has(i) && next.size > MIN_NOTES) next.delete(i)
    else next.add(i)
    setEnabled(next)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const s = stateRef.current
    let animId

    function resize() {
      const p = canvas.parentElement
      canvas.width  = p.clientWidth
      canvas.height = p.clientHeight
      s.cx = canvas.width / 2
      s.cy = canvas.height / 2
      s.R  = Math.min(canvas.width, canvas.height) * 0.40
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    resize()

    function loop() {
      if (s.autoRotate) s.rotation += s.autoSpeed
      s.angularVel = Math.max(-0.09, Math.min(0.09, s.angularVel * SPIN_FRICTION))
      s.rotation  += s.angularVel
      s.glows      = s.glows.map(g => Math.max(0, g - 1))
      if (s.hitLabel) s.hitLabel.frames = Math.max(0, s.hitLabel.frames - 1)

      const activeList = buildActiveList(s.enabledNotes)
      const effectiveAngVel = s.angularVel + (s.autoRotate ? s.autoSpeed : 0)
      s.R = Math.min(canvas.width, canvas.height) * s.sizeScale
      const verts = vertices(s.cx, s.cy, s.R, s.rotation, activeList.length)

      for (const ball of s.balls) {
        // Sub-stepped integration: advance vx/SUBSTEPS each check so a fast ball
        // can never travel more than one ball-radius between collision checks.
        for (let step = 0; step < SUBSTEPS; step++) {
          ball.x += ball.vx / SUBSTEPS
          ball.y += ball.vy / SUBSTEPS
          collide(ball, verts, s.cx, s.cy, effectiveAngVel, s.glows, activeList, (wallIdx, origIdx) => {
            const note = activeList[wallIdx]
            cbRef.current.onNoteOn(MIDI_BASE + note.semi)
            setTimeout(() => cbRef.current.onNoteOff(MIDI_BASE + note.semi), NOTE_OFF_MS)
            s.hitLabel = { name: note.name, frames: HIT_FRAMES }
          })
        }

        // Containment fallback: if the ball somehow escaped past the circumscribed
        // circle, snap it back inside and reflect its velocity inward.
        const ex = ball.x - s.cx, ey = ball.y - s.cy
        const ed = Math.hypot(ex, ey)
        if (ed > s.R) {
          const nx = ex / ed, ny = ey / ed
          ball.x = s.cx + nx * (s.R - BALL_RADIUS)
          ball.y = s.cy + ny * (s.R - BALL_RADIUS)
          const vn = ball.vx * nx + ball.vy * ny
          if (vn > 0) { ball.vx -= 2 * vn * nx; ball.vy -= 2 * vn * ny }
        }
      }

      setBallCount(s.balls.length)
      drawScene(canvas.getContext('2d'), canvas.width, canvas.height, s, activeList)
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [])

  function pos(e) {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function handlePointerDown(e) {
    const { x, y } = pos(e)
    const s = stateRef.current
    s.drag = { lastAngle: Math.atan2(y - s.cy, x - s.cx), lastTime: performance.now() }
    s.isDragging = false; s.dragStartX = x; s.dragStartY = y
    canvasRef.current.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    const s = stateRef.current
    if (!s.drag) return
    const { x, y } = pos(e)
    if (!s.isDragging && Math.hypot(x - s.dragStartX, y - s.dragStartY) > 5) s.isDragging = true
    if (s.isDragging) {
      const angle = Math.atan2(y - s.cy, x - s.cx)
      let delta = angle - s.drag.lastAngle
      if (delta >  Math.PI) delta -= Math.PI * 2
      if (delta < -Math.PI) delta += Math.PI * 2
      const dt = Math.max(1, performance.now() - s.drag.lastTime)
      s.angularVel = delta * (16 / dt)
      s.rotation  += delta
      s.drag.lastAngle = angle
      s.drag.lastTime  = performance.now()
    }
  }

  function handlePointerUp(e) {
    const s = stateRef.current
    if (!s.drag) return
    if (!s.isDragging) {
      const { x, y } = pos(e)
      if (s.balls.length >= MAX_BALLS) s.balls = []
      const angle = Math.random() * Math.PI * 2
      s.balls.push({ x, y, vx: Math.cos(angle) * LAUNCH_SPEED, vy: Math.sin(angle) * LAUNCH_SPEED })
    }
    s.drag = null
  }

  function clearBalls() { stateRef.current.balls = []; setBallCount(0) }

  return (
    <div className="bouncer-wrap">
      <canvas
        ref={canvasRef}
        className="bouncer-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      <div className="bouncer-controls">
        <button
          className={`bouncer-btn${autoRotate ? ' active' : ''}`}
          onClick={() => setAutoRotate(v => !v)}
        >
          <span className={`bouncer-btn-dot${autoRotate ? ' spinning' : ''}`} />
          AUTO ROTATE
        </button>
        <div className="bouncer-speed-group">
          {SPEED_LABELS.map((label, i) => (
            <button
              key={i}
              className={`bouncer-speed-btn${speedIdx === i ? ' active' : ''}`}
              onClick={() => setSpeedIdx(i)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bouncer-divider" />

        <div className="bouncer-size-control">
          <span className="bouncer-stat">SIZE</span>
          <input
            type="range"
            className="bouncer-slider"
            min="0.15" max="0.62" step="0.01"
            value={sizeScale}
            onChange={e => setSizeScale(Number(e.target.value))}
          />
        </div>

        <div className="bouncer-divider" />

        <div className="bouncer-note-toggles">
          {CIRCLE_NOTES.map((note, i) => (
            <button
              key={i}
              className={`bouncer-note-btn${enabledNotes.has(i) ? ' active' : ''}`}
              onClick={() => toggleNote(i)}
            >
              {note.name}
            </button>
          ))}
        </div>
        <button className="bouncer-btn" onClick={() => setEnabled(new Set(ALL_12))}>ALL</button>
        <button className="bouncer-btn" onClick={() => setEnabled(new Set([0, 4, 8]))}>TRI</button>

        <div className="bouncer-divider" />

        <span className="bouncer-stat">{ballCount}/{MAX_BALLS}</span>
        <button className="bouncer-btn" onClick={clearBalls}>CLEAR</button>
      </div>
    </div>
  )
}
