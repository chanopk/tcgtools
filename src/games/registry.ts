import type { GameDef } from './types'

const palworld: GameDef = {
  id: 'palworld',
  name: 'Palworld',
  subtitle: 'Official Card Game',
  emoji: '🐾',
  ready: true,
  counters: [
    {
      key: 'life',
      label: 'Life',
      hint: 'เหลือ 0 = แพ้',
      initial: 10,
      min: 0,
      max: 99,
      step: 1,
      role: 'primary',
    },
    {
      key: 'material',
      label: 'Material',
      hint: 'วัตถุดิบ',
      initial: 0,
      min: 0,
      max: 99,
      step: 1,
      role: 'resource',
    },
    {
      key: 'ingredient',
      label: 'Ingredient',
      hint: 'ส่วนผสม',
      initial: 0,
      min: 0,
      max: 99,
      step: 1,
      role: 'resource',
    },
  ],
  loseWhen: { key: 'life', value: 0 },
}

export const GAMES: GameDef[] = [palworld]

export function getGame(id: string | undefined): GameDef | undefined {
  return GAMES.find((g) => g.id === id)
}
