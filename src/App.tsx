import { useState } from 'react'
import { BankrollProvider, useBankroll } from './lib/bankroll'
import { GAMES } from './gameCatalog'
import type { View } from './gameCatalog'
import Lobby from './components/Lobby'
import Blackjack from './games/Blackjack'
import Roulette from './games/Roulette'
import Slots from './games/Slots'
import VideoPoker from './games/VideoPoker'
import Baccarat from './games/Baccarat'

function Header({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const bank = useBankroll()

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <button className="brand" onClick={() => onNavigate('floor')} aria-label="Maison d'Or home">
          <span className="monogram">
            <span>MD</span>
          </span>
          <span className="brand-text">
            <span className="brand-name">MAISON D'OR</span>
            <span className="brand-sub">Monte Carlo · Est. 1929</span>
          </span>
        </button>

        <nav className="nav" aria-label="Tables">
          <button
            className={`nav-btn ${view === 'floor' ? 'is-active' : ''}`}
            onClick={() => onNavigate('floor')}
          >
            Floor
          </button>
          {GAMES.map((g) => (
            <button
              key={g.key}
              className={`nav-btn ${view === g.key ? 'is-active' : ''}`}
              onClick={() => onNavigate(g.key)}
            >
              {g.short}
            </button>
          ))}
        </nav>

        <div className="bankroll" title="Your play chips">
          <div>
            <span className="bankroll-label">Chips</span>
            <span className="bankroll-amount">{bank.format(bank.credits)}</span>
          </div>
          <button
            className="btn-comp"
            onClick={bank.claimComp}
            title="Collect 1,000 complimentary chips"
          >
            + Comp
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const bank = useBankroll()
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="age-badge">18+</span>
          <p className="footer-note">
            Maison d'Or is a demonstration salon. All chips are complimentary and no real money is
            wagered, won or lost. Deck order comes from a cryptographic generator.
            <br />© {new Date().getFullYear()} Maison d'Or · Monte Carlo
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={bank.reset}>
          Reset bankroll
        </button>
      </div>
    </footer>
  )
}

function Floor() {
  const [view, setView] = useState<View>('floor')
  const bank = useBankroll()

  const navigate = (next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <div className="floor-ambience" />
      <div className="vignette" />
      <Header view={view} onNavigate={navigate} />
      <main className="page">
        <div className="shell">
          {view === 'floor' ? <Lobby onOpen={navigate} onTopUp={bank.claimComp} /> : null}
          {view === 'blackjack' ? <Blackjack /> : null}
          {view === 'roulette' ? <Roulette /> : null}
          {view === 'slots' ? <Slots /> : null}
          {view === 'poker' ? <VideoPoker /> : null}
          {view === 'baccarat' ? <Baccarat /> : null}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BankrollProvider>
      <Floor />
    </BankrollProvider>
  )
}
