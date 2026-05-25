import './LoopPanel.css'

const MAX_MS = 10000

function fmtTime(ms) {
  return (ms / 1000).toFixed(1) + 's'
}

export default function LoopPanel({
  status,
  loopDuration,
  recordElapsed,
  hasLoop,
  onStartRecording,
  onStopRecording,
  onStartPlaying,
  onStopPlaying,
}) {
  const isRecording = status === 'recording'
  const isPlaying = status === 'playing'

  return (
    <div className="loop-panel">
      <button
        className={`loop-record-btn${isRecording ? ' is-recording' : ''}`}
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isPlaying}
      >
        <span className="loop-record-dot" />
        {isRecording ? 'stop' : 'record'}
      </button>

      {isRecording && (
        <div className="loop-rec-progress">
          <div className="loop-rec-bar">
            <div
              className="loop-rec-fill"
              style={{ width: `${(recordElapsed / MAX_MS) * 100}%` }}
            />
          </div>
          <div className="loop-rec-time">
            <span>{fmtTime(recordElapsed)}</span>
            <span className="loop-rec-max">/ 10s max</span>
          </div>
        </div>
      )}

      {!isRecording && hasLoop && (
        <>
          <div className="loop-info">
            <span className="loop-info-label">loop</span>
            <span className="loop-info-duration">{fmtTime(loopDuration)}</span>
          </div>
          <button
            className={`loop-play-btn${isPlaying ? ' is-playing' : ''}`}
            onClick={isPlaying ? onStopPlaying : onStartPlaying}
          >
            {isPlaying ? '■ stop' : '▶ play'}
          </button>
          {isPlaying && <div className="loop-playing-bar" />}
        </>
      )}

      {!isRecording && !hasLoop && (
        <p className="loop-hint">record up to 10s of notes, then loop it back</p>
      )}
    </div>
  )
}
