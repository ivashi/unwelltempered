import { NOTE_NAMES, TUNINGS, getCentDeviation } from '../lib/tunings'
import './CentsDisplay.css'

export default function CentsDisplay({ tuningKey }) {
  const t = TUNINGS[tuningKey]

  if (tuningKey === 'equal') {
    return (
      <div className="cents-display cents-display--equal">
        <span className="cents-equal-label">All notes at 0¢ deviation — this is the reference tuning</span>
      </div>
    )
  }

  if (t.stepsPerOctave) {
    const stepSize = (1200 / t.stepsPerOctave).toFixed(3)
    return (
      <div className="cents-display cents-display--microtonal">
        <div className="cents-micro-stat">
          <span className="cents-micro-val">{t.stepsPerOctave}</span>
          <span className="cents-micro-label">divisions / octave</span>
        </div>
        <div className="cents-micro-stat">
          <span className="cents-micro-val">{stepSize}¢</span>
          <span className="cents-micro-label">step size</span>
        </div>
        <div className="cents-micro-stat">
          <span className="cents-micro-val">{(1200 - 1200 / t.stepsPerOctave * t.semitoneMapping[7]).toFixed(1)}¢</span>
          <span className="cents-micro-label">fifth vs pure</span>
        </div>
      </div>
    )
  }

  return (
    <div className="cents-display">
      {NOTE_NAMES.map((name, i) => {
        const cents = getCentDeviation(i, tuningKey)
        const abs = Math.abs(cents)
        const pct = Math.min(abs / 25, 1)
        const color = abs > 15 ? '#ef4444' : abs > 8 ? '#f97316' : abs > 3 ? '#eab308' : '#22c55e'
        const sign = cents >= 0 ? '+' : ''
        return (
          <div key={name} className="cents-note">
            <div className="cents-note-name">{name}</div>
            <div className="cents-bar-wrap">
              <div
                className="cents-bar"
                style={{
                  width: `${pct * 100}%`,
                  background: color,
                  marginLeft: cents < 0 ? 'auto' : 0,
                }}
              />
            </div>
            <div className="cents-value" style={{ color }}>
              {sign}{cents.toFixed(1)}¢
            </div>
          </div>
        )
      })}
    </div>
  )
}
