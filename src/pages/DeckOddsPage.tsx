import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import NumberField from '../components/NumberField'
import { useDeckOdds } from '../hooks/useDeckOdds'
import {
  LIMITS,
  SIDES,
  type Board,
  type CardEntry,
  type DeckSettings,
  type Side,
  type TurnResult,
} from '../lib/deckOdds'

/**
 * สีและคำเรียกของสองฝั่ง — ใช้ชุดเดียวกันทั้งช่องกรอกและตารางผล
 * จะได้กวาดตาจากที่กรอกไปหาผลได้โดยไม่ต้องอ่านหัวตารางซ้ำ
 */
const SIDE_META: Record<Side, { label: string; dot: string; text: string }> = {
  first: { label: 'เริ่มก่อน', dot: 'bg-amber-400', text: 'text-amber-300' },
  second: { label: 'เริ่มหลัง', dot: 'bg-sky-400', text: 'text-sky-300' },
}

export default function DeckOddsPage() {
  const deck = useDeckOdds()
  const { settings, cards, board, totalCopies } = deck
  const overfilled = totalCopies > settings.deckSize
  const turns = Array.from({ length: settings.turnCount }, (_, i) => i + 1)

  return (
    <div
      className="min-h-[100dvh] bg-zinc-950 px-3"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
      }}
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-3">
          <Link
            to="/"
            className="-ml-1 inline-block rounded-lg px-1.5 py-0.5 text-xs font-semibold text-zinc-500 active:bg-zinc-800"
          >
            ‹ กลับ
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-50">
            One Piece TCG · โอกาสจั่วเจอการ์ด
          </h1>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-zinc-500">
            {assumptionLine(settings)}
          </p>
        </header>

        <details className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-zinc-400 marker:content-none">
            ⚙ ปรับกติกา / ขนาดเด็ค
          </summary>
          <div className="border-t border-zinc-800 p-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              <NumberField
                label="ขนาดเด็ค"
                value={settings.deckSize}
                {...LIMITS.deckSize}
                onChange={(v) => deck.setSetting('deckSize', v)}
              />
              <NumberField
                label="มือเริ่มต้น"
                value={settings.handSize}
                {...LIMITS.handSize}
                onChange={(v) => deck.setSetting('handSize', v)}
              />
              <NumberField
                label="จั่ว/เทิร์น"
                value={settings.drawPerTurn}
                {...LIMITS.drawPerTurn}
                onChange={(v) => deck.setSetting('drawPerTurn', v)}
              />
              <NumberField
                label="DON!!/เทิร์น"
                ariaLabel="DON!! ที่ได้ต่อเทิร์น"
                value={settings.donPerTurn}
                {...LIMITS.donPerTurn}
                onChange={(v) => deck.setSetting('donPerTurn', v)}
              />
              <NumberField
                label="DON!! สูงสุด"
                value={settings.maxDon}
                {...LIMITS.maxDon}
                onChange={(v) => deck.setSetting('maxDon', v)}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[0.65rem] leading-relaxed text-zinc-600">
                ฝ่ายเริ่มก่อนถูกหักให้อัตโนมัติตามกติกา — เทิร์นแรกไม่จั่ว และวาง DON!! ได้ใบเดียว
              </p>
              <button
                type="button"
                onClick={deck.resetAll}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 active:bg-zinc-800"
              >
                ⟳ คืนค่าเริ่มต้น
              </button>
            </div>
          </div>
        </details>

        <Section
          title="การ์ดที่อยากได้"
          action={
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-[0.7rem] text-zinc-400">
                <input
                  type="checkbox"
                  checked={settings.linkSides}
                  onChange={(e) => deck.setLinkSides(e.target.checked)}
                  className="h-4 w-4 accent-emerald-400"
                />
                ล็อกสองฝั่งให้เท่ากัน
              </label>
              <button
                type="button"
                onClick={deck.addCard}
                className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-200 active:bg-zinc-700"
              >
                + การ์ด
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-2">
            {cards.map((card, index) => (
              <CardRow
                key={card.id}
                card={card}
                index={index}
                turns={turns}
                linkSides={settings.linkSides}
                onPatch={(patch) => deck.updateCard(card.id, patch)}
                onNeed={(side, turnIndex, value) =>
                  deck.setNeed(card.id, side, turnIndex, value)
                }
                onRemove={() => deck.removeCard(card.id)}
              />
            ))}
          </div>

          <p className="mt-2 text-[0.7rem] text-zinc-500">
            รวมการ์ดที่ระบุ {totalCopies} ใบ จากเด็ค {settings.deckSize} ใบ
            {settings.linkSides && ' · กำลังล็อกสองฝั่งให้ใช้ค่าเดียวกัน'}
          </p>
          {overfilled && (
            <p className="mt-1 text-[0.7rem] font-semibold text-rose-300" role="alert">
              ⚠ จำนวนการ์ดรวมเกินขนาดเด็ค — % จะคำนวณไม่ได้จนกว่าจะแก้
            </p>
          )}
        </Section>

        <Section title="จั่วเพิ่มจากเอฟเฟกต์การ์ด">
          <MatrixTable turns={turns} corner="เทิร์น">
            {SIDES.map((side) => (
              <tr key={side}>
                <SideLabelCell side={side} />
                {turns.map((turn) => (
                  <td key={turn} className="px-0.5 py-0.5">
                    <NumberField
                      compact
                      ariaLabel={`จั่วเพิ่ม ${SIDE_META[side].label} เทิร์น ${turn}`}
                      value={settings.extraDraws[side][turn - 1] ?? 0}
                      {...LIMITS.extraDraw}
                      onChange={(v) => deck.setExtraDraw(side, turn - 1, v)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </MatrixTable>
          <p className="mt-2 text-[0.7rem] text-zinc-600">
            ใส่จำนวนใบที่การ์ดเอฟเฟกต์จั่วให้ในเทิร์นนั้น — บวกสะสมไปเทิร์นถัด ๆ ไปด้วย
          </p>
        </Section>

        <Section
          title="ผลลัพธ์"
          action={
            <div className="flex items-center gap-1">
              <span className="text-[0.7rem] text-zinc-500">เทิร์น</span>
              <StepButton
                label="ลดจำนวนเทิร์น"
                disabled={settings.turnCount <= LIMITS.turnCount.min}
                onPress={deck.removeTurn}
              >
                −
              </StepButton>
              <span className="w-6 text-center text-sm font-bold tabular-nums text-zinc-100">
                {settings.turnCount}
              </span>
              <StepButton
                label="เพิ่มจำนวนเทิร์น"
                disabled={settings.turnCount >= LIMITS.turnCount.max}
                onPress={deck.addTurn}
              >
                +
              </StepButton>
            </div>
          }
        >
          <ResultTable board={board} cards={cards} turns={turns} />

          <p className="mt-2 text-[0.65rem] leading-relaxed text-zinc-600">
            ตัวเลขใหญ่ = โอกาสมีการ์ดใบนั้นครบตามที่ตั้งไว้ —{' '}
            <span className="text-emerald-300">เขียว ≥ 80%</span> ·{' '}
            <span className="text-zinc-100">ขาว 50–80%</span> ·{' '}
            <span className="text-rose-300">แดง &lt; 50%</span> ·{' '}
            <span className="text-amber-400">เหลือง</span> = จั่วติดแล้วแต่ DON!! ไม่พอจ่ายคอสต์ ·{' '}
            <span className="text-zinc-500">–</span> ไม่ได้ตั้งเป้า
            <br />
            คิดจากการจั่วแบบสุ่มล้วน (hypergeometric) ยังไม่รวมมัลลิแกน การเสิร์ชการ์ดแบบเจาะจง
            และการ์ดที่ทิ้งไปเอง
          </p>
        </Section>
      </div>
    </div>
  )
}

/** บรรทัดสรุปกติกาที่ใช้คำนวณ — มีไว้ให้ติดไปในภาพแคปหน้าจอด้วย */
function assumptionLine(settings: DeckSettings): string {
  return [
    `เด็ค ${settings.deckSize} ใบ`,
    `มือเริ่มต้น ${settings.handSize}`,
    `จั่ว ${settings.drawPerTurn}/เทิร์น`,
    `DON!! +${settings.donPerTurn} สูงสุด ${settings.maxDon}`,
    'เริ่มก่อน: เทิร์นแรกไม่จั่ว + DON!! 1 ใบ',
  ].join(' · ')
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold tracking-wide text-zinc-300">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** ตารางที่คอลัมน์เป็นเทิร์น — เลื่อนแนวนอนได้เมื่อเทิร์นเยอะ ส่วนคอลัมน์ชื่อปักอยู่กับที่ */
function MatrixTable({
  turns,
  corner,
  children,
}: {
  turns: number[]
  corner: string
  children: ReactNode
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-zinc-950 pr-2 text-left text-[0.6rem] font-bold text-zinc-600">
              {corner}
            </th>
            {turns.map((turn) => (
              <th
                key={turn}
                className="min-w-[2.6rem] px-0.5 pb-1 text-center text-[0.6rem] font-bold text-zinc-500"
              >
                T{turn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function SideLabelCell({ side, sub }: { side: Side; sub?: string }) {
  const meta = SIDE_META[side]
  return (
    <th className="sticky left-0 z-10 bg-zinc-950 py-0.5 pr-2 text-left align-middle">
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
        <span className={`text-[0.7rem] font-bold ${meta.text}`}>{meta.label}</span>
      </span>
      {sub && <span className="block text-[0.6rem] text-zinc-600">{sub}</span>}
    </th>
  )
}

function CardRow({
  card,
  index,
  turns,
  linkSides,
  onPatch,
  onNeed,
  onRemove,
}: {
  card: CardEntry
  index: number
  turns: number[]
  linkSides: boolean
  onPatch: (patch: Partial<CardEntry>) => void
  onNeed: (side: Side, turnIndex: number, value: number) => void
  onRemove: () => void
}) {
  const sides: Side[] = linkSides ? ['first'] : SIDES

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={card.name}
          placeholder={`การ์ด ${index + 1}`}
          maxLength={40}
          aria-label={`ชื่อการ์ด ${index + 1}`}
          onChange={(e) => onPatch({ name: e.target.value })}
          className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-sm font-semibold text-zinc-50 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />
        <span className="text-[0.65rem] font-semibold text-zinc-500">ในเด็ค</span>
        <NumberField
          compact
          className="w-11"
          ariaLabel={`จำนวนใบในเด็คของการ์ด ${index + 1}`}
          value={card.copies}
          {...LIMITS.copies}
          onChange={(v) => onPatch({ copies: v })}
        />
        <span className="text-[0.65rem] font-semibold text-zinc-500">คอสต์</span>
        <NumberField
          compact
          className="w-11"
          ariaLabel={`คอสต์ของการ์ด ${index + 1}`}
          value={card.cost}
          {...LIMITS.cost}
          onChange={(v) => onPatch({ cost: v })}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`ลบการ์ด ${index + 1}`}
          className="h-8 w-8 shrink-0 rounded-lg bg-zinc-900 text-sm font-bold text-zinc-500 active:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      <div className="mt-1.5">
        <MatrixTable turns={turns} corner="ต้องการในมือ">
          {sides.map((side) => (
            <tr key={side}>
              <SideLabelCell side={side} sub={linkSides ? 'ใช้ทั้งสองฝั่ง' : undefined} />
              {turns.map((turn) => (
                <td key={turn} className="px-0.5 py-0.5">
                  <NumberField
                    compact
                    ariaLabel={`การ์ด ${index + 1} ${SIDE_META[side].label} ต้องการในมือ เทิร์น ${turn}`}
                    value={card.need[side][turn - 1] ?? 0}
                    {...LIMITS.need}
                    onChange={(v) => onNeed(side, turn - 1, v)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </MatrixTable>
      </div>
    </div>
  )
}

function ResultTable({
  board,
  cards,
  turns,
}: {
  board: Board
  cards: CardEntry[]
  turns: number[]
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-zinc-950" />
            {turns.map((turn) => (
              <th
                key={turn}
                className="min-w-[3rem] px-1 pb-1 text-center text-[0.65rem] font-bold text-zinc-400"
              >
                T{turn}
              </th>
            ))}
          </tr>
        </thead>

        {SIDES.map((side) => (
          <SideBlock
            key={side}
            side={side}
            results={board[side]}
            cards={cards}
            turns={turns}
          />
        ))}
      </table>
    </div>
  )
}

function SideBlock({
  side,
  results,
  cards,
  turns,
}: {
  side: Side
  results: TurnResult[]
  cards: CardEntry[]
  turns: number[]
}) {
  const meta = SIDE_META[side]
  const showAllRow = results.some((r) => r.targetCount >= 2)

  return (
    <tbody className="border-t border-zinc-800">
      <tr>
        <th
          colSpan={turns.length + 1}
          className="sticky left-0 py-1 text-left text-[0.7rem] font-bold"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2 w-2 rounded-full ${meta.dot}`} />
            <span className={meta.text}>{meta.label}</span>
          </span>
        </th>
      </tr>

      <StatRow
        label="เห็นการ์ด"
        values={results.map((r) => (
          <span className={r.deckOut ? 'text-amber-400' : 'text-zinc-400'}>
            {r.cardsSeen}
          </span>
        ))}
      />
      <StatRow
        label="DON!!"
        values={results.map((r) => <span className="text-zinc-400">{r.don}</span>)}
      />

      {cards.map((card, index) => (
        <tr key={card.id} className="border-t border-zinc-900">
          <th className="sticky left-0 z-10 max-w-[8rem] bg-zinc-950 py-1 pr-2 text-left">
            <span className="block truncate text-[0.7rem] font-semibold text-zinc-300">
              {card.name || `การ์ด ${index + 1}`}
            </span>
            <span className="block text-[0.6rem] text-zinc-600">
              ×{card.copies} · คอสต์ {card.cost}
            </span>
          </th>
          {results.map((result) => {
            const cell = result.cells[index]
            return (
              <td key={result.turn} className="px-1 py-1 text-center">
                {cell.chance === null ? (
                  <span className="text-[0.75rem] text-zinc-700">–</span>
                ) : (
                  <span
                    className={`text-[0.95rem] leading-none font-black tabular-nums ${
                      cell.affordable ? toneFor(cell.chance) : 'text-amber-400'
                    }`}
                    title={
                      cell.affordable
                        ? undefined
                        : `DON!! เทิร์นนี้ ${result.don} ไม่พอจ่ายคอสต์ ${card.cost}`
                    }
                  >
                    {formatPercent(cell.chance)}
                  </span>
                )}
              </td>
            )
          })}
        </tr>
      ))}

      {showAllRow && (
        <tr className="border-t border-zinc-800">
          <th className="sticky left-0 z-10 bg-zinc-950 py-1 pr-2 text-left text-[0.7rem] font-semibold text-zinc-400">
            ครบทุกใบที่ตั้ง
          </th>
          {results.map((result) => (
            <td
              key={result.turn}
              className="px-1 py-1 text-center text-[0.7rem] font-semibold tabular-nums text-zinc-300"
            >
              {result.allTargets === null || result.targetCount < 2 ? (
                <span className="text-zinc-700">–</span>
              ) : (
                formatPercent(result.allTargets)
              )}
            </td>
          ))}
        </tr>
      )}

      <tr>
        <th className="sticky left-0 z-10 bg-zinc-950 py-0.5 pr-2 text-left text-[0.6rem] font-normal text-zinc-600">
          เล่นได้ ≥ 1 ใบ
        </th>
        {results.map((result) => (
          <td
            key={result.turn}
            className="px-1 py-0.5 text-center text-[0.6rem] tabular-nums text-zinc-600"
          >
            {result.anyPlayable === null ? '–' : formatPercent(result.anyPlayable)}
          </td>
        ))}
      </tr>
    </tbody>
  )
}

function StatRow({ label, values }: { label: string; values: ReactNode[] }) {
  return (
    <tr>
      <th className="sticky left-0 z-10 bg-zinc-950 py-0.5 pr-2 text-left text-[0.65rem] font-semibold text-zinc-500">
        {label}
      </th>
      {values.map((value, index) => (
        <td
          key={index}
          className="px-1 py-0.5 text-center text-[0.7rem] font-semibold tabular-nums"
        >
          {value}
        </td>
      ))}
    </tr>
  )
}

function StepButton({
  children,
  label,
  disabled,
  onPress,
}: {
  children: string
  label: string
  disabled: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      className="h-7 w-7 shrink-0 rounded-lg bg-zinc-800 text-base leading-none font-black text-zinc-200 transition-colors active:bg-zinc-700 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

/** สีตาม % เพื่อให้กวาดตาหาเทิร์นที่ยังไม่ผ่านเกณฑ์ได้เร็ว */
function toneFor(probability: number) {
  if (probability >= 0.8) return 'text-emerald-300'
  if (probability >= 0.5) return 'text-zinc-100'
  return 'text-rose-300'
}
