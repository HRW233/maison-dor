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
        <button className="brand" onClick={() => onNavigate('floor')} aria-label="Parlour home">
          <span className="monogram">
            <span>P</span>
          </span>
          <span className="brand-text">
            <span className="brand-name">PARLOUR</span>
            <span className="brand-sub">Play-money card and table games</span>
          </span>
        </button>

        <nav className="nav" aria-label="Games">
          <button
            className={`nav-btn ${view === 'floor' ? 'is-active' : ''}`}
            onClick={() => onNavigate('floor')}
          >
            Overview
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

        <div className="bankroll" title="Your play-money balance">
          <div>
            <span className="bankroll-label">Balance</span>
            <span className="bankroll-amount">{bank.format(bank.credits)}</span>
          </div>
          <button
            className="btn-comp"
            onClick={bank.claimComp}
            title="Add 1,000 play credits"
          >
            + 1,000
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
        <div className="footer-left">
          <span className="meta-tag">Play money</span>
          <p className="footer-note">
            Parlour is a demonstration games room. Credits are simulated — no real money is wagered,
            won or lost, and no account is needed. Every shuffle uses the browser&rsquo;s
            cryptographic generator.
            <br />© {new Date().getFullYear()} Parlour
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={bank.reset}>
          Reset credits
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
