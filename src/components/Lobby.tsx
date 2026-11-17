import { GAMES } from '../gameCatalog'
import type { View } from '../gameCatalog'
import { useBankroll } from '../lib/bankroll'

type Props = {
  onOpen: (view: View) => void
  onTopUp: () => void
}

export default function Lobby({ onOpen, onTopUp }: Props) {
  const bank = useBankroll()

  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">Play money · no sign-up</span>
          <h1 className="hero-title">
            Five classic games, stripped back.
            <em>
              Blackjack, European roulette, five-reel slots, video poker and baccarat — with
              standard rules and published pay tables.
            </em>
          </h1>
          <p>
            Deal in with simulated credits. Nothing costs anything, there is no account to create,
            and your balance stays in this browser.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gold" onClick={() => onOpen('blackjack')}>
              Open blackjack
            </button>
            <button className="btn btn-ghost" onClick={onTopUp}>
              Add 1,000 credits
            </button>
          </div>
        </div>

        <aside className="hero-aside">
          <div className="hero-fact">
            <span className="hero-fact-label">Games</span>
            <span className="hero-fact-value">05</span>
          </div>
          <div className="hero-fact">
            <span className="hero-fact-label">Your balance</span>
            <span className="hero-fact-value">{bank.format(bank.credits)}</span>
          </div>
          <div className="hero-fact">
            <span className="hero-fact-label">Winning hands</span>
            <span className="hero-fact-value">{bank.format(bank.stats.hands)}</span>
          </div>
          <div className="hero-fact">
            <span className="hero-fact-label">Cost to play</span>
            <span className="hero-fact-value">Free</span>
          </div>
        </aside>
      </section>

      <div className="floor-head">
        <div>
          <span className="eyebrow">The games</span>
          <h2 className="section-title" style={{ marginTop: 6 }}>
            Pick a game
          </h2>
        </div>
        <p className="floor-note">
          Each game deals from a freshly shuffled deck and settles instantly. Credits are simulated
          throughout.
        </p>
      </div>

      <div className="game-grid">
        {GAMES.map((game) => (
          <button key={game.key} className="game-card" onClick={() => onOpen(game.key)}>
            <span className="game-card-index">{game.index}</span>
            <h3>{game.name}</h3>
            <p className="game-card-desc">{game.blurb}</p>
            <div className="game-card-foot">
              <span className="game-card-meta">{game.meta}</span>
              <span className="game-card-go">
                Play <span aria-hidden="true">→</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="floor-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">How it works</span>
          <h2 className="section-title" style={{ marginTop: 6 }}>
            A few notes
          </h2>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <h4>Random by default</h4>
          <p>
            Every deck is shuffled with <strong>crypto.getRandomValues</strong> and rejection
            sampling, so no card or pocket is favoured by the generator.
          </p>
        </div>
        <div className="info-card">
          <h4>Free to play</h4>
          <p>
            Add a thousand credits whenever your balance runs low. The balance is kept privately in
            this browser and reset whenever you like.
          </p>
        </div>
        <div className="info-card">
          <h4>Standard rules</h4>
          <p>
            Three-to-two blackjack, thirty-five-to-one straight-up roulette, nine-six Jacks or
            Better, and a five per cent commission on banker wins.
          </p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="stat-value">{bank.format(bank.credits)}</div>
          <div className="stat-label">Balance</div>
        </div>
        <div className="stat">
          <div className="stat-value">{bank.format(bank.stats.hands)}</div>
          <div className="stat-label">Winning hands</div>
        </div>
        <div className="stat">
          <div className="stat-value">{bank.format(bank.stats.biggestWin)}</div>
          <div className="stat-label">Best win</div>
        </div>
        <div className="stat">
          <div className="stat-value">{bank.format(bank.stats.wagered)}</div>
          <div className="stat-label">Credits wagered</div>
        </div>
      </div>
    </div>
  )
}
