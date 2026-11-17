import { shuffle } from './rng'

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const
export type Suit = (typeof SUITS)[number]

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export type Rank = (typeof RANKS)[number]

export type Card = { rank: Rank; suit: Suit }

export const SUIT_GLYPH: Record<Suit, string> = {
  spades: '\u2660',
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
}

export const isRedSuit = (s: Suit) => s === 'hearts' || s === 'diamonds'

/** Pip positions (percent of the card face) for number cards. */
export const PIP_LAYOUT: Record<string, [number, number][]> = {
  A: [[50, 50]],
  '2': [
    [50, 18],
    [50, 82],
  ],
  '3': [
    [50, 18],
    [50, 50],
    [50, 82],
  ],
  '4': [
    [30, 18],
    [70, 18],
    [30, 82],
    [70, 82],
  ],
  '5': [
    [30, 18],
    [70, 18],
    [50, 50],
    [30, 82],
    [70, 82],
  ],
  '6': [
    [30, 18],
    [70, 18],
    [30, 50],
    [70, 50],
    [30, 82],
    [70, 82],
  ],
  '7': [
    [30, 18],
    [70, 18],
    [50, 34],
    [30, 50],
    [70, 50],
    [30, 82],
    [70, 82],
  ],
  '8': [
    [30, 18],
    [70, 18],
    [50, 34],
    [30, 50],
    [70, 50],
    [50, 66],
    [30, 82],
    [70, 82],
  ],
  '9': [
    [30, 14],
    [70, 14],
    [30, 38],
    [70, 38],
    [50, 50],
    [30, 62],
    [70, 62],
    [30, 86],
    [70, 86],
  ],
  '10': [
    [30, 14],
    [70, 14],
    [50, 26],
    [30, 38],
    [70, 38],
    [30, 62],
    [70, 62],
    [50, 74],
    [30, 86],
    [70, 86],
  ],
}

/** Single 52-card deck. */
export function freshDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit })
  return shuffle(deck)
}

/** Multi-deck shoe. */
export function freshShoe(decks = 6): Card[] {
  const shoe: Card[] = []
  for (let d = 0; d < decks; d++) shoe.push(...freshDeck())
  return shuffle(shoe)
}

/** Blackjack value of a rank. */
export function cardValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10
  return parseInt(rank, 10)
}

/** Blackjack hand total plus whether an ace is still counted as 11. */
export function handTotal(cards: Card[]): { total: number; soft: boolean } {
  let total = 0
  let aces = 0
  for (const c of cards) {
    total += cardValue(c.rank)
    if (c.rank === 'A') aces++
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return { total, soft: aces > 0 }
}

/** Baccarat card value (tens and pictures count zero, totals taken mod 10). */
export function baccaratValue(rank: Rank): number {
  if (rank === 'A') return 1
  if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return 0
  return parseInt(rank, 10)
}

export const baccaratTotal = (cards: Card[]) =>
  cards.reduce((s, c) => s + baccaratValue(c.rank), 0) % 10
