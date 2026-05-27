# unwelltempered

A browser-based music laboratory for exploring sound, tuning, and harmony. Play a keyboard with historical temperaments, visualize intervals, design custom waveforms, sequence beats, and bounce balls off a spinning circle of fifths.

**Live:** https://ivashi.github.io/unwelltempered/

---

## Tabs

### Free Play
A chromatic keyboard with an oscilloscope. Choose your timbre (sine, triangle, square, sawtooth) and just play. A good first stop.

### Scales
Browse 12 scales across diatonic, pentatonic, modal, and exotic categories. Pick a root note, select a scale, and the keyboard highlights every note that belongs to it. Hit **▶ PLAY SCALE** to hear it ascending.

### Harmony
Hold multiple notes and watch the interval wheel. Lines connect every pair of simultaneously-held notes — colour shifts from warm amber (consonant: fifths, thirds) to cool blue (dissonant: tritones, minor seconds). The line weight reflects how pure the interval is.

### Wave
Draw a single cycle of any waveform with your mouse. The right panel shows its harmonic content decomposed into the overtone series. Hit a key to hear exactly what you drew. Preset approximations of violin, trumpet, clarinet, and organ are also included.

### Tuning Lab
Switch between historical and microtonal tuning systems and hear the difference in real time. A frequency readout shows each held note's exact Hz value and its deviation in cents from 12-TET. Drag the equal-temperament sliders to explore arbitrary n-TET divisions and stretched/compressed octaves.

### Sequencer
A 16-step sequencer with a drum machine and a melodic lane. Arm a melodic step by clicking it, then press a key on the keyboard to assign its pitch. The velocity, note length, and pan lanes are all per-step editable. Each drum track has its own volume and pan faders.

### Bounce
Launch balls into a spinning polygon. Each wall corresponds to a note from the circle of fifths — the ball triggers the note on impact. Drag the polygon to spin it, or enable auto-rotate. Toggle individual notes to shrink the polygon down to a triangle, square, or any n-gon.

---

## Keyboard mapping

Two octaves starting from your base octave (adjustable with the Octave ±1 control):

| Key | Note | | Key | Note (oct +1) |
|-----|------|-|-----|----------------|
| A | C | | K | C |
| W | C# | | O | C# |
| S | D | | L | D |
| E | D# | | P | D# |
| D | E | | ; | E |
| F | F | | | |
| T | F# | | | |
| G | G | | | |
| Y | G# | | | |
| H | A | | | |
| U | A# | | | |
| J | B | | | |

---

## Tuning systems

| System | Era | Character |
|--------|-----|-----------|
| Equal Temperament (12-TET) | Modern | Uniform, all keys identical |
| Just Intonation (5-limit) | Timeless | Pure consonances, narrow wolf intervals |
| Pythagorean | Medieval | Stacked perfect fifths, sharp thirds |
| Quarter-comma Meantone | Renaissance / Baroque | Pure major thirds, limited key range |
| Werckmeister III | 1691 | Bach's well-temperament — all keys usable |
| Kirnberger III | 1779 | Softer well-temperament, some just intervals |
| 19-TET | Microtonal | Flatter minor thirds, excellent for jazz |
| 31-TET | Microtonal | Very close to quarter-comma meantone |
| 24-TET | Microtonal | Quarter-tones — standard in Arabic maqam |

The equal-temperament sliders let you dial in any number of steps per octave (5–48) and any octave ratio (1.5:1 – 2.5:1), including stretched tunings used for physical modelling.

---

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Stack

- **React 19** + **Vite 8**
- **Web Audio API** — all synthesis is native, no audio libraries
- **React Router** (hash-based, works on GitHub Pages without server config)
- **DM Mono + Bebas Neue + Barlow Condensed** (Google Fonts)
