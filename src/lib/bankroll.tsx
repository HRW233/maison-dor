import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const STARTING_CREDITS: number = 2500
const STORAGE_KEY = 'maison-dor.bankroll.v1'

export type Stats = {
  hands: number
  biggestWin: number
  wagered: number
}

type BankrollState = {
  credits: number
  stats: Stats
}

type BankrollApi = BankrollState & {
  /** Add chips (wins, comps). */
  credit: (amount: number) => void
  /** Remove a wager. Returns true when the wager was covered. */
  debit: (amount: number) => boolean
  recordWin: (amount: number) => void
  claimComp: () => void
  reset: () => void
  format: (amount: number) => string
}

const defaultState: BankrollState = {
  credits: STARTING_CREDITS,
  stats: { hands: 0, biggestWin: 0, wagered: 0 },
}

function load(): BankrollState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<BankrollState>
    if (typeof parsed.credits !== 'number' || !Number.isFinite(parsed.credits)) return defaultState
    return {
      credits: Math.max(0, Math.floor(parsed.credits)),
      stats: {
        hands: parsed.stats?.hands ?? 0,
        biggestWin: parsed.stats?.biggestWin ?? 0,
        wagered: parsed.stats?.wagered ?? 0,
      },
    }
  } catch {
    return defaultState
  }
}

const BankrollContext = createContext<BankrollApi | null>(null)

/**
 * The bankroll is mirrored in a ref so that wagers can be approved
 * synchronously inside event handlers (React state updates are async, so an
 * `if (credits < wager)` check against state would be stale).
 */
export function BankrollProvider({ children }: { children: ReactNode }) {
  const store = useRef<BankrollState>(defaultState)
  const [state, setState] = useState<BankrollState>(defaultState)

  // Hydrate from storage after mount so the first render is deterministic.
  useEffect(() => {
    const loaded = load()
    store.current = loaded
    setState(loaded)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* private mode / storage disabled — the session still plays fine */
    }
  }, [state])

  const commit = useCallback((next: BankrollState) => {
    store.current = next
    setState(next)
  }, [])

  const debit = useCallback(
    (amount: number) => {
      const s = store.current
      if (amount <= 0 || s.credits < amount) return false
      commit({
        credits: s.credits - amount,
        stats: { ...s.stats, wagered: s.stats.wagered + amount },
      })
      return true
    },
    [commit],
  )

  const credit = useCallback(
    (amount: number) => {
      if (!amount) return
      const s = store.current
      commit({ ...s, credits: Math.max(0, Math.round(s.credits + amount)) })
    },
    [commit],
  )

  const recordWin = useCallback(
    (amount: number) => {
      if (amount <= 0) return
      const s = store.current
      commit({
        ...s,
        stats: {
          ...s.stats,
          hands: s.stats.hands + 1,
          biggestWin: Math.max(s.stats.biggestWin, Math.round(amount)),
        },
      })
    },
    [commit],
  )

  const claimComp = useCallback(() => {
    const s = store.current
    commit({ ...s, credits: s.credits + 1000 })
  }, [commit])

  const reset = useCallback(() => {
    commit({ credits: STARTING_CREDITS, stats: { hands: 0, biggestWin: 0, wagered: 0 } })
  }, [commit])

  const format = useCallback(
    (amount: number) =>
      new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount)),
    [],
  )

  const value = useMemo<BankrollApi>(
    () => ({ ...state, credit, debit, recordWin, claimComp, reset, format }),
    [state, credit, debit, recordWin, claimComp, reset, format],
  )

  return <BankrollContext.Provider value={value}>{children}</BankrollContext.Provider>
}

export function useBankroll(): BankrollApi {
  const ctx = useContext(BankrollContext)
  if (!ctx) throw new Error('useBankroll must be used inside BankrollProvider')
  return ctx
}
