import { NOTE_NAMES } from '../lib/tunings'
import { DRUM_TRACKS } from '../lib/drumSynth'
import './Sequencer.css'

function StepCells({ count = 16, children }) {
  return (
    <div className="seq-cells">
      {Array.from({ length: count }, (_, si) => children(si))}
    </div>
  )
}

export default function Sequencer({
  drumPattern,
  melSteps,
  playing,
  currentStep,
  bpm,
  selectedStep,
  trackLevels = [],
  onPlay,
  onStop,
  onBpmChange,
  onToggleDrumCell,
  onClearDrumTrack,
  onMelStepClick,
  onMelStepRightClick,
  onTrackLevelChange,
}) {
  function cellClass(si, extraOn, extraClasses = []) {
    return [
      'seq-cell',
      extraOn             ? 'is-on'      : '',
      currentStep === si  ? 'is-current' : '',
      si % 4 === 0 && si > 0 ? 'group-gap' : '',
      ...extraClasses,
    ].filter(Boolean).join(' ')
  }

  return (
    <div className="sequencer">

      {/* ── Controls ── */}
      <div className="seq-controls">
        <button
          className={`seq-play-btn${playing ? ' playing' : ''}`}
          onClick={playing ? onStop : onPlay}
        >
          {playing ? '■' : '▶'}
        </button>

        <div className="seq-bpm-wrap">
          <span className="seq-ctrl-label">BPM</span>
          <input
            type="range"
            className="seq-slider"
            min="40" max="220" step="1"
            value={bpm}
            onChange={e => onBpmChange(Number(e.target.value))}
          />
          <span className="seq-bpm-val">{bpm}</span>
        </div>

        {selectedStep !== null && (
          <span className="seq-arm-hint">
            step {selectedStep + 1} armed · press a key
          </span>
        )}
      </div>

      {/* ── Drum rows ── */}
      <div className="seq-drum-section">
        {DRUM_TRACKS.map((track, ti) => (
          <div key={track.id} className="seq-row">
            <button
              className="seq-row-label"
              style={{ color: track.color }}
              onDoubleClick={() => onClearDrumTrack(ti)}
              title="double-click to clear"
            >
              {track.label}
            </button>

            <StepCells>
              {si => (
                <button
                  key={si}
                  className={cellClass(si, drumPattern[ti][si])}
                  style={{ '--c': track.color }}
                  onClick={() => onToggleDrumCell(ti, si)}
                />
              )}
            </StepCells>

            {/* Per-track level fader */}
            <div
              className="seq-vol"
              title={`${track.label}: ${Math.round((trackLevels[ti] ?? 1) * 100)}%`}
            >
              <input
                type="range"
                className="seq-vol-slider"
                min="0" max="1" step="0.01"
                value={trackLevels[ti] ?? 1}
                onChange={e => onTrackLevelChange(ti, Number(e.target.value))}
                style={{ '--c': track.color }}
              />
              <span className="seq-vol-val">
                {Math.round((trackLevels[ti] ?? 1) * 100)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="seq-divider" />

      {/* ── Melodic row ── */}
      <div className="seq-row">
        <span className="seq-row-label seq-mel-label">Note</span>

        <StepCells>
          {si => {
            const step = melSteps[si]
            return (
              <button
                key={si}
                className={cellClass(si, step.on, [
                  'seq-mel-cell',
                  selectedStep === si ? 'is-selected' : '',
                ])}
                onClick={() => onMelStepClick(si)}
                onContextMenu={e => { e.preventDefault(); onMelStepRightClick(si) }}
              >
                <span className="seq-mel-note">
                  {NOTE_NAMES[step.midi % 12]}
                </span>
                <span className="seq-mel-oct">
                  {Math.floor(step.midi / 12) - 1}
                </span>
              </button>
            )
          }}
        </StepCells>

        {/* Spacer to align with drum rows that have a vol fader */}
        <div className="seq-vol-spacer" />
      </div>

    </div>
  )
}
