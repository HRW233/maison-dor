import { useEffect, useRef, useState } from 'react'
import Chip from '../components/Chip'
import GameShell from '../components/GameShell'
import { useBankroll } from '../lib/bankroll'
import { weightedIndex } from '../lib/rng'

type SymbolId =
  | 'crown'
  | 'star'
  | 'seven'
  | 'diamond'
  | 'bell'
  | 'bar'
  | 'horseshoe'
  | 'cherry'
  | 'coin'

type SymbolDef = { id: SymbolId; glyph: string; weight: number; pays: [number, number, number] }

const SYMBOLS: SymbolDef[] = [
  { id: 'crown', glyph: '\u265B', weight: 2, pays: [40, 150, 600] },
  { id: 'star', glyph: '\u2605', weight: 4, pays: [20, 80, 300] },
  { id: 'seven', glyph: '7', weight: 6, pays: [12, 50, 200] },
  { id: 'diamond', glyph: '\u25C6', weight: 8, pays: [10, 40, 150] },
  { id: 'bell', glyph: '\u269C', weight: 11, pays: [8, 25, 100] },
  { id: 'bar', glyph: 'BAR', weight: 13, pays: [6, 18, 70] },
  { id: 'horseshoe', glyph: '\u2756', weight: 16, pays: [4, 12, 45] },
  { id: 'cherry', glyph: '\u2663', weight: 20, pays: [3, 8, 25] },
  { id: 'coin', glyph: '\u2726', weight: 22, pays: [2, 5, 15] },
]

const WEIGHTS = SYMBOLS.map((s) => s.weight)
const GLYPH: Record<SymbolId, string> = SYMBOLS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.glyph }),
  {} as Record<SymbolId, string>,
)
const PAYS: Record<SymbolId, [number, number, number]> = SYMBOLS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.pays }),
  {} as Record<SymbolId, [number, number, number]>,
)

const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
]

const randomSymbol = (): SymbolId => SYMBOLS[weightedIndex(WEIGHTS)].id

function randomGrid(): SymbolId[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 3 }, randomSymbol))
}

type Win = { line: number; symbol: SymbolId; count: number; amount: number }

function evaluateGrid(grid: SymbolId[][], betPerLine: number) {
  let total = 0
  const wins: Win[] = []
  const hits = new Set<string>()

  PAYLINES.forEach((line, li) => {
    const first = grid[0][line[0]]
    let count = 1
    for (let reel = 1; reel < 5; reel++) {
      if (grid[reel][line[reel]] === first) count++
      else break
    }
    if (count >= 3) {
      const amount = PAYS[first][count - 3] * betPerLine
      total += amount
      wins.push({ line: li + 1, symbol: first, count, amount })
      for (let reel = 0; reel < count; reel++) hits.add(`${reel}-${line[reel]}`)
    }
  })

  return { total, wins, hits }
}

const CELL = 'clamp(56px, 8.2vw, 82px)'

export default function Slots() {
  const bank = useBankroll()
  const [betPerLine, setBetPerLine] = useState(2)
  const [grid, setGrid] = useState<SymbolId[][]>(randomGrid)
  const [strips, setStrips] = useState<SymbolId[][] | null>(null)
  const [go, setGo] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [win, setWin] = useState<{ total: number; wins: Win[] } | null>(null)
  const [hits, setHits] = useState<Set<string>>(new Set())
  const timers = useRef<number[]>([])

  const totalBet = betPerLine * PAYLINES.length

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const spin = () => {
    if (spinning) return
    if (!bank.debit(totalBet)) return

    const final = randomGrid()
    const nextStrips = final.map((col) => [
      ...Array.from({ length: 9 }, randomSymbol),
      ...col,
    ])

    setWin(null)
    setHits(new Set())
    setStrips(nextStrips)
    setGo(false)
    setSpinning(true)

    requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)))

    timers.current.push(
      window.setTimeout(() => {
        const result = evaluateGrid(final, betPerLine)
        setGrid(final)
        setStrips(null)
        setGo(false)
        setSpinning(false)
        setWin({ total: result.total, wins: result.wins })
        setHits(result.hits)
        if (result.total > 0) {
          bank.credit(result.total)
          bank.recordWin(result.total)
        }
      }, 160 * 4 + 1620),
    )
  }

  const strongest = win?.wins.length
    ? win.wins.reduce((a, b) => (b.amount > a.amount ? b : a))
    : null

  return (
    <GameShell
      eyebrow="Table three"
      title="Five Reels"
      subtitle="Five reels on five fixed paylines. Three or more matching symbols from the left reel pay, and five crowns pays six hundred times the line."
      rules={['5 paylines', 'Left to right', 'Crowns 600×']}
      tone="noir"
    >
      <div className="slot-cabinet">
        <div className="reels-frame" style={{ ['--cell' as string]: CELL }}>
          {[0, 1, 2, 3, 4].map((reel) => {
            const col = strips ? strips[reel] : grid[reel]
            return (
              <div className="reel" key={reel}>
                <div
                  className="reel-strip"
                  style={{
                    transform: strips && go ? 'translateY(calc(var(--cell) * -9))' : 'translateY(0)',
                    transition:
                      strips && go
                        ? `transform 1560ms cubic-bezier(.16,.74,.12,1) ${reel * 150}ms`
                        : 'none',
                  }}
                >
                  {col.map((sym, row) => {
                    const isHit = !strips && hits.has(`${reel}-${row}`)
                    return (
                      <div className={`symbol sym--${sym} ${isHit ? 'is-hit' : ''}`} key={`${reel}-${row}-${sym}`}>
                        <div className="symbol-art">
                          <span className="glyph">{GLYPH[sym]}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="paylines-readout">
          {spinning ? (
            <span className="payline-chip">Reels in motion</span>
          ) : win && win.wins.length ? (
            win.wins.map((w) => (
              <span className="payline-chip" key={w.line}>
                Line {w.line} · {w.count}× {w.symbol} · {bank.format(w.amount)}
              </span>
            ))
          ) : null}
        </div>

        <div className="slot-win">
          {spinning ? (
            <span className="hint-line">
              Good luck
            </span>
          ) : win && win.total > 0 ? (
            <>
              <div className="slot-win-amount">{bank.format(win.total)}</div>
              <span className="hint-line">
                {strongest ? `${strongest.count} ${strongest.symbol} on line ${strongest.line}` : 'Winner'}
              </span>
            </>
          ) : (
            <span className="hint-line">
              {win ? 'No line this spin' : 'Five reels · five lines'}
            </span>
          )}
        </div>
      </div>

      <div className="paytable">
        {SYMBOLS.map((s) => (
          <div className="paytable-row" key={s.id}>
            <span>
              {s.glyph} {s.id}
            </span>
            <b>
              {s.pays[0]} / {s.pays[1]} / {s.pays[2]}
            </b>
          </div>
        ))}
      </div>

      <div className="controls">
        <div className="wager-group">
          <span className="wager-label">Per line</span>
          {[1, 2, 5, 10].map((v) => (
            <Chip
              key={v}
              value={v}
              small
              selected={betPerLine === v}
              onClick={() => {
                if (!spinning) setBetPerLine(v)
              }}
            />
          ))}
        </div>

        <button className="btn btn-gold" onClick={spin} disabled={spinning || totalBet > bank.credits}>
          {spinning ? 'Spinning…' : `Spin · ${bank.format(totalBet)}`}
        </button>

        <div className="controls-spacer" />
        <span className="meta-line">
          {PAYLINES.length} lines · {bank.format(totalBet)} total
        </span>
      </div>
    </GameShell>
  )
}
