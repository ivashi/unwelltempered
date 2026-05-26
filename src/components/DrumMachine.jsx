import { DRUM_TRACKS } from '../lib/drumSynth'
import './DrumMachine.css'

export default function DrumMachine({
  pattern,
  playing,
  currentStep,
  bpm,
  onPlay,
  onStop,
  onBpmChange,
  onToggleCell,
  onClearTrack,
}) {
  return (
    <div className="drum-machine">
      <div className="drum-controls">
        <button
          className={`drum-play-btn${playing ? ' playing' : ''}`}
          onClick={playing ? onStop : onPlay}
        >
          {playing ? '■' : '▶'}
        </button>

        <div className="drum-bpm-wrap">
          <span className="drum-label">BPM</span>
          <input
            type="range"
            className="drum-bpm-slider"
            min="40"
            max="220"
            step="1"
            value={bpm}
            onChange={e => onBpmChange(Number(e.target.value))}
          />
          <span className="drum-bpm-val">{bpm}</span>
        </div>
      </div>

      <div className="drum-grid">
        {DRUM_TRACKS.map((track, ti) => (
          <div key={track.id} className="drum-row">
            <button
              className="drum-row-label"
              style={{ '--track-color': track.color }}
              onDoubleClick={() => onClearTrack(ti)}
              title={`${track.label} — double-click to clear`}
            >
              {track.label}
            </button>

            <div className="drum-row-steps">
              {pattern[ti].map((on, si) => {
                const isGroup = si % 4 === 0 && si > 0
                return (
                  <button
                    key={si}
                    className={[
                      'drum-cell',
                      on             ? 'is-on'      : '',
                      currentStep === si ? 'is-current' : '',
                      isGroup        ? 'group-gap'  : '',
                    ].filter(Boolean).join(' ')}
                    style={{ '--track-color': track.color }}
                    onClick={() => onToggleCell(ti, si)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
