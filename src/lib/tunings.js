export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const NOTE_NAMES_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

export const TUNINGS = {
  equal: {
    name: 'Equal Temperament',
    short: '12-TET',
    era: 'Modern',
    desc: 'Every semitone is exactly 2^(1/12). All intervals are slightly mistuned, but every key is identical — enabling free transposition. The dominant tuning since the early 20th century.',
    centOffsets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  just: {
    name: 'Just Intonation',
    short: '5-limit',
    era: 'Ancient / Renaissance',
    desc: 'Ratios tuned to small whole numbers (5/4 major third, 3/2 fifth, 6/5 minor third). Pure, resonant consonances in C major — but modulating creates harsh "wolf" intervals.',
    centOffsets: [0, 11.73, 3.91, 15.64, -13.69, -1.96, -9.78, 1.96, 13.69, -15.64, -3.91, 11.73],
  },
  pythagorean: {
    name: 'Pythagorean',
    short: '3-limit',
    era: 'Medieval',
    desc: 'Built entirely from stacked perfect fifths (3/2). Fifths and fourths are pure; major thirds are wide and tense. The dominant tuning of medieval polyphony.',
    centOffsets: [0, 13.69, 3.91, 17.6, 7.82, -1.96, 11.73, 1.96, 15.64, 5.87, 19.55, 9.78],
  },
  meantone: {
    name: 'Quarter-comma Meantone',
    short: 'Meantone',
    era: 'Renaissance / Baroque',
    desc: 'Fifths narrowed by 1/4 syntonic comma so major thirds are pure (5/4). Lush and brilliant in keys near C; the G#–E♭ "wolf" fifth is catastrophic. Standard until ~1700.',
    centOffsets: [0, -24.0, 3.42, -20.53, 6.84, 10.26, -13.69, 13.69, -10.26, 17.1, -6.84, 20.52],
  },
  werckmeister: {
    name: 'Werckmeister III',
    short: 'Werckmeister',
    era: '1691',
    desc: 'Andreas Werckmeister\'s well-temperament. All 24 keys are usable; keys near C are purer, remote keys are brighter and more tense. Inspired Bach\'s Well-Tempered Clavier.',
    centOffsets: [0, -9.78, -9.78, -3.91, -13.69, 0, -9.78, -9.78, -9.78, -3.91, -7.82, -11.73],
  },
  kirnberger: {
    name: 'Kirnberger III',
    short: 'Kirnberger',
    era: '1779',
    desc: 'Johann Kirnberger\'s well-temperament, favored by C.P.E. Bach. C, G, D, A have pure major thirds. Smooth in nearby keys, distinctly characterful in remote ones.',
    centOffsets: [0, -11.73, -9.78, -7.82, -13.69, -1.96, -11.73, -9.78, -7.82, -11.73, -3.91, -11.73],
  },
  '19tet': {
    name: '19-TET',
    short: '19-TET',
    era: 'Microtonal',
    desc: '19 equal divisions of the octave. Near-pure minor thirds and major thirds; feels like an extended meantone with a smoother sound. Enharmonics are distinct (C# ≠ D♭).',
    stepsPerOctave: 19,
    semitoneMapping: [0, 1, 3, 4, 6, 8, 9, 11, 12, 14, 15, 17],
  },
  '31tet': {
    name: '31-TET',
    short: '31-TET',
    era: 'Microtonal',
    desc: '31 equal divisions of the octave. Superb approximations of 5-limit just ratios. Championed by Huygens and Vicentino; highly expressive with near-pure thirds and fifths.',
    stepsPerOctave: 31,
    semitoneMapping: [0, 2, 5, 7, 10, 13, 15, 18, 20, 23, 26, 28],
  },
  '24tet': {
    name: '24-TET',
    short: 'Quarter-tone',
    era: 'Microtonal',
    desc: 'Adds a quarter-tone between each semitone. Used in Arabic maqam, Turkish makam, and 20th-century microtonal composition. The keyboard plays every other step.',
    stepsPerOctave: 24,
    semitoneMapping: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
  },
}

export const TUNING_GROUPS = [
  {
    label: 'Equal Temperament',
    keys: ['equal'],
  },
  {
    label: 'Just & Pythagorean',
    keys: ['just', 'pythagorean'],
  },
  {
    label: 'Historical Well-temperaments',
    keys: ['meantone', 'werckmeister', 'kirnberger'],
  },
  {
    label: 'Microtonal',
    keys: ['19tet', '31tet', '24tet'],
  },
]

export function getFrequency(midiNote, tuningKey, a4 = 440) {
  const t = TUNINGS[tuningKey]
  const a4midi = 69
  const semiFromA4 = midiNote - a4midi
  const octaveOffset = Math.floor(semiFromA4 / 12)
  const semi = ((semiFromA4 % 12) + 12) % 12

  if (t.centOffsets) {
    const centOff = t.centOffsets[semi]
    return a4 * Math.pow(2, (semiFromA4 + centOff / 100) / 12)
  } else {
    const steps = t.semitoneMapping[semi]
    const totalSteps = steps + octaveOffset * t.stepsPerOctave
    return a4 * Math.pow(2, totalSteps / t.stepsPerOctave)
  }
}

export function getCentDeviation(semi, tuningKey) {
  const t = TUNINGS[tuningKey]
  if (!t.centOffsets) {
    const stepSize = 1200 / t.stepsPerOctave
    const mapped = t.semitoneMapping[semi] * stepSize
    return mapped - semi * 100
  }
  return t.centOffsets[semi]
}
