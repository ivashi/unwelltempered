// Pure Web Audio synthesis functions — no samples, all generated.
// Each function takes (ac, destination, time) and schedules the sound there.

function noise(ac, duration) {
  const len = Math.ceil(ac.sampleRate * duration)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  return src
}

export function synthKick(ac, dest, time) {
  const osc  = ac.createOscillator()
  const gain = ac.createGain()

  osc.frequency.setValueAtTime(140, time)
  osc.frequency.exponentialRampToValueAtTime(28, time + 0.4)

  gain.gain.setValueAtTime(1.0, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45)

  osc.connect(gain)
  gain.connect(dest)
  osc.start(time)
  osc.stop(time + 0.46)
}

export function synthSnare(ac, dest, time) {
  // Noise burst
  const n     = noise(ac, 0.2)
  const hpf   = ac.createBiquadFilter()
  const nGain = ac.createGain()
  hpf.type = 'highpass'
  hpf.frequency.value = 1000
  nGain.gain.setValueAtTime(0.85, time)
  nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)
  n.connect(hpf)
  hpf.connect(nGain)
  nGain.connect(dest)
  n.start(time)
  n.stop(time + 0.2)

  // Crack tone
  const osc  = ac.createOscillator()
  const oGain = ac.createGain()
  osc.frequency.setValueAtTime(220, time)
  osc.frequency.exponentialRampToValueAtTime(90, time + 0.06)
  oGain.gain.setValueAtTime(0.5, time)
  oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
  osc.connect(oGain)
  oGain.connect(dest)
  osc.start(time)
  osc.stop(time + 0.09)
}

export function synthClosedHat(ac, dest, time) {
  const n    = noise(ac, 0.06)
  const hpf  = ac.createBiquadFilter()
  const gain = ac.createGain()
  hpf.type = 'highpass'
  hpf.frequency.value = 8000
  gain.gain.setValueAtTime(0.55, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
  n.connect(hpf)
  hpf.connect(gain)
  gain.connect(dest)
  n.start(time)
  n.stop(time + 0.06)
}

export function synthOpenHat(ac, dest, time) {
  const n    = noise(ac, 0.35)
  const hpf  = ac.createBiquadFilter()
  const gain = ac.createGain()
  hpf.type = 'highpass'
  hpf.frequency.value = 7000
  gain.gain.setValueAtTime(0.5, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32)
  n.connect(hpf)
  hpf.connect(gain)
  gain.connect(dest)
  n.start(time)
  n.stop(time + 0.35)
}

export function synthClap(ac, dest, time) {
  // Multiple staggered noise bursts = hand clap texture
  [0, 0.010, 0.020, 0.032].forEach(offset => {
    const n    = noise(ac, 0.06)
    const bpf  = ac.createBiquadFilter()
    const gain = ac.createGain()
    bpf.type = 'bandpass'
    bpf.frequency.value = 1200
    bpf.Q.value = 0.8
    gain.gain.setValueAtTime(0.7, time + offset)
    gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.055)
    n.connect(bpf)
    bpf.connect(gain)
    gain.connect(dest)
    n.start(time + offset)
    n.stop(time + offset + 0.06)
  })
}

export function synthTom(ac, dest, time, freq = 100) {
  const osc  = ac.createOscillator()
  const gain = ac.createGain()
  osc.frequency.setValueAtTime(freq, time)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.28, time + 0.22)
  gain.gain.setValueAtTime(0.9, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(time)
  osc.stop(time + 0.29)
}

export const DRUM_TRACKS = [
  { id: 'kick',      label: 'Kick',  color: '#c47040', synth: (ac, d, t) => synthKick(ac, d, t) },
  { id: 'snare',     label: 'Snare', color: '#b8a030', synth: (ac, d, t) => synthSnare(ac, d, t) },
  { id: 'clap',      label: 'Clap',  color: '#9060cc', synth: (ac, d, t) => synthClap(ac, d, t) },
  { id: 'closedhat', label: 'CH',    color: '#30a898', synth: (ac, d, t) => synthClosedHat(ac, d, t) },
  { id: 'openhat',   label: 'OH',    color: '#3880c0', synth: (ac, d, t) => synthOpenHat(ac, d, t) },
  { id: 'tom',       label: 'Tom',   color: '#a05878', synth: (ac, d, t) => synthTom(ac, d, t) },
]
