# unwelltempered

A browser-based chromatic keyboard instrument for exploring historical and microtonal tuning systems.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Keyboard mapping

Two octaves across your keyboard:

| Key | Note |    | Key | Note (oct+1) |
|-----|------|----|-----|------|
| A   | C    |    | K   | C    |
| W   | C#   |    | O   | C#   |
| S   | D    |    | L   | D    |
| E   | D#   |    | P   | D#   |
| D   | E    |    | ;   | E    |
| F   | F    |
| T   | F#   |
| G   | G    |
| Y   | G#   |
| H   | A    |
| U   | A#   |
| J   | B    |

## Tuning systems

- **Equal Temperament (12-TET)** — the modern standard
- **Just Intonation (5-limit)** — pure ratios, wolf intervals
- **Pythagorean** — stacked perfect fifths (medieval)
- **Quarter-comma Meantone** — Renaissance/Baroque standard
- **Werckmeister III** — Bach's well-temperament (1691)
- **Kirnberger III** — alternative well-temperament (1779)
- **19-TET / 31-TET / 24-TET** — microtonal systems

## Stack

- React + Vite
- Web Audio API (no external audio libraries)
- DM Mono + Fraunces (Google Fonts)
