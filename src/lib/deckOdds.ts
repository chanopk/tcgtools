import { pAtLeast, pAtLeastOneOf, pJoint } from './hypergeom'

/** ตารางนี้คำนวณให้กี่เทิร์น */
export const TURNS = 5

/** การ์ด 1 ชนิดในลิสต์ที่อยากได้ */
export interface CardEntry {
  id: string
  name: string
  /** มีในเด็คกี่ใบ (One Piece ใส่ชนิดละไม่เกิน 4) */
  copies: number
  /** พลังงานที่ต้องจ่ายตอนเล่น = คอสต์ของการ์ด */
  cost: number
  /** อยากมีในมือกี่ใบ ณ เทิร์นนั้น — index 0 = เทิร์น 1 */
  need: number[]
}

export interface DeckSettings {
  deckSize: number
  /** การ์ดในมือตอนเริ่มเกม */
  handSize: number
  drawPerTurn: number
  /** true = เล่นก่อน เทิร์นแรกไม่ได้จั่ว */
  skipFirstDraw: boolean
  startEnergy: number
  energyPerTurn: number
  maxEnergy: number
  /** จั่วเพิ่มจากเอฟเฟกต์การ์ด แยกตามเทิร์น — index 0 = เทิร์น 1 */
  extraDraws: number[]
}

/** ค่าตั้งต้นอิงกติกาพื้นฐาน One Piece TCG (เด็ค 50, มือ 5, DON!! +2 สูงสุด 10) */
export const DEFAULT_SETTINGS: DeckSettings = {
  deckSize: 50,
  handSize: 5,
  drawPerTurn: 1,
  skipFirstDraw: false,
  startEnergy: 0,
  energyPerTurn: 2,
  maxEnergy: 10,
  extraDraws: Array.from({ length: TURNS }, () => 0),
}

/** ขอบเขตค่าที่รับได้ — ใช้ร่วมกันทั้งตอนโหลดจาก localStorage และตอนกรอกในฟอร์ม */
export const LIMITS = {
  deckSize: { min: 1, max: 200 },
  handSize: { min: 0, max: 30 },
  drawPerTurn: { min: 0, max: 20 },
  startEnergy: { min: 0, max: 50 },
  energyPerTurn: { min: 0, max: 20 },
  maxEnergy: { min: 0, max: 50 },
  extraDraw: { min: 0, max: 30 },
  copies: { min: 0, max: 30 },
  cost: { min: 0, max: 20 },
  need: { min: 0, max: 10 },
} as const

/** ผลของการ์ด 1 ชนิดในเทิร์นหนึ่ง */
export interface CardOdds {
  id: string
  name: string
  copies: number
  cost: number
  /** อยากได้กี่ใบในเทิร์นนี้ */
  need: number
  /** พลังงานเทิร์นนี้พอจ่ายคอสต์ไหม */
  affordable: boolean
  /** โอกาสมีใบนี้ครบตามที่ตั้ง (คิดเฉพาะใบนี้ใบเดียว) */
  chance: number
}

export interface TurnResult {
  turn: number
  /** เห็นการ์ดจากเด็คไปแล้วกี่ใบ (มือเริ่มต้น + จั่วสะสม) */
  cardsSeen: number
  /** จั่วเพิ่มในเทิร์นนี้กี่ใบ (จั่วปกติ + จั่วจากเอฟเฟกต์) */
  drawnThisTurn: number
  energy: number
  /** การ์ดที่ตั้ง "ต้องการในมือ" ไว้มากกว่า 0 ในเทิร์นนี้ */
  targets: CardOdds[]
  /** โอกาสมีการ์ดที่จ่ายคอสต์ไหวครบตามที่ตั้ง อย่างน้อย 1 ชนิด — null = ยังไม่ได้ตั้งเป้า */
  anyPlayable: number | null
  /** โอกาสได้ครบทุกชนิดที่ตั้งไว้พร้อมกัน (ยังไม่คิดเรื่องพลังงาน) */
  allTargets: number | null
  /** จั่วจนเกินจำนวนการ์ดในเด็คแล้ว */
  deckOut: boolean
}

/** พลังงานที่มีตอนเทิร์นที่ turn (นับรวมที่เพิ่มของเทิร์นนั้นแล้ว) */
export function energyAtTurn(settings: DeckSettings, turn: number): number {
  return Math.min(
    settings.maxEnergy,
    settings.startEnergy + settings.energyPerTurn * turn,
  )
}

/** คำนวณผลของทุกเทิร์นในตาราง */
export function computeTurns(
  settings: DeckSettings,
  cards: CardEntry[],
): TurnResult[] {
  const results: TurnResult[] = []
  let seen = settings.handSize

  for (let turn = 1; turn <= TURNS; turn++) {
    const regular = turn === 1 && settings.skipFirstDraw ? 0 : settings.drawPerTurn
    const extra = settings.extraDraws[turn - 1] ?? 0
    const drawnThisTurn = regular + extra
    seen += drawnThisTurn

    const cardsSeen = Math.min(seen, settings.deckSize)
    const energy = energyAtTurn(settings, turn)

    const targets: CardOdds[] = cards
      .filter((card) => (card.need[turn - 1] ?? 0) > 0)
      .map((card) => {
        const need = card.need[turn - 1] ?? 0
        return {
          id: card.id,
          name: card.name,
          copies: card.copies,
          cost: card.cost,
          need,
          affordable: card.cost <= energy,
          chance: pAtLeast(settings.deckSize, card.copies, cardsSeen, need),
        }
      })

    const playable = targets.filter((t) => t.affordable)

    results.push({
      turn,
      cardsSeen,
      drawnThisTurn,
      energy,
      targets,
      anyPlayable:
        targets.length === 0
          ? null
          : pAtLeastOneOf(
              settings.deckSize,
              cardsSeen,
              playable.map((t) => ({ copies: t.copies, min: t.need, max: t.copies })),
            ),
      allTargets:
        targets.length === 0
          ? null
          : pJoint(
              settings.deckSize,
              cardsSeen,
              targets.map((t) => ({ copies: t.copies, min: t.need, max: t.copies })),
            ),
      deckOut: seen >= settings.deckSize,
    })
  }

  return results
}
