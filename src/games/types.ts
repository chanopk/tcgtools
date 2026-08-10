/** นิยามตัวนับ 1 ตัวของผู้เล่น 1 คน */
export interface CounterDef {
  key: string
  /** ชื่อที่โชว์ตัวใหญ่บนปุ่ม */
  label: string
  /** คำอธิบายไทยตัวเล็ก */
  hint?: string
  initial: number
  min: number
  max: number
  /** กด +/- ครั้งละเท่าไหร่ */
  step: number
  /**
   * primary = ตัวเลขหลัก โชว์ใหญ่เต็มฝั่ง (เช่น Life)
   * resource = ตัวนับรอง เรียงเป็นแถวเล็กด้านล่าง (เช่น วัตถุดิบ)
   */
  role: 'primary' | 'resource'
}

/** นิยามเกม 1 เกม — เพิ่มเกมใหม่ = เพิ่มอ็อบเจ็กต์นี้ใน registry */
export interface GameDef {
  id: string
  name: string
  subtitle: string
  emoji: string
  /** true = เล่นได้แล้ว, false = ขึ้นหน้าแรกแบบกดไม่ได้ */
  ready: boolean
  counters: CounterDef[]
  /** เงื่อนไขแพ้: counter ตัวนี้ลงถึงค่านี้เมื่อไหร่ อีกฝ่ายชนะ */
  loseWhen: { key: string; value: number }
}
