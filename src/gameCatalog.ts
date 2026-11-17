export type View = 'floor' | 'blackjack' | 'roulette' | 'slots' | 'poker' | 'baccarat'

export type GameMeta = {
  key: Exclude<View, 'floor'>
  index: string
  name: string
  short: string
  blurb: string
  meta: string
}

export const GAMES: GameMeta[] = [
  {
    key: 'blackjack',
    index: '01',
    name: 'Blackjack',
    short: 'Blackjack',
    blurb:
      'Six decks, dealer stands on all seventeens, blackjack pays three to two. Hit, stand or double any two cards.',
    meta: '6 decks · 3:2',
  },
  {
    key: 'roulette',
    index: '02',
    name: 'European Roulette',
    short: 'Roulette',
    blurb:
      'A single-zero wheel. Lay credits across the layout and watch the ball settle — straight numbers pay 35 to 1.',
    meta: '37 pockets · 35:1',
  },
  {
    key: 'slots',
    index: '03',
    name: 'Five Reels',
    short: 'Slots',
    blurb:
      'Five reels, five fixed paylines. Match three or more from the left on any line; five crowns pays 600 times the line.',
    meta: '5 reels · 5 lines',
  },
  {
    key: 'poker',
    index: '04',
    name: 'Video Poker',
    short: 'Poker',
    blurb:
      'Jacks or Better on a nine-six pay table. Hold the cards you keep, draw again, and the hand is scored for you.',
    meta: '52 cards · 9/6',
  },
  {
    key: 'baccarat',
    index: '05',
    name: 'Baccarat',
    short: 'Baccarat',
    blurb:
      'Back the Player, the Banker or the Tie. Eight-deck shoe with standard third-card rules and a five per cent banker commission.',
    meta: '8 decks · 8:1 tie',
  },
]
