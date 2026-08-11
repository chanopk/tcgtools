import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  DEFAULT_TURNS,
  LIMITS,
  computeTurns,
  type CardEntry,
  type DeckSettings,
} from '../lib/deckOdds'

const STORAGE_KEY = 'tcgtools:deckodds:v1'

/** ฟิลด์ตั้งค่าที่เป็นตัวเลขเดี่ยว (ไม่รวม toggle, array และ turnCount ที่มีปุ่มของตัวเอง) */
export type NumericSetting = Exclude<
  keyof DeckSettings,
  'skipFirstDraw' | 'extraDraws' | 'turnCount'
>

interface DeckOddsState {
  settings: DeckSettings
  cards: CardEntry[]
}

function newId(): string {
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function blankCard(turnCount = DEFAULT_TURNS): CardEntry {
  return {
    id: newId(),
    name: '',
    copies: 4,
    cost: 1,
    need: Array.from({ length: turnCount }, () => 0),
  }
}

/** เขียนค่าลง index ที่ระบุ พร้อมยืดอาร์เรย์ด้วย 0 ถ้ายังสั้นไม่ถึง */
function withValueAt(list: number[], index: number, value: number): number[] {
  const next = Array.from({ length: Math.max(list.length, index + 1) }, (_, i) => list[i] ?? 0)
  next[index] = value
  return next
}

function freshState(): DeckOddsState {
  return {
    settings: { ...DEFAULT_SETTINGS, extraDraws: [...DEFAULT_SETTINGS.extraDraws] },
    cards: [blankCard()],
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

/**
 * อ่านลิสต์ค่ารายเทิร์น — เก็บความยาวเดิมไว้ (ไม่ตัดตาม turnCount)
 * เพราะกดลดเทิร์นแล้วกดเพิ่มกลับ ค่าที่พิมพ์ไว้จะได้ยังอยู่
 */
function readTurnArray(
  value: unknown,
  limit: { min: number; max: number },
): number[] {
  const source: unknown[] = Array.isArray(value) ? value : []
  return source
    .slice(0, LIMITS.turnCount.max)
    .map((entry) => readNumber(entry, 0, limit))
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
      skipFirstDraw:
        typeof s.skipFirstDraw === 'boolean'
          ? s.skipFirstDraw
          : DEFAULT_SETTINGS.skipFirstDraw,
      startEnergy: readNumber(
        s.startEnergy,
        DEFAULT_SETTINGS.startEnergy,
        LIMITS.startEnergy,
      ),
      energyPerTurn: readNumber(
        s.energyPerTurn,
        DEFAULT_SETTINGS.energyPerTurn,
        LIMITS.energyPerTurn,
      ),
      maxEnergy: readNumber(s.maxEnergy, DEFAULT_SETTINGS.maxEnergy, LIMITS.maxEnergy),
      extraDraws: readTurnArray(s.extraDraws, LIMITS.extraDraw),
    }

    const rawCards: unknown[] = Array.isArray(root.cards) ? root.cards : []
    const cards: CardEntry[] = rawCards.map((entry) => {
      const c = (entry ?? {}) as Record<string, unknown>
      return {
        id: typeof c.id === 'string' && c.id ? c.id : newId(),
        name: typeof c.name === 'string' ? c.name.slice(0, 40) : '',
        copies: readNumber(c.copies, 4, LIMITS.copies),
        cost: readNumber(c.cost, 1, LIMITS.cost),
        need: readTurnArray(c.need, LIMITS.need),
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

  const setSkipFirstDraw = useCallback((value: boolean) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, skipFirstDraw: value },
    }))
  }, [])

  const setExtraDraw = useCallback((turnIndex: number, value: number) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        extraDraws: withValueAt(prev.settings.extraDraws, turnIndex, value),
      },
    }))
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

  const setNeed = useCallback((id: string, turnIndex: number, value: number) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((card) =>
        card.id === id ? { ...card, need: withValueAt(card.need, turnIndex, value) } : card,
      ),
    }))
  }, [])

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

  const results = useMemo(
    () => computeTurns(state.settings, state.cards),
    [state.settings, state.cards],
  )

  const totalCopies = state.cards.reduce((sum, card) => sum + card.copies, 0)

  return {
    settings: state.settings,
    cards: state.cards,
    results,
    totalCopies,
    setSetting,
    setSkipFirstDraw,
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
