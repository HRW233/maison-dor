import { useEffect, useRef, useState } from 'react'
import Chip from '../components/Chip'
import GameShell from '../components/GameShell'
import { useBankroll } from '../lib/bankroll'
import { randFloat, randInt } from '../lib/rng'

/** Monte Carlo (single zero) pocket order. */
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
const STEP = 360 / 37

type PocketColor = 'red' | 'black' | 'green'
const colorOf = (n: number): PocketColor => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black')

type BetTemplate = { label: string; numbers: number[]; odds: number }

const redNumbers = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => RED.has(n))
const blackNumbers = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => !RED.has(n))

const TEMPLATES: Record<string, BetTemplate> = {
  red: { label: 'Red', numbers: redNumbers, odds: 1 },
  black: { label: 'Black', numbers: blackNumbers, odds: 1 },
  odd: { label: 'Odd', numbers: Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 === 1), odds: 1 },
  even: { label: 'Even', numbers: Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 === 0), odds: 1 },
  low: { label: '1 to 18', numbers: Array.from({ length: 18 }, (_, i) => i + 1), odds: 1 },
  high: { label: '19 to 36', numbers: Array.from({ length: 18 }, (_, i) => i + 19), odds: 1 },
  d1: { label: '1st dozen', numbers: Array.from({ length: 12 }, (_, i) => i + 1), odds: 2 },
  d2: { label: '2nd dozen', numbers: Array.from({ length: 12 }, (_, i) => i + 13), odds: 2 },
  d3: { label: '3rd dozen', numbers: Array.from({ length: 12 }, (_, i) => i + 25), odds: 2 },
  c1: { label: 'Column 1', numbers: Array.from({ length: 12 }, (_, i) => i * 3 + 1), odds: 2 },
  c2: { label: 'Column 2', numbers: Array.from({ length: 12 }, (_, i) => i * 3 + 2), odds: 2 },
  c3: { label: 'Column 3', numbers: Array.from({ length: 12 }, (_, i) => i * 3 + 3), odds: 2 },
}
for (let n = 0; n <= 36; n++) {
  TEMPLATES[`n${n}`] = { label: String(n), numbers: [n], odds: 35 }
}

type PlacedBet = { id: string; amount: number }

const polar = (r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return [120 + r * Math.cos(rad), 120 + r * Math.sin(rad)] as const
}

function pocketPath(i: number) {
  const a1 = (i - 0.5) * STEP
  const a2 = (i + 0.5) * STEP
  const [x1, y1] = polar(113, a1)
  const [x2, y2] = polar(113, a2)
  const [x3, y3] = polar(78, a2)
  const [x4, y4] = polar(78, a1)
  return `M ${x1} ${y1} A 113 113 0 0 1 ${x2} ${y2} L ${x3} ${y3} A 78 78 0 0 0 ${x4} ${y4} Z`
}

export default function Roulette() {
  const bank = useBankroll()
  const [chip, setChip] = useState(25)
  const [bets, setBets] = useState<PlacedBet[]>([])
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [ball, setBall] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [message, setMessage] = useState('Lay your chips on the felt')
  const [tone, setTone] = useState<'info' | 'win' | 'loss'>('info')
  const timer = useRef<number | null>(null)

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  const total = bets.reduce((s, b) => s + b.amount, 0)
  const amountOn = (id: string) => bets.find((b) => b.id === id)?.amount ?? 0

  const place = (id: string) => {
    if (spinning) return
    if (!bank.debit(chip)) {
      setMessage('Not enough credits for that bet.')
      setTone('loss')
      return
    }
    setMessage('')
    setTone('info')
    setBets((prev) => {
      const existing = prev.find((b) => b.id === id)
      if (existing) return prev.map((b) => (b.id === id ? { ...b, amount: b.amount + chip } : b))
      return [...prev, { id, amount: chip }]
    })
  }

  const undo = () => {
    if (spinning) return
    const last = bets[bets.length - 1]
    if (!last) return
    bank.credit(last.amount)
    setBets((prev) => prev.slice(0, -1))
  }

  const clear = () => {
    if (spinning) return
    bank.credit(total)
    setBets([])
    setResult(null)
    setMessage('Lay your chips on the felt')
    setTone('info')
  }

  const spin = () => {
    if (spinning) return
    if (total <= 0) {
      setMessage('Place at least one credit before the wheel spins.')
      setTone('loss')
      return
    }

    const index = randInt(WHEEL_ORDER.length)
    const winning = WHEEL_ORDER[index]
    const jitter = (randFloat() - 0.5) * STEP * 0.55

    setSpinning(true)
    setResult(null)
    setMessage('')
    setTone('info')

    // Rotate the wheel so the winning pocket finishes under the pointer.
    const targetMod = ((360 - index * STEP) % 360 + 360) % 360
    setRotation((prev) => {
      const delta = ((targetMod - (prev % 360)) + 360) % 360
      return prev + 360 * 6 + delta + jitter
    })
    setBall((prev) => prev + 360 * 9)

    timer.current = window.setTimeout(() => {
      const returns = bets.reduce((sum, b) => {
        const tpl = TEMPLATES[b.id]
        if (!tpl || !tpl.numbers.includes(winning)) return sum
        return sum + Math.round(b.amount * (tpl.odds + 1))
      }, 0)
      const profit = returns - total
      bank.credit(returns)
      if (returns > 0) bank.recordWin(returns)
      setBets([])
      setResult(winning)
      setSpinning(false)
      if (returns > 0) {
        setMessage(`${winning} ${colorOf(winning)} — ${bank.format(returns)} credits back (${profit > 0 ? '+' : ''}${bank.format(profit)}).`)
        setTone(profit >= 0 ? 'win' : 'info')
      } else {
        setMessage(`${winning} ${colorOf(winning)}. The house collects.`)
        setTone('loss')
      }
    }, 5200)
  }

  const numbers = Array.from({ length: 12 }, (_, c) => c)

  return (
    <GameShell
      eyebrow="Table two"
      title="European Roulette"
      subtitle="One green zero, thirty-six pockets around a brass wheel. Straight numbers pay thirty-five to one; dozens and columns pay two to one."
      rules={['Single zero', '35:1 straight', '2:1 dozens']}
      tone="ruby"
    >
      <div className="roulette-layout">
        <div className="wheel-panel">
          <div className="wheel">
            <div className="wheel-pointer" />
            <svg viewBox="0 0 240 240" aria-label="Roulette wheel">
              <defs>
                <linearGradient id="rimGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e4e0d8" />
                  <stop offset="45%" stopColor="#b8b2a6" />
                  <stop offset="100%" stopColor="#6f6b63" />
                </linearGradient>
                <radialGradient id="hubWood" cx="42%" cy="32%">
                  <stop offset="0%" stopColor="#f8f6f1" />
                  <stop offset="55%" stopColor="#e8e4db" />
                  <stop offset="100%" stopColor="#d7d2c7" />
                </radialGradient>
                <radialGradient id="hubGold" cx="40%" cy="30%">
                  <stop offset="0%" stopColor="#f5f2ec" />
                  <stop offset="55%" stopColor="#d9d3c6" />
                  <stop offset="100%" stopColor="#a9a39a" />
                </radialGradient>
              </defs>

              <circle cx="120" cy="120" r="118" fill="url(#hubWood)" />
              <circle cx="120" cy="120" r="116" fill="none" stroke="url(#rimGold)" strokeWidth="1.6" />
              <circle cx="120" cy="120" r="114" fill="none" stroke="rgba(0,0,0,.6)" strokeWidth="1.4" />

              <g
                className="wheel-rotor"
                style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '120px 120px' }}
              >
                {WHEEL_ORDER.map((n, i) => {
                  const c = colorOf(n)
                  const fill = c === 'red' ? '#a5453c' : c === 'black' ? '#2b2d31' : '#2f6b56'
                  const [tx, ty] = polar(96, i * STEP)
                  return (
                    <g key={n}>
                      <path d={pocketPath(i)} fill={fill} stroke="rgba(251,250,247,.26)" strokeWidth="0.4" />
                      <text
                        x={tx}
                        y={ty}
                        fill="#f7efdc"
                        fontSize="7.2"
                        fontFamily="Cinzel, serif"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${i * STEP} ${tx} ${ty})`}
                      >
                        {n}
                      </text>
                    </g>
                  )
                })}
                <circle cx="120" cy="120" r="77" fill="none" stroke="rgba(22,24,28,.18)" strokeWidth="1.2" />
                <circle cx="120" cy="120" r="64" fill="url(#hubWood)" stroke="rgba(22,24,28,.16)" strokeWidth="0.9" />
                <circle cx="120" cy="120" r="46" fill="none" stroke="rgba(22,24,28,.12)" strokeWidth="0.7" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={i}
                    x1="120"
                    y1="74"
                    x2="120"
                    y2="86"
                    stroke="url(#rimGold)"
                    strokeWidth="0.8"
                    transform={`rotate(${i * 45} 120 120)`}
                  />
                ))}
                <circle cx="120" cy="120" r="17" fill="url(#hubGold)" />
                <circle cx="120" cy="120" r="13" fill="none" stroke="rgba(22,24,28,.22)" strokeWidth="0.8" />
                <text
                  x="120"
                  y="123"
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="Cinzel, serif"
                  fill="#4b5057"
                  letterSpacing="1"
                >
                  37
                </text>
              </g>

              <g
                className="wheel-ball-track"
                style={{ transform: `rotate(${ball}deg)`, transformOrigin: '120px 120px' }}
              >
                <circle cx="120" cy="11" r="4.4" fill="#ffffff" stroke="#2b2d31" strokeWidth="0.7" />
                <circle cx="118.6" cy="9.6" r="1.4" fill="#ffffff" />
              </g>
              <circle cx="120" cy="120" r="3.4" fill="url(#rimGold)" />
            </svg>
          </div>

          <div className="wheel-result">
            {result !== null ? (
              <>
                <span className={`result-orb is-${colorOf(result)}`}>{result}</span>
                <span className="hint-line">
                  {colorOf(result) === 'green' ? 'Zero' : colorOf(result)} · {result === 0 ? 'house pocket' : result % 2 === 0 ? 'even' : 'odd'}
                </span>
              </>
            ) : (
              <span className="hint-line">
                {spinning ? 'No more bets…' : 'Wheel at rest'}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="board-scroll">
            <div className="board">
              <button
                className={`cell cell--zero is-green ${result === 0 ? 'is-winning' : ''}`}
                style={{ gridColumn: 1, gridRow: '1 / 4' }}
                onClick={() => place('n0')}
                aria-label="Bet on zero"
              >
                0
                {amountOn('n0') ? (
                  <span className="cell-chip">
                    <Chip value={amountOn('n0')} small />
                  </span>
                ) : null}
              </button>

              {numbers.map((c) =>
                [0, 1, 2].map((r) => {
                  const n = c * 3 + (3 - r)
                  const col = colorOf(n)
                  const id = `n${n}`
                  return (
                    <button
                      key={id}
                      className={`cell is-${col} ${result === n ? 'is-winning' : ''}`}
                      style={{ gridColumn: c + 2, gridRow: r + 1 }}
                      onClick={() => place(id)}
                      aria-label={`Bet on ${n}`}
                    >
                      {n}
                      {amountOn(id) ? (
                        <span className="cell-chip">
                          <Chip value={amountOn(id)} small />
                        </span>
                      ) : null}
                    </button>
                  )
                }),
              )}

              {[0, 1, 2].map((r) => {
                const id = `c${3 - r}`
                return (
                  <button
                    key={id}
                    className="cell cell--col"
                    style={{ gridColumn: 14, gridRow: r + 1 }}
                    onClick={() => place(id)}
                    aria-label={`Column ${3 - r} pays 2 to 1`}
                  >
                    2:1
                    {amountOn(id) ? (
                      <span className="cell-chip">
                        <Chip value={amountOn(id)} small />
                      </span>
                    ) : null}
                  </button>
                )
              })}

              {[
                { id: 'd1', label: '1st 12', col: '2 / 6' },
                { id: 'd2', label: '2nd 12', col: '6 / 10' },
                { id: 'd3', label: '3rd 12', col: '10 / 14' },
              ].map((d) => (
                <button
                  key={d.id}
                  className="cell cell--dozen"
                  style={{ gridColumn: d.col, gridRow: 4 }}
                  onClick={() => place(d.id)}
                >
                  {d.label}
                  {amountOn(d.id) ? (
                    <span className="cell-chip">
                      <Chip value={amountOn(d.id)} small />
                    </span>
                  ) : null}
                </button>
              ))}

              {[
                { id: 'low', label: '1 to 18', col: '2 / 4' },
                { id: 'even', label: 'Even', col: '4 / 6' },
                { id: 'red', label: 'Red', col: '6 / 8', ruby: true },
                { id: 'black', label: 'Black', col: '8 / 10' },
                { id: 'odd', label: 'Odd', col: '10 / 12' },
                { id: 'high', label: '19 to 36', col: '12 / 14' },
              ].map((o) => (
                <button
                  key={o.id}
                  className="cell cell--outside"
                  style={{
                    gridColumn: o.col,
                    gridRow: 5,
                    ...(o.ruby
                      ? { background: '#f7e8e4', borderColor: '#ecd3cd', color: '#8f3b33' }
                      : null),
                  }}
                  onClick={() => place(o.id)}
                >
                  {o.label}
                  {amountOn(o.id) ? (
                    <span className="cell-chip">
                      <Chip value={amountOn(o.id)} small />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="bet-summary">
            {bets.length === 0 ? (
              <span className="hint-line">
                No credits on the layout
              </span>
            ) : (
              bets.map((b) => (
                <span className="bet-tag" key={b.id}>
                  {TEMPLATES[b.id]?.label ?? b.id} <b>{bank.format(b.amount)}</b>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`table-message ${tone === 'win' ? 'is-win' : tone === 'loss' ? 'is-loss' : ''}`} style={{ marginTop: 18, fontSize: 'clamp(12px,1.4vw,15px)' }}>
        {message}
      </div>

      <div className="controls">
        <div className="wager-group">
          <span className="wager-label">Wager</span>
          {[1, 5, 25, 100].map((v) => (
            <Chip key={v} value={v} small selected={chip === v} onClick={() => setChip(v)} />
          ))}
        </div>
        <button className="btn btn-gold" onClick={spin} disabled={spinning || total === 0}>
          {spinning ? 'Spinning…' : 'Spin the wheel'}
        </button>
        <button className="btn btn-ghost" onClick={undo} disabled={spinning || !bets.length}>
          Undo
        </button>
        <button className="btn btn-ghost" onClick={clear} disabled={spinning || !bets.length}>
          Clear
        </button>
        <div className="controls-spacer" />
        <span className="meta-line">
          On the felt · {bank.format(total)}
        </span>
      </div>
    </GameShell>
  )
}
