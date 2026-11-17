import { GAMES } from '../gameCatalog'
import type { View } from '../gameCatalog'
import { useBankroll } from '../lib/bankroll'

type Props = {
  onOpen: (view: View) => void
  onTopUp: () => void
}

function Sunburst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="burstGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7e6c1" />
          <stop offset="55%" stopColor="#c39a4f" />
          <stop offset="100%" stopColor="#7d5c26" />
        </linearGradient>
      </defs>
      <g stroke="url(#burstGold)" strokeWidth="0.8" fill="none">
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i * 10 * Math.PI) / 180
          const inner = 66
          const outer = i % 3 === 0 ? 96 : 84
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * inner}
              y1={100 + Math.sin(a) * inner}
              x2={100 + Math.cos(a) * outer}
              y2={100 + Math.sin(a) * outer}
              opacity={i % 3 === 0 ? 0.85 : 0.4}
            />
          )
        })}
        <circle cx="100" cy="100" r="56" strokeWidth="1" opacity="0.8" />
        <circle cx="100" cy="100" r="66" strokeWidth="0.6" opacity="0.5" />
        <circle cx="100" cy="100" r="98" strokeWidth="0.6" opacity="0.35" />
        <path d="M100 62 L112 100 L100 138 L88 100 Z" opacity="0.7" />
        <path d="M62 100 L100 88 L138 100 L100 112 Z" opacity="0.7" />
      </g>
    </svg>
  )
}

export default function Lobby({ onOpen, onTopUp }: Props) {
  const bank = useBankroll()

  return (
    <div>
      <section className="hero">
        <svg viewBox="0 0 200 200" className="hero-emblem" aria-hidden="true">
          <defs>
            <linearGradient id="heroGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7e6c1" />
              <stop offset="55%" stopColor="#c39a4f" />
              <stop offset="100%" stopColor="#6d4f20" />
            </linearGradient>
          </defs>
          <g stroke="url(#heroGold)" fill="none">
            {Array.from({ length: 48 }).map((_, i) => {
              const a = (i * 7.5 * Math.PI) / 180
              const inner = 52
              const outer = i % 4 === 0 ? 92 : i % 2 === 0 ? 78 : 66
              return (
                <line
                  key={i}
                  x1={100 + Math.cos(a) * inner}
                  y1={100 + Math.sin(a) * inner}
                  x2={100 + Math.cos(a) * outer}
                  y2={100 + Math.sin(a) * outer}
                  strokeWidth={i % 4 === 0 ? 1 : 0.5}
                  opacity={i % 4 === 0 ? 0.9 : 0.45}
                />
              )
            })}
            <circle cx="100" cy="100" r="46" strokeWidth="1.4" />
            <circle cx="100" cy="100" r="40" strokeWidth="0.6" />
            <circle cx="100" cy="100" r="97" strokeWidth="0.8" opacity="0.6" />
            <path d="M100 58 L110 100 L100 142 L90 100 Z" strokeWidth="1" />
          </g>
          <text
            x="100"
            y="104"
            textAnchor="middle"
            fill="url(#heroGold)"
            fontFamily="Cinzel, serif"
            fontSize="11"
            letterSpacing="4"
          >
            MD
          </text>
        </svg>

        <div className="hero-inner">
          <span className="eyebrow">Est. MCMXXIX · Monte Carlo</span>
          <h1 className="gold-text">
            The Gilded Floor
            <em>Maison d'Or</em>
          </h1>
          <p>
            A private salon of five classic tables, dressed in emerald baize and brass. Every hand is
            shuffled with cryptographic randomness — and every chip is on the house.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gold" onClick={() => onOpen('blackjack')}>
              Take a seat
            </button>
            <button className="btn btn-ghost" onClick={onTopUp}>
              Collect comp chips
            </button>
          </div>

          <div className="hero-facts">
            <div>
              <div className="hero-fact-value">05</div>
              <div className="hero-fact-label">Tables</div>
            </div>
            <div>
              <div className="hero-fact-value">{bank.format(bank.credits)}</div>
              <div className="hero-fact-label">Your chips</div>
            </div>
            <div>
              <div className="hero-fact-value">{bank.format(bank.stats.hands)}</div>
              <div className="hero-fact-label">Hands settled</div>
            </div>
            <div>
              <div className="hero-fact-value">★</div>
              <div className="hero-fact-label">Play money only</div>
            </div>
          </div>
        </div>
      </section>

      <div className="floor-head">
        <div>
          <span className="eyebrow">The Salon</span>
          <h2 className="section-title" style={{ marginTop: 10 }}>
            Five tables, one floor
          </h2>
        </div>
        <p className="floor-note">
          Choose a table. Chips are complimentary and nothing here is played for real money.
        </p>
      </div>

      <div className="game-grid">
        {GAMES.map((game) => (
          <button
            key={game.key}
            className="game-card"
            style={{ ['--card-glow' as string]: game.glow }}
            onClick={() => onOpen(game.key)}
          >
            <Sunburst className="game-card-team" />
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
          <span className="eyebrow">The House</span>
          <h2 className="section-title" style={{ marginTop: 10 }}>
            House notes
          </h2>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <h4>Certified shuffle</h4>
          <p>
            Every deck is shuffled with <strong>crypto.getRandomValues</strong> and rejection sampling,
            so no card or pocket is favoured by the generator.
          </p>
        </div>
        <div className="info-card">
          <h4>Complimentary chips</h4>
          <p>
            The cage never closes. Collect a thousand chips whenever your stack runs dry — your
            bankroll is kept privately in this browser.
          </p>
        </div>
        <div className="info-card">
          <h4>Honest arithmetic</h4>
          <p>
            Standard house rules and published pay tables: 3:2 blackjack, 35:1 straight roulette,
            9/6 Jacks or Better, 5% banker commission.
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
          <div className="stat-label">Chips wagered</div>
        </div>
      </div>
    </div>
  )
}
