// C-relative note names (index 0 = C, 9 = A, etc.)
export const NOTE_NAMES_C = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Each preset defines 12 ratios relative to C (index 0 = C, 9 = A)
// C4 frequency is derived as: C4 = A4 / ratios[9]
export const RATIO_PRESETS = {
  just5: {
    name: '5-Limit Just',
    desc: 'Ptolemy\'s intense diatonic. Pure 3:2 fifths and 5:4 thirds.',
    ratios: [
      { num: 1,  den: 1  }, // C
      { num: 16, den: 15 }, // C#  +11.7¢
      { num: 9,  den: 8  }, // D   +3.9¢
      { num: 6,  den: 5  }, // D#  +15.6¢
      { num: 5,  den: 4  }, // E   −13.7¢
      { num: 4,  den: 3  }, // F   −2.0¢
      { num: 45, den: 32 }, // F#  −9.8¢
      { num: 3,  den: 2  }, // G   +2.0¢
      { num: 8,  den: 5  }, // G#  +13.7¢
      { num: 5,  den: 3  }, // A   −15.6¢
      { num: 9,  den: 5  }, // A#  +17.6¢
      { num: 15, den: 8  }, // B   −11.7¢
    ],
  },

  pythagorean: {
    name: 'Pythagorean',
    desc: 'Pure fifths (3:2) stacked twelve times. Tense thirds, resonant fourths and fifths.',
    ratios: [
      { num: 1,    den: 1   }, // C
      { num: 2187, den: 2048}, // C#  +13.7¢
      { num: 9,    den: 8   }, // D   +3.9¢
      { num: 32,   den: 27  }, // D#  −5.9¢
      { num: 81,   den: 64  }, // E   +7.8¢
      { num: 4,    den: 3   }, // F   −2.0¢
      { num: 729,  den: 512 }, // F#  +11.7¢
      { num: 3,    den: 2   }, // G   +2.0¢
      { num: 128,  den: 81  }, // G#  −9.8¢
      { num: 27,   den: 16  }, // A   +5.9¢
      { num: 16,   den: 9   }, // A#  −3.9¢
      { num: 243,  den: 128 }, // B   +9.8¢
    ],
  },

  septimal: {
    name: '7-Limit Septimal',
    desc: 'Introduces the 7th harmonic partial. Bluesy minor sevenths and tritones.',
    ratios: [
      { num: 1,  den: 1  }, // C
      { num: 21, den: 20 }, // C#  +84.5¢ (subminor)
      { num: 9,  den: 8  }, // D
      { num: 7,  den: 6  }, // D#  −33.1¢ (subminor third)
      { num: 5,  den: 4  }, // E
      { num: 4,  den: 3  }, // F
      { num: 7,  den: 5  }, // F#  −17.5¢ (septimal tritone)
      { num: 3,  den: 2  }, // G
      { num: 14, den: 9  }, // G#  −17.6¢
      { num: 5,  den: 3  }, // A
      { num: 7,  den: 4  }, // A#  −31.2¢ (septimal seventh)
      { num: 15, den: 8  }, // B
    ],
  },
}

export const DEFAULT_PRESET_KEY = 'just5'
