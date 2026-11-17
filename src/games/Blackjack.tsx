import { useRef, useState } from 'react'
import Chip from '../components/Chip'
import GameShell from '../components/GameShell'
import PlayingCard from '../components/PlayingCard'
import { useBankroll } from '../lib/bankroll'
import { freshShoe, handTotal } from '../lib/cards'
import type { Card } from '../lib/cards'

const WAGERS = [10, 25, 50, 100, 250]

type Phase = 'bet' | 'player' | 'dealer' | 'over'
type Tone = 'info' | 'win' | 'loss'

export default function Blackjack() {
  const bank = useBankroll()
  const shoe = useRef<Card[]>(freshShoe(6))

  const [wager, setWager] = useState(25)
  const [phase, setPhase] = useState<Phase>('bet')
  const [player, setPlayer] = useState<Card[]>([])
  const [dealer, setDealer] = useState<Card[]>([])
  const [stake, setStake] = useState(0)
  const [holeHidden, setHoleHidden] = useState(false)
  const [message, setMessage] = useState('Set your wager, then deal')
  const [tone, setTone] = useState<Tone>('info')
  const [busy, setBusy] = useState(false)

  const draw = (n = 1): Card[] => {
    if (shoe.current.length < 30) shoe.current = freshShoe(6)
    return shoe.current.splice(0, n)
  }

  const resolve = (p: Card[], d: Card[], w: number) => {
    setHoleHidden(false)
    const pT = handTotal(p).total
    const dT = handTotal(d).total
    const playerBJ = p.length === 2 && pT === 21
    const dealerBJ = d.length === 2 && dT === 21

    let payout = 0
    let msg = ''
    let t: Tone = 'info'

    if (pT > 21) {
      msg = `Bust on ${pT}. The house takes the hand.`
      t = 'loss'
    } else if (playerBJ && !dealerBJ) {
      payout = Math.round(w * 2.5)
      msg = `Blackjack — paid three to two. ${bank.format(payout)} credits.`
      t = 'win'
    } else if (dealerBJ && !playerBJ) {
      msg = 'Dealer has blackjack.'
      t = 'loss'
    } else if (pT === dT) {
      payout = w
      msg = `Push. Both stand on ${pT}.`
      t = 'info'
    } else if (dT > 21 || pT > dT) {
      payout = w * 2
      msg = `You win — ${pT} against ${dT}. ${bank.format(w)} credits.`
      t = 'win'
    } else {
      msg = `Dealer wins — ${dT} against ${pT}.`
      t = 'loss'
    }

    if (payout > 0) {
      bank.credit(payout)
      bank.recordWin(payout)
    }
    setMessage(msg)
    setTone(t)
    setPhase('over')
    setBusy(false)
  }

  const playDealer = (playerCards: Card[], w: number) => {
    setPhase('dealer')
    setHoleHidden(false)
    setBusy(true)
    const d = [...dealer]
    const step = () => {
      if (handTotal(d).total < 17) {
        d.push(...draw(1))
        setDealer([...d])
        window.setTimeout(step, 460)
      } else {
        window.setTimeout(() => resolve(playerCards, d, w), 260)
      }
    }
    window.setTimeout(step, 460)
  }

  const deal = () => {
    if (phase !== 'bet' || busy) return
    if (!bank.debit(wager)) {
      setMessage('Not enough credits — add some at the top of the page.')
      setTone('loss')
      return
    }
    const p = draw(2)
    const d = draw(2)
    setStake(wager)
    setPlayer(p)
    setDealer(d)
    setHoleHidden(true)
    setPhase('player')
    setMessage('')
    setTone('info')
    setBusy(true)

    window.setTimeout(() => {
      setBusy(false)
      if (handTotal(p).total === 21 || handTotal(d).total === 21) {
        setHoleHidden(false)
        window.setTimeout(() => resolve(p, d, wager), 380)
      }
    }, 640)
  }

  const hit = () => {
    if (phase !== 'player' || busy) return
    const next = [...player, ...draw(1)]
    setPlayer(next)
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      const total = handTotal(next).total
      if (total > 21) resolve(next, dealer, stake)
      else if (total === 21) playDealer(next, stake)
    }, 300)
  }

  const stand = () => {
    if (phase !== 'player' || busy) return
    playDealer(player, stake)
  }

  const double = () => {
    if (phase !== 'player' || busy || player.length !== 2) return
    if (!bank.debit(stake)) {
      setMessage('Not enough credits to double.')
      setTone('loss')
      return
    }
    const next = [...player, ...draw(1)]
    const newStake = stake * 2
    setPlayer(next)
    setStake(newStake)
    setBusy(true)
    window.setTimeout(() => {
      if (handTotal(next).total > 21) resolve(next, dealer, newStake)
      else playDealer(next, newStake)
    }, 340)
  }

  const nextHand = () => {
    setPhase('bet')
    setPlayer([])
    setDealer([])
    setHoleHidden(false)
    setStake(0)
    setMessage('Set your wager, then deal')
    setTone('info')
  }

  const playerTotal = handTotal(player)
  const dealerVisible = holeHidden ? dealer.slice(0, 1) : dealer
  const dealerTotal = handTotal(dealerVisible)

  return (
    <GameShell
      eyebrow="Table one"
      title="Blackjack"
      subtitle="Six-deck shoe. Dealer stands on all seventeens. Blackjack pays three to two, and any two cards may be doubled."
      rules={['3:2 blackjack', 'Dealer stands 17', 'Double any two']}
    >
      <div className="bj-table">
        <div className="bj-felt-line">
          <strong>Blackjack</strong>
          Dealer stands on all seventeens · pays 3:2
        </div>

        <div className="bj-row bj-row--dealer">
          <div className="hand-badge">
            {dealer.length ? `Dealer ${dealerTotal.total}` : 'Dealer'}
            <small>{holeHidden ? 'one card down' : 'total'}</small>
          </div>
          <div className="bj-hand">
            {dealer.length ? (
              dealer.map((c, i) => (
                <PlayingCard
                  key={`${c.rank}${c.suit}${i}`}
                  card={c}
                  faceDown={holeHidden && i === 1}
                  delay={i * 110}
                />
              ))
            ) : (
              <div style={{ height: 112 }} />
            )}
          </div>
        </div>

        <div className={`table-message ${tone === 'win' ? 'is-win' : tone === 'loss' ? 'is-loss' : ''}`}>
          {message}
        </div>

        <div className="bj-row bj-row--player">
          <div className={`hand-badge ${playerTotal.total > 21 ? 'is-bust' : ''}`}>
            {player.length ? `You ${playerTotal.total}` : 'Your hand'}
            <small>
              {playerTotal.soft && playerTotal.total !== 21 ? 'soft' : player.length ? 'total' : 'place a wager'}
            </small>
          </div>
          <div className="bj-hand">
            {player.length ? (
              player.map((c, i) => (
                <PlayingCard key={`${c.rank}${c.suit}${i}`} card={c} delay={i * 110} />
              ))
            ) : (
              <div style={{ height: 112 }} />
            )}
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="wager-group">
          <span className="wager-label">Wager</span>
          {WAGERS.map((v) => (
            <Chip
              key={v}
              value={v}
              small
              selected={wager === v}
              onClick={() => {
                if (phase !== 'bet') return
                setWager(v)
              }}
            />
          ))}
        </div>

        {phase === 'bet' ? (
          <button className="btn btn-gold" onClick={deal} disabled={wager > bank.credits}>
            Deal · {bank.format(wager)}
          </button>
        ) : null}

        {phase === 'player' ? (
          <>
            <button className="btn btn-gold" onClick={hit} disabled={busy}>
              Hit
            </button>
            <button className="btn btn-ghost" onClick={stand} disabled={busy}>
              Stand
            </button>
            <button
              className="btn btn-ghost"
              onClick={double}
              disabled={busy || player.length !== 2 || stake > bank.credits}
            >
              Double
            </button>
          </>
        ) : null}

        {phase === 'over' ? (
          <button className="btn btn-gold" onClick={nextHand}>
            Next hand
          </button>
        ) : null}

        <div className="controls-spacer" />
        <span className="meta-line">
          In play · {bank.format(stake)}
        </span>
      </div>
    </GameShell>
  )
}
