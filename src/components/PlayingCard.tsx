import type { CSSProperties } from 'react'
import type { Card as CardModel } from '../lib/cards'
import { PIP_LAYOUT, SUIT_GLYPH, isRedSuit } from '../lib/cards'

type Props = {
  card?: CardModel
  faceDown?: boolean
  delay?: number
  style?: CSSProperties
  className?: string
}

/** A single playing card with a procedurally textured face. */
export default function PlayingCard({ card, faceDown, delay = 0, style, className = '' }: Props) {
  if (faceDown || !card) {
    return (
      <div
        className={`card card--back ${className}`}
        style={{ animationDelay: `${delay}ms`, ...style }}
        aria-label="Face down card"
      />
    )
  }

  const red = isRedSuit(card.suit)
  const glyph = SUIT_GLYPH[card.suit]
  const pips = PIP_LAYOUT[card.rank]
  const isFace = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K'

  return (
    <div
      className={`card ${red ? 'is-red' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <div className="card-corner">
        <span className="rank">{card.rank}</span>
        <span className="suit">{glyph}</span>
      </div>

      {isFace ? (
        <div className="card-face">
          <span className="letter">{card.rank}</span>
          <span className="glyph">{glyph}</span>
        </div>
      ) : (
        <div className="card-pips">
          {pips?.map(([x, y], i) => (
            <span
              key={i}
              className={`card-pip ${y > 55 ? 'is-flipped' : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {glyph}
            </span>
          ))}
        </div>
      )}

      <div className="card-corner card-corner--br">
        <span className="rank">{card.rank}</span>
        <span className="suit">{glyph}</span>
      </div>
    </div>
  )
}
