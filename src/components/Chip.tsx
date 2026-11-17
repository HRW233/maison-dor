import type { ReactNode } from 'react'

const CHIP_TONES: Record<number, { color: string; ink: string }> = {
  1: { color: '#dcd3bd', ink: '#2a2418' },
  5: { color: '#a3192f', ink: '#fff4ee' },
  25: { color: '#166b4f', ink: '#f2fff8' },
  100: { color: '#1c2a44', ink: '#eef3ff' },
  500: { color: '#6b2a72', ink: '#fdf1ff' },
}

export function chipTone(value: number) {
  return CHIP_TONES[value] ?? { color: '#8a7a55', ink: '#fffaf0' }
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

/** A casino chip. Renders as a button when clickable. */
export default function Chip({ value, selected, small, onClick, title, disabled }: ChipProps) {
  const tone = chipTone(value)
  const cls = `chip ${small ? 'chip--sm' : ''} ${selected ? 'is-selected' : ''}`
  const style = {
    '--chip-color': tone.color,
    '--chip-ink': tone.ink,
    background: `radial-gradient(circle at 50% 50%, #f7f0e0 0 34%, ${tone.color} 35% 62%, #f2e8d5 63% 66%, ${tone.color} 67% 100%)`,
  } as React.CSSProperties

  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        style={style}
        onClick={onClick}
        title={title ?? `Wager ${value}`}
        aria-pressed={Boolean(selected)}
        aria-label={`Chip ${value}`}
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

/** Compact stack of chips used as a bet marker on the felt. */
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
