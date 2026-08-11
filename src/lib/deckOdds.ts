import { pAtLeast, pAtLeastOneOf, pJoint } from './hypergeom'

/** จำนวนเทิร์นตอนเริ่ม — กดเพิ่ม/ลดทีหลังได้ที่ settings.turnCount */
export const DEFAULT_TURNS = 5

/** ฝั่งที่เริ่มเกม — One Piece ให้การจั่วกับ DON!! สองฝั่งไม่เท่ากัน จึงต้องคิดแยก */
export type Side = 'first' | 'second'
export const SIDES: Side[] = ['first', 'second']

/**
 * กติกา One Piece ที่ทำให้สองฝั่งต่างกัน
 * - ฝ่ายเริ่มก่อน: เทิร์นแรก "ไม่จั่ว" และวาง DON!! ได้ใบเดียว
 * - ฝ่ายเริ่มหลัง: จั่วตั้งแต่เทิร์นแรก และวาง DON!! เต็มจำนวนทุกเทิร์น
 */
const FIRST_TURN_DON_GOING_FIRST = 1

/** การ์ด 1 ชนิดในลิสต์ที่อยากได้ */
export interface CardEntry {
  id: string
  name: string
  /** มีในเด็คกี่ใบ (One Piece ใส่ชนิดละไม่เกิน 4) */
  copies: number
  /** DON!! ที่ต้องจ่ายตอนเล่น = คอสต์ของการ์ด */
  cost: number
  /**
   * อยากมีในมือกี่ใบ ณ เทิร์นนั้น แยกตามฝั่งที่เริ่ม — index 0 = เทิร์น 1
   * อาจสั้นหรือยาวกว่า turnCount ได้ (ลดเทิร์นแล้วค่าเดิมยังอยู่) — ช่องที่ขาดคิดเป็น 0
   */
  need: Record<Side, number[]>
}

export interface DeckSettings {
  /** คำนวณถึงเทิร์นที่เท่าไหร่ */
  turnCount: number
  deckSize: number
  /** การ์ดในมือตอนเริ่มเกม (One Piece = 5 มัลลิแกนได้ 1 ครั้ง) */
  handSize: number
  drawPerTurn: number
  /** DON!! ที่วางเพิ่มต่อเทิร์น — ฝั่งเริ่มก่อนเทิร์นแรกได้แค่ 1 ใบตามกติกา */
  donPerTurn: number
  maxDon: number
  /** จั่วเพิ่มจากเอฟเฟกต์การ์ด แยกฝั่งและแยกเทิร์น — ช่องที่ขาดคิดเป็น 0 */
  extraDraws: Record<Side, number[]>
  /** true = กรอกฝั่งเดียวแล้วให้อีกฝั่งใช้ค่าเดียวกัน (ประหยัดการพิมพ์) */
  linkSides: boolean
}

/** ค่าตั้งต้นตามกติกามาตรฐาน One Piece Card Game */
export const DEFAULT_SETTINGS: DeckSettings = {
  turnCount: DEFAULT_TURNS,
  deckSize: 50,
  handSize: 5,
  drawPerTurn: 1,
  donPerTurn: 2,
  maxDon: 10,
  extraDraws: {
    first: Array.from({ length: DEFAULT_TURNS }, () => 0),
    second: Array.from({ length: DEFAULT_TURNS }, () => 0),
  },
  linkSides: false,
}

/** ขอบเขตค่าที่รับได้ — ใช้ร่วมกันทั้งตอนโหลดจาก localStorage และตอนกรอกในฟอร์ม */
export const LIMITS = {
  turnCount: { min: 1, max: 20 },
  deckSize: { min: 1, max: 200 },
  handSize: { min: 0, max: 30 },
  drawPerTurn: { min: 0, max: 20 },
  donPerTurn: { min: 0, max: 20 },
  maxDon: { min: 0, max: 50 },
  extraDraw: { min: 0, max: 30 },
  copies: { min: 0, max: 30 },
  cost: { min: 0, max: 20 },
  need: { min: 0, max: 10 },
} as const

/** ช่องหนึ่งช่องในตาราง = การ์ด 1 ใบ ณ เทิร์นหนึ่งของฝั่งหนึ่ง */
export interface CardCell {
  id: string
  /** อยากได้กี่ใบในเทิร์นนี้ — 0 = ไม่ได้ตั้งเป้า */
  need: number
  /** DON!! เทิร์นนี้พอจ่ายคอสต์ไหม */
  affordable: boolean
  /** โอกาสมีครบตามที่ตั้ง (คิดเฉพาะใบนี้ใบเดียว) — null = ไม่ได้ตั้งเป้าเทิร์นนี้ */
  chance: number | null
}

export interface TurnResult {
  turn: number
  /** เห็นการ์ดจากเด็คไปแล้วกี่ใบ (มือเริ่มต้น + จั่วสะสม) */
  cardsSeen: number
  don: number
  /** จั่วจนเกินจำนวนการ์ดในเด็คแล้ว */
  deckOut: boolean
  /** เรียงตามลำดับการ์ดในลิสต์ ความยาวเท่ากับจำนวนการ์ดเสมอ */
  cells: CardCell[]
  /** ตั้งเป้าไว้กี่ใบในเทิร์นนี้ */
  targetCount: number
  /** โอกาสมีการ์ดที่จ่าย DON!! ไหวครบตามที่ตั้ง อย่างน้อย 1 ชนิด — null = ยังไม่ได้ตั้งเป้า */
  anyPlayable: number | null
  /** โอกาสได้ครบทุกชนิดที่ตั้งไว้พร้อมกัน (ยังไม่คิดเรื่อง DON!!) */
  allTargets: number | null
}

export type Board = Record<Side, TurnResult[]>

/** DON!! ที่วางได้ ณ เทิร์นนั้นของแต่ละฝั่ง (นับรวมที่เพิ่มของเทิร์นนั้นแล้ว) */
export function donAtTurn(settings: DeckSettings, side: Side, turn: number): number {
  const total =
    side === 'first'
      ? FIRST_TURN_DON_GOING_FIRST + settings.donPerTurn * (turn - 1)
      : settings.donPerTurn * turn
  return Math.min(settings.maxDon, Math.max(0, total))
}

/** จั่วกี่ใบในเทิร์นนั้น (จั่วปกติ + จั่วจากเอฟเฟกต์การ์ด) */
function drawsAtTurn(settings: DeckSettings, side: Side, turn: number): number {
  const regular = side === 'first' && turn === 1 ? 0 : settings.drawPerTurn
  return regular + (settings.extraDraws[side][turn - 1] ?? 0)
}

function computeSide(
  settings: DeckSettings,
  cards: CardEntry[],
  side: Side,
): TurnResult[] {
  const results: TurnResult[] = []
  let seen = settings.handSize

  for (let turn = 1; turn <= settings.turnCount; turn++) {
    seen += drawsAtTurn(settings, side, turn)

    const cardsSeen = Math.min(seen, settings.deckSize)
    const don = donAtTurn(settings, side, turn)

    const cells: CardCell[] = cards.map((card) => {
      const need = card.need[side][turn - 1] ?? 0
      return {
        id: card.id,
        need,
        affordable: card.cost <= don,
        chance:
          need > 0 ? pAtLeast(settings.deckSize, card.copies, cardsSeen, need) : null,
      }
    })

    const targets = cards.filter((_, i) => cells[i].need > 0)
    const ranges = targets.map((card) => ({
      copies: card.copies,
      min: card.need[side][turn - 1] ?? 0,
      max: card.copies,
    }))
    const playableRanges = ranges.filter((_, i) => targets[i].cost <= don)

    results.push({
      turn,
      cardsSeen,
      don,
      deckOut: seen >= settings.deckSize,
      cells,
      targetCount: targets.length,
      anyPlayable:
        targets.length === 0
          ? null
          : pAtLeastOneOf(settings.deckSize, cardsSeen, playableRanges),
      allTargets:
        targets.length === 0 ? null : pJoint(settings.deckSize, cardsSeen, ranges),
    })
  }

  return results
}

/** คำนวณทั้งกระดาน — ทั้งฝั่งเริ่มก่อนและเริ่มหลัง เทียบกันได้ในรอบเดียว */
export function computeBoard(settings: DeckSettings, cards: CardEntry[]): Board {
  return {
    first: computeSide(settings, cards, 'first'),
    second: computeSide(settings, cards, 'second'),
  }
}
