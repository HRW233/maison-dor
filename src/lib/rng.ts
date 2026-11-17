// Cryptographically seeded randomness. Every draw in the house games uses
// these helpers so results are not biased by Math.random's generator state.

const buf = new Uint32Array(1)

/** Uniform integer in [0, max) using rejection sampling (no modulo bias). */
export function randInt(max: number): number {
  if (max <= 0) return 0
  const limit = Math.floor(0xffffffff / max) * max
  let v = 0
  do {
    crypto.getRandomValues(buf)
    v = buf[0]
  } while (v >= limit)
  return v % max
}

/** Uniform float in [0, 1). */
export function randFloat(): number {
  crypto.getRandomValues(buf)
  return buf[0] / 0x100000000
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(input: readonly T[]): T[] {
  const a = input.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

/** Pick an index according to weights. */
export function weightedIndex(weights: readonly number[]): number {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = randFloat() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}
