import { useEffect, useRef, useState } from 'react'
import Chip from '../components/Chip'
import GameShell from '../components/GameShell'
import PlayingCard from '../components/PlayingCard'
import { useBankroll } from '../lib/bankroll'
import { baccaratTotal, baccaratValue, freshShoe } from '../lib/cards'
import type { Card } from '../lib/cards'

type Side = 'player' | 'banker'
type Winner = Side | 'tie'
type Deal = { side: Side; card: Card }

type Round = {
  seq: Deal[]
  player: Card[]
  banker: Card[]
  playerTotal: number
  bankerTotal: number
  winner: Winner
}

/**
 * Draws a full baccarat coup from an eight-deck shoe, applying the standard
 * third-card rules, and keeps the cards in the order they left the shoe.
 */
function playRound(): Round {
  const shoe = freshShoe(8)
  let cursor = 0
  const seq: Deal[] = []
  const player: Card[] = []
  const banker: Card[] = []

  const deal = (side: Side) => {
    const card = shoe[cursor++]
    seq.push({ side, card })
    if (side === 'player') player.push(card)
    else banker.push(card)
    return card
  }

  deal('player')
  deal('banker')
  deal('player')
  deal('banker')

  let pTotal = baccaratTotal(player)
  let bTotal = baccaratTotal(banker)

  if (pTotal < 8 && bTotal < 8) {
    let playerThird: Card | null = null
    if (pTotal <= 5) playerThird = deal('player')

    const bankerTwoCard = baccaratTotal(banker)
    let bankerDraws = false

    if (!playerThird) {
      bankerDraws = bankerTwoCard <= 5
    } else {
      const v = baccaratValue(playerThird.rank)
      bankerDraws =
        bankerTwoCard <= 2 ||
        (bankerTwoCard === 3 && v !== 8) ||
        (bankerTwoCard === 4 && v >= 2 && v <= 7) ||
        (bankerTwoCard === 5 && v >= 4 && v <= 7) ||
        (bankerTwoCard === 6 && (v === 6 || v === 7))
    }

    if (bankerDraws) deal('banker')
  }

  pTotal = baccaratTotal(player)
  bTotal = baccaratTotal(banker)

  return {
    seq,
    player,
    banker,
    playerTotal: pTotal,
    bankerTotal: bTotal,
    winner: pTotal > bTotal ? 'player' : bTotal > pTotal ? 'banker' : 'tie',
  }
}

type Stakes = { player: number; banker: number; tie: number }

export default function Baccarat() {
  const bank = useBankroll()
  const [chip, setChip] = useState(100)
  const [stakes, setStakes] = useState<Stakes>({ player: 0, banker: 0, tie: 0 })
  const [round, setRound] = useState<Round | null>(null)
  const [reveal, setReveal] = useState(0)
  const [phase, setPhase] = useState<'bet' | 'dealing' | 'done'>('bet')
  const [message, setMessage] = useState('Back the Player, the Banker, or the Tie')
  const [tone, setTone] = useState<'info' | 'win' | 'loss'>('info')
  const timers = useRef<number[]>([])
  // Stakes are only debited when the coup is dealt, so mirror them in a ref
  // to keep the on-layout ceiling accurate between renders.
  const stakesRef = useRef<Stakes>(stakes)
  const setStakesBoth = (next: Stakes) => {
    stakesRef.current = next
    setStakes(next)
  }

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const totalStake = stakes.player + stakes.banker + stakes.tie
  const revealed = round ? round.seq.slice(0, reveal) : []
  const playerCards = revealed.filter((d) => d.side === 'player').map((d) => d.card)
  const bankerCards = revealed.filter((d) => d.side === 'banker').map((d) => d.card)
  const showWinner = phase === 'done' ? round?.winner : undefined

  const place = (side: keyof Stakes) => {
    if (phase === 'dealing') return
    const s = stakesRef.current
    const onLayout = s.player + s.banker + s.tie
    if (onLayout + chip > bank.credits) {
      setMessage('Not enough credits for that wager.')
      setTone('loss')
      return
    }
    setStakesBoth({ ...s, [side]: s[side] + chip })
    setMessage('')
    setTone('info')
  }

  const deal = () => {
    if (phase === 'dealing') return
    const s = stakesRef.current
    const stake = s.player + s.banker + s.tie
    if (stake <= 0) {
      setMessage('Place a wager on Player, Banker or Tie first.')
      setTone('loss')
      return
    }
    // Charge the layout once, at the deal.
    if (!bank.debit(stake)) return

    const next = playRound()
    setRound(next)
    setReveal(0)
    setPhase('dealing')
    setMessage('')
    setTone('info')

    next.seq.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setReveal(i + 1), 430 * (i + 1)))
    })

    timers.current.push(
      window.setTimeout(() => {
        let returns = 0
        if (next.winner === 'player') returns += s.player * 2
        if (next.winner === 'banker') returns += Math.round(s.banker * 1.95)
        if (next.winner === 'tie') {
          returns += s.tie * 9
          returns += s.player + s.banker
        }

        const profit = returns - stake
        if (returns > 0) {
          bank.credit(returns)
          bank.recordWin(returns)
        }

        setStakesBoth({ player: 0, banker: 0, tie: 0 })
        setPhase('done')

        const label =
          next.winner === 'tie' ? 'Tie' : next.winner === 'player' ? 'Player' : 'Banker'
        if (returns > stake) {
          setMessage(`${label} ${next.winner === 'player' ? next.playerTotal : next.bankerTotal} — paid ${bank.format(returns)} credits (+${bank.format(profit)}).`)
          setTone('win')
        } else if (returns === stake) {
          setMessage(`${label} takes it. Your wager is returned.`)
          setTone('info')
        } else {
          setMessage(`${label} ${next.winner === 'player' ? next.playerTotal : next.bankerTotal}. The house collects.`)
          setTone('loss')
        }
      }, 430 * next.seq.length + 620),
    )
  }

  const reset = () => {
    if (phase === 'dealing') return
    // Nothing was debited at placement, so clearing the layout is free.
    setStakesBoth({ player: 0, banker: 0, tie: 0 })
    setMessage('Back the Player, the Banker, or the Tie')
    setTone('info')
    setRound(null)
    setReveal(0)
    setPhase('bet')
  }

  return (
    <GameShell
      eyebrow="Table five"
      title="Baccarat"
      subtitle="Eight-deck shoe with the standard third-card rules applied automatically. Banker wins carry a five per cent commission; ties pay eight to one."
      rules={['8 decks', 'Banker 0.95:1', 'Tie 8:1']}
      tone="green"
    >
      <div className="baccarat-stage">
        <div className={`bac-side ${showWinner === 'player' ? 'is-winner' : ''}`}>
          <span className="bac-side-title">Player</span>
          <div className="bac-hand">
            {playerCards.length ? (
              playerCards.map((c, i) => (
                <PlayingCard key={`${c.rank}${c.suit}${i}`} card={c} delay={i * 60} />
              ))
            ) : (
              <div style={{ height: 86 }} />
            )}
          </div>
          <div className="bac-total">{phase === 'bet' ? '—' : baccaratTotal(playerCards)}</div>
        </div>

        <div className="bac-tie">
          <div className="bac-tie-mark">Tie · 8 to 1</div>
        </div>

        <div className={`bac-side ${showWinner === 'banker' ? 'is-winner' : ''}`}>
          <span className="bac-side-title">Banker</span>
          <div className="bac-hand">
            {bankerCards.length ? (
              bankerCards.map((c, i) => (
                <PlayingCard key={`${c.rank}${c.suit}${i}`} card={c} delay={i * 60} />
              ))
            ) : (
              <div style={{ height: 86 }} />
            )}
          </div>
          <div className="bac-total">{phase === 'bet' ? '—' : baccaratTotal(bankerCards)}</div>
        </div>
      </div>

      <div className={`table-message ${tone === 'win' ? 'is-win' : tone === 'loss' ? 'is-loss' : ''}`}>
        {message}
      </div>

      <div className="bac-bets">
        {[
          { key: 'player' as const, name: 'Player', pay: 'Pays 1 to 1' },
          { key: 'banker' as const, name: 'Banker', pay: 'Pays 0.95 to 1' },
          { key: 'tie' as const, name: 'Tie', pay: 'Pays 8 to 1' },
        ].map((spot) => (
          <button
            key={spot.key}
            className={`bac-bet ${stakes[spot.key] > 0 ? 'is-active' : ''}`}
            onClick={() => place(spot.key)}
            disabled={phase === 'dealing'}
          >
            <span className="bac-bet-name">{spot.name}</span>
            <span className="bac-bet-pay">{spot.pay}</span>
            <span className="bac-bet-stake">
              {stakes[spot.key] > 0 ? bank.format(stakes[spot.key]) : '—'}
            </span>
          </button>
        ))}
      </div>

      <div className="controls">
        <div className="wager-group">
          <span className="wager-label">Wager</span>
          {[25, 100, 500].map((v) => (
            <Chip key={v} value={v} small selected={chip === v} onClick={() => setChip(v)} />
          ))}
        </div>

        <button className="btn btn-gold" onClick={deal} disabled={phase === 'dealing' || totalStake === 0}>
          {phase === 'dealing' ? 'Dealing…' : 'Deal'}
        </button>
        <button className="btn btn-ghost" onClick={reset} disabled={phase === 'dealing' || totalStake === 0}>
          Clear
        </button>

        <div className="controls-spacer" />
        <span className="meta-line">
          On the layout · {bank.format(totalStake)}
        </span>
      </div>
    </GameShell>
  )
}
