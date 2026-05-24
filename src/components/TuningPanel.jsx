import { TUNINGS, TUNING_GROUPS } from '../lib/tunings'
import './TuningPanel.css'

export default function TuningPanel({ currentTuning, onChange }) {
  return (
    <div className="tuning-panel">
      {TUNING_GROUPS.map(group => (
        <div key={group.label} className="tuning-group">
          <div className="tuning-group-label">{group.label}</div>
          <div className="tuning-group-items">
            {group.keys.map(key => {
              const t = TUNINGS[key]
              const isActive = currentTuning === key
              return (
                <button
                  key={key}
                  className={`tuning-btn${isActive ? ' active' : ''}`}
                  onClick={() => onChange(key)}
                >
                  <span className="tuning-btn-name">{t.name}</span>
                  <span className="tuning-btn-era">{t.era}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
