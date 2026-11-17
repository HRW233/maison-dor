import { useState } from 'react'
import GameShell from '../components/GameShell'
import PlayingCard from '../components/PlayingCard'
import { useBankroll } from '../lib/bankroll'
import { freshDeck } from '../lib/cards'
import type { Card, Rank } from '../lib/cards'

type Combo =
  | 'royal'
  | 'straightFlush'
  | 'four'
  | 'fullHouse'
  | 'flush'
  | 'straight'
  | 'three'
  | 'twoPair'
  | 'jacks'
  | 'none'

const PAYTABLE: { key: Combo; name: string; pay: number }[] = [
  { key: 'royal', name: 'Royal Flush', pay: 250 },
  { key: 'straightFlush', name: 'Straight Flush', pay: 50 },
  { key: 'four', name: 'Four of a Kind', pay: 25 },
  { key: 'fullHouse', name: 'Full House', pay: 9 },
  { key: 'flush', name: 'Flush', pay: 6 },
  { key: 'straight', name: 'Straight', pay: 4 },
  { key: 'three', name: 'Three of a Kind', pay: 3 },
  { key: 'twoPair', name: 'Two Pair', pay: 2 },
  { key: 'jacks', name: 'Jacks or Better', pay: 1 },
]

const PAYS: Record<Combo, number> = PAYTABLE.reduce(
  (acc, row) => ({ ...acc, [row.key]: row.pay }),
  { none: 0 } as Record<Combo, number>,
)

const value = (r: Rank): number => {
  if (r === 'A') return 14
  if (r === 'K') return 13
  if (r === 'Q') return 12
  if (r === 'J') return 11
  return parseInt(r, 10)
}

function evaluate(cards: Card[]): Combo {
  const values = cards.map((c) => value(c.rank)).sort((a, b) => a - b)
  const counts = new Map<number, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  const groups = [...counts.values()].sort((a, b) => b - a)
  const flush = cards.every((c) => c.suit === cards[0].suit)

  const unique = [...new Set(values)]
  const isStraight = unique.length === 5 && unique[4] - unique[0] === 4
  const wheel = unique.length === 5 && unique.join(',') === '2,3,4,5,14'
  const straight = isStraight || wheel

  if (flush && straight) {
    const high = wheel ? 5 : values[4]
    return high === 14 ? 'royal' : 'straightFlush'
  }
  if (groups[0] === 4) return 'four'
  if (groups[0] === 3 && groups[1] === 2) return 'fullHouse'
  if (flush) return 'flush'
  if (straight) return 'straight'
  if (groups[0] === 3) return 'three'
  if (groups[0] === 2 && groups[1] === 2) return 'twoPair'

  for (const [v, count] of counts.entries()) {
    if (count === 2 && v >= 11) return 'jacks'
  }
  return 'none'
}

type Phase = 'ready' | 'draw' | 'done'

export default function VideoPoker() {
  const bank = useBankroll()
  const [coins, setCoins] = useState(5)
  const [hand, setHand] = useState<Card[] | null>(null)
  const [holds, setHolds] = useState<boolean[]>([false, false, false, false, false])
  const [deck, setDeck] = useState<Card[]>([])
  const [phase, setPhase] = useState<Phase>('ready')
  const [combo, setCombo] = useState<Combo | null>(null)
  const [won, setWon] = useState(0)

  const startHand = () => {
    if (phase !== 'ready') return
    if (!bank.debit(coins)) return
    const fresh = freshDeck()
    setHand(fresh.slice(0, 5))
    setDeck(fresh.slice(5))
    setHolds([false, false, false, false, false])
    setCombo(null)
    setWon(0)
    setPhase('draw')
  }

  const draw = () => {
    if (phase !== 'draw' || !hand) return
    const remaining = [...deck]
    const next = hand.map((card, i) => (holds[i] ? card : remaining.shift()!))
    const result = evaluate(next)
    const payout = (PAYS[result] ?? 0) * coins

    setHand(next)
    setDeck(remaining)
    setCombo(result)
    setWon(payout)
    setPhase('done')

    if (payout > 0) {
      bank.credit(payout)
      bank.recordWin(payout)
    }
  }

  const nextHand = () => {
    setPhase('ready')
    setHand(null)
    setCombo(null)
    setWon(0)
    setHolds([false, false, false, false, false])
  }

  const toggleHold = (i: number) => {
    if (phase !== 'draw') return
    setHolds((h) => h.map((v, idx) => (idx === i ? !v : v)))
  }

  const comboName = combo && combo !== 'none' ? PAYTABLE.find((p) => p.key === combo)?.name : null

  return (
    <GameShell
      eyebrow="Table four"
      title="Video Poker"
      subtitle="Jacks or Better on the generous nine-six pay table. Five coins max, dealt from a fresh fifty-two card deck every hand."
      rules={['9/6 pay table', '52 cards', 'Hold & draw']}
      tone="teal"
    >
      <div style={{ marginTop: 10 }}>
        <div className="poker-row">
          {[0, 1, 2, 3, 4].map((i) => {
            const card = hand?.[i]
            return (
              <div className={`poker-slot ${holds[i] && phase === 'draw' ? 'is-held' : ''}`} key={i}>
                {card ? (
                  <PlayingCard card={card} delay={i * 80} />
                ) : (
                  <PlayingCard faceDown delay={i * 80} />
                )}
                <button
                  className={`hold-btn ${holds[i] && phase === 'draw' ? 'is-held' : ''}`}
                  onClick={() => toggleHold(i)}
                  disabled={phase !== 'draw'}
                >
                  {holds[i] && phase === 'draw' ? 'Held' : 'Hold'}
                </button>
              </div>
            )
          })}
        </div>

        <div className="table-message" style={{ marginTop: 26 }}>
          {phase === 'ready'
            ? 'Press deal to receive five cards'
            : phase === 'draw'
              ? 'Hold the cards you keep, then draw'
              : comboName
                ? `${comboName} — ${bank.format(won)} credits`
                : 'No pair of jacks. The hand is the house’s.'}
        </div>

        <div className="poker-paytable">
          {PAYTABLE.map((row) => (
            <div
              className={`paytable-row ${combo === row.key ? 'is-active' : ''}`}
              key={row.key}
            >
              <span>{row.name}</span>
              <b>{row.pay * coins}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <div className="wager-group">
          <span className="wager-label">Wager</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`hold-btn ${coins === n ? 'is-held' : ''}`}
              onClick={() => {
                if (phase === 'ready') setCoins(n)
              }}
              disabled={phase !== 'ready'}
            >
              {n}
            </button>
          ))}
        </div>

        {phase === 'ready' ? (
          <button className="btn btn-gold" onClick={startHand} disabled={coins > bank.credits}>
            Deal · {coins}
          </button>
        ) : null}

        {phase === 'draw' ? (
          <button className="btn btn-gold" onClick={draw}>
            Draw
          </button>
        ) : null}

        {phase === 'done' ? (
          <button className="btn btn-gold" onClick={nextHand}>
            Next hand
          </button>
        ) : null}

        <div className="controls-spacer" />
        <span className="meta-line">
          Max win · {(PAYTABLE[0].pay * coins).toLocaleString()} credits
        </span>
      </div>
    </GameShell>
  )
}
