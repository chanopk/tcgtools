/**
 * สูตรความน่าจะเป็นแบบ hypergeometric — จั่วการ์ดคือ "หยิบโดยไม่ใส่คืน"
 * ทุกฟังก์ชันในไฟล์นี้เป็น pure ไม่ยุ่งกับ UI
 */

/**
 * C(n, k) คูณทีละสเต็ปเพื่อกันตัวเลขบวมระหว่างทาง
 * เด็คขนาด TCG (50–100 ใบ) ผลอาจคลาดจากจำนวนเต็มจริงระดับ 1e-16 ซึ่งไม่มีผลกับ %
 */
export function binom(n: number, k: number): number {
  if (n < 0 || k < 0 || k > n) return 0
  const steps = Math.min(k, n - k)
  let acc = 1
  for (let i = 0; i < steps; i++) {
    acc = (acc * (n - i)) / (i + 1)
  }
  return acc
}

/** ช่วงจำนวนใบที่ยอมรับได้ของการ์ด 1 ชนิด ใช้เป็นอินพุตของ pJoint */
export interface CardRange {
  /** การ์ดชนิดนี้มีในเด็คกี่ใบ */
  copies: number
  /** ติดมืออย่างน้อยกี่ใบ */
  min: number
  /** ติดมือได้มากสุดกี่ใบ (ใส่เท่ากับ copies ถ้าไม่จำกัด) */
  max: number
}

/**
 * โอกาสที่การ์ดทุกชนิดใน ranges จะติดมือ "พร้อมกัน" ตามช่วงที่กำหนด
 * เมื่อจั่วจากเด็ค deckSize ใบ ออกมาทั้งหมด sample ใบ
 *
 * ไล่ DP บนจำนวนช่องที่การ์ดที่สนใจกินไปจาก sample (weights[s] = ผลรวมของ ∏C(copies, x))
 * แล้วค่อยเติมช่องที่เหลือด้วยการ์ดนอกลิสต์ทีเดียว — เร็วกว่าไล่ทุกคอมบิเนชัน
 */
export function pJoint(deckSize: number, sample: number, ranges: CardRange[]): number {
  const deck = Math.max(0, Math.trunc(deckSize))
  const drawn = Math.min(Math.max(0, Math.trunc(sample)), deck)

  const tracked = ranges.reduce((sum, r) => sum + r.copies, 0)
  // ใส่จำนวนการ์ดรวมเกินขนาดเด็ค = โจทย์ที่เป็นไปไม่ได้
  if (tracked > deck) return 0

  let weights = [1]
  for (const range of ranges) {
    const lo = Math.max(0, range.min)
    const hi = Math.min(range.max, range.copies)
    if (lo > hi) return 0

    const next = new Array<number>(drawn + 1).fill(0)
    for (let used = 0; used < weights.length; used++) {
      const weight = weights[used]
      if (weight === 0) continue
      for (let take = lo; take <= hi && used + take <= drawn; take++) {
        next[used + take] += weight * binom(range.copies, take)
      }
    }
    weights = next
  }

  const total = binom(deck, drawn)
  if (total === 0) return 0

  let probability = 0
  for (let used = 0; used < weights.length; used++) {
    if (weights[used] === 0) continue
    probability += (weights[used] * binom(deck - tracked, drawn - used)) / total
  }

  // กันค่าหลุดขอบจากการปัดเศษทศนิยม
  return Math.min(1, Math.max(0, probability))
}

/** โอกาสจั่วติดการ์ดชนิดเดียว อย่างน้อย need ใบ */
export function pAtLeast(
  deckSize: number,
  copies: number,
  sample: number,
  need: number,
): number {
  if (need <= 0) return 1
  return pJoint(deckSize, sample, [{ copies, min: need, max: copies }])
}

/**
 * โอกาสที่ "อย่างน้อย 1 ชนิด" ใน ranges จะติดมือครบตาม min ของตัวเอง
 * คิดจากส่วนเติมเต็ม: 1 − โอกาสที่ทุกชนิดพลาดพร้อมกัน (ติดไม่ถึง min)
 */
export function pAtLeastOneOf(
  deckSize: number,
  sample: number,
  ranges: CardRange[],
): number {
  if (ranges.length === 0) return 0
  const allMiss = pJoint(
    deckSize,
    sample,
    ranges.map((r) => ({ copies: r.copies, min: 0, max: Math.max(0, r.min - 1) })),
  )
  return Math.min(1, Math.max(0, 1 - allMiss))
}
