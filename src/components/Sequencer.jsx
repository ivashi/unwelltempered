import { NOTE_NAMES } from '../lib/tunings'
import { DRUM_TRACKS } from '../lib/drumSynth'
import './Sequencer.css'

const MEL_LENGTHS = [1, 2, 4, 8]

function panLabel(v) {
  if (Math.abs(v) < 0.02) return 'C'
  const pct = Math.round(Math.abs(v) * 100)
  return v < 0 ? `L${pct}` : `R${pct}`
}

function StepCells({ count = 16, children }) {
  return (
    <div className="seq-cells">
      {Array.from({ length: count }, (_, si) => children(si))}
    </div>
  )
}

// Shared gap class helper
function gapClass(si) { return si % 4 === 0 && si > 0 ? ' group-gap' : '' }

export default function Sequencer({
  drumPattern,
  melSteps,
  playing,
  currentStep,
  bpm,
  selectedStep,
  trackLevels = [],
  trackPans   = [],
  trackMutes  = [],
  onPlay,
  onStop,
  onBpmChange,
  onToggleDrumCell,
  onClearDrumTrack,
  onMelStepClick,
  onMelStepRightClick,
  onTrackLevelChange,
  onTrackPanChange,
  onToggleMute,
  onSetMelVelocity,
  onSetMelPan,
  onCycleMelLength,
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

      {/* ── Transport ── */}
      <div className="seq-controls">
        <button
          className={`seq-play-btn${playing ? ' playing' : ''}`}
          onClick={playing ? onStop : onPlay}
        >
          {playing ? '■' : '▶'}
        </button>
        <div className="seq-bpm-wrap">
          <span className="seq-ctrl-label">BPM</span>
          <input type="range" className="seq-slider" min="40" max="220" step="1"
            value={bpm} onChange={e => onBpmChange(Number(e.target.value))} />
          <span className="seq-bpm-val">{bpm}</span>
        </div>
        {selectedStep !== null && (
          <span className="seq-arm-hint">step {selectedStep + 1} armed · press a key</span>
        )}
      </div>

      {/* ── Drum rows ── */}
      <div className="seq-drum-section">
        {DRUM_TRACKS.map((track, ti) => {
          const muted = trackMutes[ti] ?? false
          const level = trackLevels[ti] ?? 1
          const pan   = trackPans[ti]   ?? 0
          return (
            <div key={track.id} className={`seq-row${muted ? ' is-muted' : ''}`}>
              <div className="seq-channel-strip" style={{ '--track-c': track.color }}>
                <div className="seq-strip-top">
                  <button className="seq-strip-name" style={{ color: track.color }}
                    onDoubleClick={() => onClearDrumTrack(ti)} title="double-click to clear">
                    {track.label}
                  </button>
                  <button className={`seq-mute-btn${muted ? ' muted' : ''}`}
                    onClick={() => onToggleMute(ti)} title={muted ? 'unmute' : 'mute'}>
                    M
                  </button>
                </div>
                <div className="seq-fader-row">
                  <span className="seq-fader-lbl">VOL</span>
                  <input type="range" className="seq-fader" min="0" max="1" step="0.01"
                    value={level} onChange={e => onTrackLevelChange(ti, Number(e.target.value))}
                    style={{ '--c': track.color }} />
                  <span className="seq-fader-val">{Math.round(level * 100)}</span>
                </div>
                <div className="seq-fader-row">
                  <span className="seq-fader-lbl">PAN</span>
                  <input type="range" className="seq-fader seq-fader-pan" min="-1" max="1" step="0.02"
                    value={pan} onChange={e => onTrackPanChange(ti, Number(e.target.value))} />
                  <span className="seq-fader-val">{panLabel(pan)}</span>
                </div>
              </div>
              <StepCells>
                {si => (
                  <button key={si}
                    className={cellClass(si, drumPattern[ti][si])}
                    style={{ '--c': track.color }}
                    onClick={() => onToggleDrumCell(ti, si)} />
                )}
              </StepCells>
            </div>
          )
        })}
      </div>

      {/* ── Divider ── */}
      <div className="seq-divider" />

      {/* ── Melodic: note row ── */}
      <div className="seq-row">
        <div className="seq-channel-strip seq-mel-strip">
          <span className="seq-mel-label">NOTE</span>
        </div>
        <StepCells>
          {si => {
            const step = melSteps[si]
            return (
              <button key={si}
                className={cellClass(si, step.on, ['seq-mel-cell', selectedStep === si ? 'is-selected' : ''])}
                onClick={() => onMelStepClick(si)}
                onContextMenu={e => { e.preventDefault(); onMelStepRightClick(si) }}
              >
                <span className="seq-mel-note">{NOTE_NAMES[step.midi % 12]}</span>
                <span className="seq-mel-oct">{Math.floor(step.midi / 12) - 1}</span>
              </button>
            )
          }}
        </StepCells>
      </div>

      {/* ── Melodic: velocity lane ── */}
      <div className="seq-row seq-lane-row">
        <div className="seq-channel-strip seq-mel-strip">
          <span className="seq-mel-label">VEL</span>
        </div>
        <div className="seq-vel-lane">
          {melSteps.map((step, si) => (
            <div
              key={si}
              className={`vel-bar-wrap${gapClass(si)}${currentStep === si ? ' is-current' : ''}${!step.on ? ' is-off' : ''}`}
              title={`velocity: ${Math.round((step.velocity ?? 0.8) * 100)}%`}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const ratio = 1 - (e.clientY - rect.top) / rect.height
                onSetMelVelocity(si, Math.max(0.05, Math.min(1, ratio)))
              }}
            >
              <div className="vel-bar-fill" style={{ height: `${(step.velocity ?? 0.8) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Melodic: note length lane ── */}
      <div className="seq-row seq-lane-row">
        <div className="seq-channel-strip seq-mel-strip">
          <span className="seq-mel-label">LEN</span>
        </div>
        <div className="seq-len-lane">
          {melSteps.map((step, si) => {
            const len = step.length ?? 1
            const lenIdx = MEL_LENGTHS.indexOf(len)
            return (
              <button
                key={si}
                className={`len-btn len-${len}${gapClass(si)}${currentStep === si ? ' is-current' : ''}${!step.on ? ' is-off' : ''}`}
                onClick={() => onCycleMelLength(si)}
                title={`note length: ×${len} steps — click to cycle`}
              >
                ×{len}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Melodic: pan lane ── */}
      <div className="seq-row seq-lane-row">
        <div className="seq-channel-strip seq-mel-strip">
          <span className="seq-mel-label">PAN</span>
        </div>
        <div className="seq-pan-lane">
          {melSteps.map((step, si) => (
            <div key={si} className={`mel-pan-wrap${gapClass(si)}${currentStep === si ? ' is-current' : ''}`}>
              <input
                type="range"
                className="mel-pan-slider"
                min="-1" max="1" step="0.04"
                value={step.pan ?? 0}
                onChange={e => onSetMelPan(si, Number(e.target.value))}
                title={`pan: ${panLabel(step.pan ?? 0)}`}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
