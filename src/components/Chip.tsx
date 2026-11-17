import type { ReactNode } from 'react'

/** Muted ring colours for the flat betting tokens. */
const CHIP_TONES: Record<number, string> = {
  1: '#8d9299',
  5: '#a5453c',
  25: '#2f6b56',
  100: '#3b4a6b',
  500: '#6b4557',
}

export function chipTone(value: number) {
  return CHIP_TONES[value] ?? '#8d9299'
}

type ChipProps = {
  value: number
  selected?: boolean
  small?: boolean
  onClick?: () => void
  title?: string
  disabled?: boolean
  children?: ReactNode
}

/** A flat betting token. Renders as a button when clickable. */
export default function Chip({ value, selected, small, onClick, title, disabled }: ChipProps) {
  const tone = chipTone(value)
  const cls = `chip ${small ? 'chip--sm' : ''} ${selected ? 'is-selected' : ''}`
  const style = { '--chip-color': tone } as React.CSSProperties

  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        style={style}
        onClick={onClick}
        title={title ?? `Wager ${value}`}
        aria-pressed={Boolean(selected)}
        aria-label={`Wager ${value}`}
        disabled={disabled}
      >
        <span className="chip-inner">{value}</span>
      </button>
    )
  }

  return (
    <div className={cls} style={style}>
      <span className="chip-inner">{value}</span>
    </div>
  )
}

/** Compact stack of tokens used as a bet marker on the layout. */
export function ChipStack({ total }: { total: number }) {
  const denoms = [500, 100, 25, 5, 1]
  const stack: number[] = []
  let left = total
  for (const d of denoms) {
    while (left >= d && stack.length < 5) {
      stack.push(d)
      left -= d
    }
  }
  if (!stack.length) return null
  return (
    <div className="chip-stack">
      {stack.map((v, i) => (
        <Chip key={i} value={v} small />
      ))}
    </div>
  )
}
