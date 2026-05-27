import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import FreePlayPage  from './pages/FreePlayPage'
import ScalesPage    from './pages/ScalesPage'
import HarmonyPage   from './pages/HarmonyPage'
import WavePage      from './pages/WavePage'
import TuningPage    from './pages/TuningPage'
import SequencerPage from './pages/SequencerPage'
import BouncerPage   from './pages/BouncerPage'
import './App.css'

const TABS = [
  { id: 'freeplay',  label: 'FREE PLAY',  sub: 'just play'          },
  { id: 'scales',    label: 'SCALES',     sub: 'learn & explore'    },
  { id: 'harmony',   label: 'HARMONY',    sub: 'visualizing harmony' },
  { id: 'wave',      label: 'WAVE',       sub: 'draw your timbre'   },
  { id: 'tuning',    label: 'TUNING LAB', sub: 'temperament'        },
  { id: 'sequencer', label: 'SEQUENCER',  sub: 'step + drum'        },
  { id: 'bouncer',   label: 'BOUNCE',     sub: 'circle of fifths'   },
]

export default function App() {
  return (
    <HashRouter>
      <div className="app">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="app-wordmark">
            <svg className="app-logo-keys" viewBox="0 0 43 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {[0,7,14,21,28,35].map(x => (
                <rect key={x} x={x+0.5} y="0.5" width="6" height="27" rx="1" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1"/>
              ))}
              {[4.5, 11.5, 25.5, 32.5].map(x => (
                <rect key={x} x={x} y="0.5" width="4" height="17" rx="1" fill="currentColor" fillOpacity="0.6"/>
              ))}
            </svg>
            <span className="app-wordmark-main">UNWELLTEMPERED</span>
            <span className="app-wordmark-sep">·</span>
            <span className="app-wordmark-sub">a music laboratory</span>
          </div>
        </header>

        <div className="app-body">

          {/* ── Left nav ── */}
          <nav className="app-nav">
            {TABS.map(tab => (
              <NavLink
                key={tab.id}
                to={`/${tab.id}`}
                className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
              >
                <span className="nav-tab-label">{tab.label}</span>
                <span className="nav-tab-sub">{tab.sub}</span>
              </NavLink>
            ))}
          </nav>

          {/* ── Page content ── */}
          <main className="main-area">
            <Routes>
              <Route path="/freeplay"  element={<FreePlayPage />}  />
              <Route path="/scales"    element={<ScalesPage />}    />
              <Route path="/harmony"   element={<HarmonyPage />}   />
              <Route path="/wave"      element={<WavePage />}      />
              <Route path="/tuning"    element={<TuningPage />}    />
              <Route path="/sequencer" element={<SequencerPage />} />
              <Route path="/bouncer"   element={<BouncerPage />}   />
              <Route path="*"          element={<Navigate to="/freeplay" replace />} />
            </Routes>
          </main>

        </div>
      </div>
    </HashRouter>
  )
}
