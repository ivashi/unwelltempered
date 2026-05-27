import { NOTE_NAMES_C, RATIO_PRESETS } from '../lib/ratioPresets'
import './TemperamentLab.css'

const toCents   = (r) => 1200 * Math.log2(r)
const etCents   = (i) => i * 100

function DeviationBar({ dev }) {
  // ±50¢ visual range
  const clipped = Math.min(Math.abs(dev), 50)
  const pct     = clipped / 50 * 50          // percent of bar (bar = 100%, center at 50%)
  const barLeft = dev >= 0 ? 50 : 50 - pct
  const sharp   = dev >= 0

  return (
    <div className="tl-dev-bar">
      <div className="tl-dev-center" />
      <div
        className={`tl-dev-fill ${sharp ? 'sharp' : 'flat'}`}
        style={{ left: `${barLeft}%`, width: `${pct}%` }}
      />
    </div>
  )
}

export default function TemperamentLab({ ratios, onRatioChange, onLoadPreset }) {
  return (
    <div className="temp-lab">

      {/* ── Header ── */}
      <div className="tl-header">
        <div className="tl-header-left">
          <span className="tl-title">RATIO EDITOR</span>
          <span className="tl-subtitle">· each note defined as a frequency ratio from C</span>
        </div>
        <div className="tl-presets">
          {Object.entries(RATIO_PRESETS).map(([key, p]) => (
            <button
              key={key}
              className="tl-preset-btn"
              onClick={() => onLoadPreset(p.ratios)}
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Column labels ── */}
      <div className="tl-col-labels">
        <span className="tl-cl-note">NOTE</span>
        <span className="tl-cl-ratio">RATIO</span>
        <span className="tl-cl-decimal">DECIMAL</span>
        <span className="tl-cl-cents">CENTS</span>
        <span className="tl-cl-dev">Δ FROM 12-TET</span>
      </div>

      {/* ── Rows ── */}
      <div className="tl-rows">
        {ratios.map((r, i) => {
          const decimal = r.num / r.den
          const cents   = toCents(decimal)
          const dev     = cents - etCents(i)
          const isSharp = i.toString().includes('b') || NOTE_NAMES_C[i].includes('#')

          return (
            <div key={i} className={`tl-row${isSharp ? ' accidental' : ''}`}>
              <span className="tl-note">{NOTE_NAMES_C[i]}</span>

              <div className="tl-ratio-inputs">
                <input
                  type="number"
                  className="tl-num"
                  value={r.num}
                  min="1"
                  step="1"
                  onChange={e => onRatioChange(i, Math.max(1, parseInt(e.target.value) || 1), r.den)}
                />
                <span className="tl-slash">/</span>
                <input
                  type="number"
                  className="tl-den"
                  value={r.den}
                  min="1"
                  step="1"
                  onChange={e => onRatioChange(i, r.num, Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <span className="tl-decimal">{decimal.toFixed(5)}</span>

              <span className="tl-cents">{cents.toFixed(1)}</span>

              <div className="tl-dev-wrap">
                <DeviationBar dev={dev} />
                <span className={`tl-dev-val${Math.abs(dev) < 1 ? ' exact' : dev > 0 ? ' sharp' : ' flat'}`}>
                  {dev >= 0 ? '+' : ''}{dev.toFixed(1)}¢
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Legend ── */}
      <div className="tl-legend">
        <span className="tl-legend-item flat">◀ flat (lower than 12-TET)</span>
        <span className="tl-legend-item">· deviation bar range: ±50¢ ·</span>
        <span className="tl-legend-item sharp">sharp (higher than 12-TET) ▶</span>
      </div>

    </div>
  )
}
