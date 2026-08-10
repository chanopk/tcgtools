import { useCallback, useEffect, useState } from 'react'
import type { GameDef } from '../games/types'

/** ค่าตัวนับทุกตัวของผู้เล่น 1 คน */
export type PlayerCounters = Record<string, number>
export type MatchState = [PlayerCounters, PlayerCounters]

const STORAGE_PREFIX = 'tcgtools:match:v1:'

function freshPlayer(game: GameDef): PlayerCounters {
  return Object.fromEntries(game.counters.map((c) => [c.key, c.initial]))
}

function freshMatch(game: GameDef): MatchState {
  return [freshPlayer(game), freshPlayer(game)]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** อ่านของเก่าจาก localStorage แบบไม่เชื่อข้อมูล — คีย์ไหนหาย/ไม่ใช่ตัวเลข ใช้ค่าเริ่มต้นแทน */
function loadMatch(game: GameDef): MatchState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + game.id)
    if (!raw) return freshMatch(game)
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== 2) return freshMatch(game)

    return parsed.map((entry) => {
      const source = (entry ?? {}) as Record<string, unknown>
      return Object.fromEntries(
        game.counters.map((c) => {
          const value = source[c.key]
          return [
            c.key,
            typeof value === 'number' && Number.isFinite(value)
              ? clamp(Math.trunc(value), c.min, c.max)
              : c.initial,
          ]
        }),
      )
    }) as MatchState
  } catch {
    return freshMatch(game)
  }
}

export function useMatch(game: GameDef) {
  const [state, setState] = useState<MatchState>(() => loadMatch(game))

  // เกมเปลี่ยน = เริ่มแมตช์ของเกมนั้นใหม่
  useEffect(() => {
    setState(loadMatch(game))
  }, [game])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + game.id, JSON.stringify(state))
    } catch {
      /* โหมดส่วนตัวบางเบราว์เซอร์เขียนไม่ได้ — เล่นต่อได้ปกติ แค่ไม่จำค่า */
    }
  }, [game.id, state])

  const adjust = useCallback(
    (playerIndex: 0 | 1, counterKey: string, delta: number) => {
      const counter = game.counters.find((c) => c.key === counterKey)
      if (!counter) return
      setState((prev) => {
        const current = prev[playerIndex][counterKey] ?? counter.initial
        const next = clamp(current + delta, counter.min, counter.max)
        if (next === current) return prev
        const updated: MatchState = [{ ...prev[0] }, { ...prev[1] }]
        updated[playerIndex][counterKey] = next
        return updated
      })
    },
    [game],
  )

  const reset = useCallback(() => setState(freshMatch(game)), [game])

  const loser = state.findIndex(
    (player) => player[game.loseWhen.key] === game.loseWhen.value,
  )
  const winner = loser === -1 ? null : ((1 - loser) as 0 | 1)

  return { state, adjust, reset, winner }
}
