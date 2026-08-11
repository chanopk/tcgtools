import { useState } from 'react'

interface Props {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  /** ข้อความเล็กเหนือช่อง */
  label?: string
  /** ใส่เมื่อ label สั้นเกินจนคนใช้ screen reader ไม่เข้าใจ */
  ariaLabel?: string
  /** true = ช่องเตี้ยลงสำหรับใส่ในตารางที่มีหลายช่องต่อแถว */
  compact?: boolean
  className?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * ช่องกรอกตัวเลขจำนวนเต็ม
 * ระหว่างพิมพ์โชว์ค่าที่พิมพ์ตรง ๆ (ลบให้ว่างได้) พอออกจากช่องค่อยเด้งกลับเป็นค่าจริงที่ clamp แล้ว
 */
export default function NumberField({
  value,
  min,
  max,
  onChange,
  label,
  ariaLabel,
  compact = false,
  className = '',
}: Props) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)

  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label && (
        <span className="truncate text-center text-[0.65rem] font-semibold text-zinc-500">
          {label}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabel ?? label}
        value={editing ? draft : String(value)}
        onFocus={(e) => {
          setDraft(String(value))
          setEditing(true)
          e.currentTarget.select()
        }}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9-]/g, '')
          setDraft(raw)
          const parsed = Number(raw)
          if (raw !== '' && Number.isFinite(parsed)) {
            onChange(clamp(Math.trunc(parsed), min, max))
          }
        }}
        className={`w-full border border-zinc-800 bg-zinc-950 text-center font-bold tabular-nums text-zinc-50 outline-none focus:border-zinc-500 ${
          compact ? 'h-8 rounded-lg px-0.5 text-sm' : 'h-11 rounded-xl px-2 text-base'
        }`}
      />
    </label>
  )
}
