import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  DEFAULT_TURNS,
  LIMITS,
  SIDES,
  computeBoard,
  type CardEntry,
  type DeckSettings,
  type Side,
} from '../lib/deckOdds'

const STORAGE_KEY = 'tcgtools:deckodds:v1'

/** ฟิลด์ตั้งค่าที่เป็นตัวเลขเดี่ยว (ไม่รวม toggle, array และ turnCount ที่มีปุ่มของตัวเอง) */
export type NumericSetting = Exclude<
  keyof DeckSettings,
  'linkSides' | 'extraDraws' | 'turnCount'
>

interface DeckOddsState {
  settings: DeckSettings
  cards: CardEntry[]
}

function newId(): string {
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function zeros(length: number): number[] {
  return Array.from({ length }, () => 0)
}

function blankCard(turnCount = DEFAULT_TURNS): CardEntry {
  return {
    id: newId(),
    name: '',
    copies: 4,
    cost: 1,
    need: { first: zeros(turnCount), second: zeros(turnCount) },
  }
}

function freshState(): DeckOddsState {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      extraDraws: { first: zeros(DEFAULT_TURNS), second: zeros(DEFAULT_TURNS) },
    },
    cards: [blankCard()],
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** เขียนค่าลง index ที่ระบุ พร้อมยืดอาร์เรย์ด้วย 0 ถ้ายังสั้นไม่ถึง */
function withValueAt(list: number[], index: number, value: number): number[] {
  const next = Array.from(
    { length: Math.max(list.length, index + 1) },
    (_, i) => list[i] ?? 0,
  )
  next[index] = value
  return next
}

/** อ่านตัวเลขจากข้อมูลที่ไม่เชื่อถือ — ไม่ใช่ตัวเลขก็ใช้ค่าเริ่มต้นแทน */
function readNumber(
  value: unknown,
  fallback: number,
  limit: { min: number; max: number },
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return clamp(Math.trunc(value), limit.min, limit.max)
}

/** ตัวเลขตัวแรกที่ใช้ได้ — ไว้รองรับชื่อคีย์เก่าที่เปลี่ยนไปแล้ว */
function readNumberFrom(
  values: unknown[],
  fallback: number,
  limit: { min: number; max: number },
): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return clamp(Math.trunc(value), limit.min, limit.max)
    }
  }
  return fallback
}

function readTurnArray(value: unknown, limit: { min: number; max: number }): number[] {
  const source: unknown[] = Array.isArray(value) ? value : []
  return source.slice(0, LIMITS.turnCount.max).map((entry) => readNumber(entry, 0, limit))
}

/**
 * อ่านค่ารายเทิร์นที่แยกสองฝั่ง
 * ของเวอร์ชันก่อนเก็บเป็นอาร์เรย์เดียว (ยังไม่แยกฝั่ง) — เจอแบบนั้นให้ใช้ค่าเดิมกับทั้งสองฝั่ง
 */
function readSideArrays(
  value: unknown,
  limit: { min: number; max: number },
): Record<Side, number[]> {
  if (Array.isArray(value)) {
    const shared = readTurnArray(value, limit)
    return { first: shared, second: [...shared] }
  }
  const source = (value ?? {}) as Record<string, unknown>
  return {
    first: readTurnArray(source.first, limit),
    second: readTurnArray(source.second, limit),
  }
}

/** โหลดของเก่าจาก localStorage แบบไม่เชื่อข้อมูล คีย์ไหนเพี้ยนใช้ค่าเริ่มต้นแทน */
function loadState(): DeckOddsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return freshState()

    const root = parsed as Record<string, unknown>
    const s = (root.settings ?? {}) as Record<string, unknown>
    const settings: DeckSettings = {
      turnCount: readNumber(s.turnCount, DEFAULT_SETTINGS.turnCount, LIMITS.turnCount),
      deckSize: readNumber(s.deckSize, DEFAULT_SETTINGS.deckSize, LIMITS.deckSize),
      handSize: readNumber(s.handSize, DEFAULT_SETTINGS.handSize, LIMITS.handSize),
      drawPerTurn: readNumber(
        s.drawPerTurn,
        DEFAULT_SETTINGS.drawPerTurn,
        LIMITS.drawPerTurn,
      ),
      // energyPerTurn / maxEnergy = ชื่อเดิมก่อนเปลี่ยนมาเรียกตรง ๆ ว่า DON!!
      donPerTurn: readNumberFrom(
        [s.donPerTurn, s.energyPerTurn],
        DEFAULT_SETTINGS.donPerTurn,
        LIMITS.donPerTurn,
      ),
      maxDon: readNumberFrom(
        [s.maxDon, s.maxEnergy],
        DEFAULT_SETTINGS.maxDon,
        LIMITS.maxDon,
      ),
      extraDraws: readSideArrays(s.extraDraws, LIMITS.extraDraw),
      linkSides: typeof s.linkSides === 'boolean' ? s.linkSides : false,
    }

    const rawCards: unknown[] = Array.isArray(root.cards) ? root.cards : []
    const cards: CardEntry[] = rawCards.map((entry) => {
      const c = (entry ?? {}) as Record<string, unknown>
      return {
        id: typeof c.id === 'string' && c.id ? c.id : newId(),
        name: typeof c.name === 'string' ? c.name.slice(0, 40) : '',
        copies: readNumber(c.copies, 4, LIMITS.copies),
        cost: readNumber(c.cost, 1, LIMITS.cost),
        need: readSideArrays(c.need, LIMITS.need),
      }
    })

    return {
      settings,
      cards: cards.length > 0 ? cards : [blankCard(settings.turnCount)],
    }
  } catch {
    return freshState()
  }
}

export function useDeckOdds() {
  const [state, setState] = useState<DeckOddsState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* โหมดส่วนตัวบางเบราว์เซอร์เขียนไม่ได้ — ใช้งานต่อได้ แค่ไม่จำค่า */
    }
  }, [state])

  const setSetting = useCallback((key: NumericSetting, value: number) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }))
  }, [])

  /** เปิดโหมดล็อกสองฝั่ง = ยกค่าฝั่งเริ่มก่อนไปทับฝั่งเริ่มหลัง เพื่อให้ตรงกับที่เห็นบนจอ */
  const setLinkSides = useCallback((linked: boolean) => {
    setState((prev) => {
      if (!linked) return { ...prev, settings: { ...prev.settings, linkSides: false } }
      return {
        settings: {
          ...prev.settings,
          linkSides: true,
          extraDraws: {
            first: prev.settings.extraDraws.first,
            second: [...prev.settings.extraDraws.first],
          },
        },
        cards: prev.cards.map((card) => ({
          ...card,
          need: { first: card.need.first, second: [...card.need.first] },
        })),
      }
    })
  }, [])

  const setExtraDraw = useCallback((side: Side, turnIndex: number, value: number) => {
    setState((prev) => {
      const extraDraws = { ...prev.settings.extraDraws }
      for (const target of prev.settings.linkSides ? SIDES : [side]) {
        extraDraws[target] = withValueAt(extraDraws[target], turnIndex, value)
      }
      return { ...prev, settings: { ...prev.settings, extraDraws } }
    })
  }, [])

  /** เพิ่ม/ลดจำนวนเทิร์นที่คำนวณ — ค่าที่พิมพ์ไว้ของเทิร์นที่ถูกลดยังเก็บไว้ กดเพิ่มกลับแล้วได้คืน */
  const addTurn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        turnCount: Math.min(LIMITS.turnCount.max, prev.settings.turnCount + 1),
      },
    }))
  }, [])

  const removeTurn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        turnCount: Math.max(LIMITS.turnCount.min, prev.settings.turnCount - 1),
      },
    }))
  }, [])

  const updateCard = useCallback((id: string, patch: Partial<CardEntry>) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
    }))
  }, [])

  const setNeed = useCallback(
    (id: string, side: Side, turnIndex: number, value: number) => {
      setState((prev) => ({
        ...prev,
        cards: prev.cards.map((card) => {
          if (card.id !== id) return card
          const need = { ...card.need }
          for (const target of prev.settings.linkSides ? SIDES : [side]) {
            need[target] = withValueAt(need[target], turnIndex, value)
          }
          return { ...card, need }
        }),
      }))
    },
    [],
  )

  const addCard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      cards: [...prev.cards, blankCard(prev.settings.turnCount)],
    }))
  }, [])

  const removeCard = useCallback((id: string) => {
    setState((prev) => {
      const cards = prev.cards.filter((card) => card.id !== id)
      return {
        ...prev,
        cards: cards.length > 0 ? cards : [blankCard(prev.settings.turnCount)],
      }
    })
  }, [])

  const resetAll = useCallback(() => setState(freshState()), [])

  const board = useMemo(
    () => computeBoard(state.settings, state.cards),
    [state.settings, state.cards],
  )

  const totalCopies = state.cards.reduce((sum, card) => sum + card.copies, 0)

  return {
    settings: state.settings,
    cards: state.cards,
    board,
    totalCopies,
    setSetting,
    setLinkSides,
    setExtraDraw,
    addTurn,
    removeTurn,
    updateCard,
    setNeed,
    addCard,
    removeCard,
    resetAll,
  }
}
