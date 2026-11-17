export type View = 'floor' | 'blackjack' | 'roulette' | 'slots' | 'poker' | 'baccarat'

export type GameMeta = {
  key: Exclude<View, 'floor'>
  index: string
  name: string
  short: string
  blurb: string
  meta: string
  glow: string
}

export const GAMES: GameMeta[] = [
  {
    key: 'blackjack',
    index: '01',
    name: 'Blackjack',
    short: 'Blackjack',
    blurb:
      'Six decks, dealer stands on soft seventeen, blackjack paid three to two. Beat the house to twenty-one.',
    meta: '6 decks · 3:2',
    glow: 'radial-gradient(90% 70% at 18% 0%, rgba(22, 122, 92, 0.55), transparent 68%)',
  },
  {
    key: 'roulette',
    index: '02',
    name: 'European Roulette',
    short: 'Roulette',
    blurb:
      'A single-zero wheel in the classic Monte Carlo order. Lay chips across the felt and let the ivory ball decide.',
    meta: '37 pockets · 35:1',
    glow: 'radial-gradient(90% 70% at 18% 0%, rgba(168, 22, 44, 0.55), transparent 68%)',
  },
  {
    key: 'slots',
    index: '03',
    name: 'Gilded Reels',
    short: 'Slots',
    blurb:
      'Five reels, nine brass symbols, five fixed paylines. Three crowns on a line is the dream of the floor.',
    meta: '5 reels · 5 lines',
    glow: 'radial-gradient(90% 70% at 18% 0%, rgba(150, 108, 24, 0.5), transparent 68%)',
  },
  {
    key: 'poker',
    index: '04',
    name: 'Video Poker',
    short: 'Poker',
    blurb:
      'Jacks or Better on a nine-six pay table. Hold what serves you, draw again, and let the machine read your hand.',
    meta: '52 cards · 9/6',
    glow: 'radial-gradient(90% 70% at 18% 0%, rgba(13, 94, 99, 0.6), transparent 68%)',
  },
  {
    key: 'baccarat',
    index: '05',
    name: 'Baccarat',
    short: 'Baccarat',
    blurb:
      'The salon game. Back the Player, the Banker or the Tie, then watch the shoe deal itself out of your hands.',
    meta: '8 decks · 8:1 tie',
    glow: 'radial-gradient(90% 70% at 18% 0%, rgba(120, 32, 96, 0.45), transparent 68%)',
  },
]
