import type { ReactNode } from 'react'

type Tone = 'green' | 'ruby' | 'noir' | 'teal'

type Props = {
  eyebrow?: string
  title: string
  subtitle: string
  rules?: string[]
  tone?: Tone
  children: ReactNode
}

const TONE_CLASS: Record<Tone, string> = {
  green: '',
  ruby: 'table--ruby',
  noir: 'table--noir',
  teal: 'table--teal',
}

/** The baize table that every game is presented on. */
export default function GameShell({ eyebrow, title, subtitle, rules = [], tone = 'green', children }: Props) {
  return (
    <div className="table-wrap">
      <section className={`table ${TONE_CLASS[tone]}`}>
        <div className="table-head">
          <div>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2 className="game-title">{title}</h2>
            <p className="game-sub">{subtitle}</p>
          </div>
          {rules.length ? (
            <div className="rules">
              {rules.map((r) => (
                <span className="rule-pill" key={r}>
                  {r}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {children}
      </section>
    </div>
  )
}
