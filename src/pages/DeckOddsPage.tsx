import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import NumberField from '../components/NumberField'
import { useDeckOdds } from '../hooks/useDeckOdds'
import { LIMITS, TURNS, type CardEntry, type TurnResult } from '../lib/deckOdds'

export default function DeckOddsPage() {
  const deck = useDeckOdds()
  const { settings, cards, results, totalCopies } = deck
  const overfilled = totalCopies > settings.deckSize

  return (
    <div
      className="min-h-[100dvh] bg-zinc-950 px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)',
      }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6">
          <Link
            to="/"
            className="-ml-2 inline-block rounded-lg px-2 py-1 text-sm font-semibold text-zinc-400 active:bg-zinc-800"
          >
            ‹ กลับ
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-50">
            โอกาสจั่วเจอการ์ด
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            คำนวณ % ที่จะมีการ์ดที่เล่นได้ในแต่ละเทิร์น · อ้างอิงกติกาพื้นฐาน One Piece TCG
          </p>
        </header>

        <Section
          title="เด็คและการจั่ว"
          action={
            <button
              type="button"
              onClick={deck.resetAll}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 active:bg-zinc-800"
            >
              ⟳ คืนค่าเริ่มต้น
            </button>
          }
        >
          <div className="grid grid-cols-3 gap-2">
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
          </div>

          <label className="mt-3 flex items-center gap-3 rounded-xl bg-zinc-950/60 px-3 py-2.5">
            <input
              type="checkbox"
              checked={settings.skipFirstDraw}
              onChange={(e) => deck.setSkipFirstDraw(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-emerald-400"
            />
            <span className="text-sm text-zinc-300">
              เล่นก่อน — เทิร์นแรกไม่ได้จั่ว
              <span className="block text-xs text-zinc-500">
                ติ๊กเมื่อเป็นฝ่ายเริ่มเกม เทิร์น 1 จะเห็นแค่การ์ดในมือเริ่มต้น
              </span>
            </span>
          </label>

          <h3 className="mt-4 mb-2 text-xs font-bold tracking-wide text-zinc-500">
            พลังงาน (DON!!)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="เริ่มต้น"
              ariaLabel="พลังงานเริ่มต้น"
              value={settings.startEnergy}
              {...LIMITS.startEnergy}
              onChange={(v) => deck.setSetting('startEnergy', v)}
            />
            <NumberField
              label="เพิ่ม/เทิร์น"
              ariaLabel="พลังงานที่เพิ่มต่อเทิร์น"
              value={settings.energyPerTurn}
              {...LIMITS.energyPerTurn}
              onChange={(v) => deck.setSetting('energyPerTurn', v)}
            />
            <NumberField
              label="สูงสุด"
              ariaLabel="พลังงานสูงสุด"
              value={settings.maxEnergy}
              {...LIMITS.maxEnergy}
              onChange={(v) => deck.setSetting('maxEnergy', v)}
            />
          </div>
        </Section>

        <Section
          title="การ์ดที่อยากได้"
          action={
            <button
              type="button"
              onClick={deck.addCard}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200 active:bg-zinc-700"
            >
              + เพิ่มการ์ด
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            {cards.map((card, index) => (
              <CardRow
                key={card.id}
                card={card}
                index={index}
                onPatch={(patch) => deck.updateCard(card.id, patch)}
                onNeed={(turnIndex, value) => deck.setNeed(card.id, turnIndex, value)}
                onRemove={() => deck.removeCard(card.id)}
              />
            ))}
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            รวมการ์ดที่ระบุ {totalCopies} ใบ จากเด็ค {settings.deckSize} ใบ
          </p>
          {overfilled && (
            <p className="mt-1 text-xs font-semibold text-rose-300" role="alert">
              ⚠ จำนวนการ์ดรวมเกินขนาดเด็ค — % จะคำนวณไม่ได้จนกว่าจะแก้
            </p>
          )}
        </Section>

        <Section title="ผลลัพธ์แต่ละเทิร์น">
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((result) => (
              <TurnCard
                key={result.turn}
                result={result}
                extraDraw={settings.extraDraws[result.turn - 1] ?? 0}
                onExtraDraw={(value) => deck.setExtraDraw(result.turn - 1, value)}
              />
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-600">
            คิดจากสูตร hypergeometric — นับการ์ดที่เห็นแล้วสะสมตั้งแต่มือเริ่มต้นถึงเทิร์นนั้น
            ยังไม่รวมการมัลลิแกน การเสิร์ชการ์ดแบบเจาะจง และการ์ดที่ทิ้งไปเอง
          </p>
        </Section>
      </div>
    </div>
  )
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
    <section className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold tracking-wide text-zinc-300">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function CardRow({
  card,
  index,
  onPatch,
  onNeed,
  onRemove,
}: {
  card: CardEntry
  index: number
  onPatch: (patch: Partial<CardEntry>) => void
  onNeed: (turnIndex: number, value: number) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[0.65rem] font-semibold text-zinc-500">ชื่อการ์ด</span>
          <input
            type="text"
            value={card.name}
            placeholder={`การ์ด ${index + 1}`}
            maxLength={40}
            onChange={(e) => onPatch({ name: e.target.value })}
            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm font-semibold text-zinc-50 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
          />
        </label>
        <NumberField
          label="ในเด็ค"
          ariaLabel={`จำนวนใบในเด็คของการ์ด ${index + 1}`}
          className="w-16"
          value={card.copies}
          {...LIMITS.copies}
          onChange={(v) => onPatch({ copies: v })}
        />
        <NumberField
          label="คอสต์"
          ariaLabel={`คอสต์ของการ์ด ${index + 1}`}
          className="w-16"
          value={card.cost}
          {...LIMITS.cost}
          onChange={(v) => onPatch({ cost: v })}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`ลบการ์ด ${index + 1}`}
          className="h-11 w-11 shrink-0 rounded-xl bg-zinc-800 text-lg leading-none font-bold text-zinc-500 active:bg-zinc-700"
        >
          ✕
        </button>
      </div>

      <div className="mt-3">
        <span className="text-[0.65rem] font-semibold text-zinc-500">
          ต้องการในมือกี่ใบ (แต่ละเทิร์น)
        </span>
        <div className="mt-1 grid grid-cols-5 gap-2">
          {Array.from({ length: TURNS }, (_, turnIndex) => (
            <NumberField
              key={turnIndex}
              label={`T${turnIndex + 1}`}
              ariaLabel={`การ์ด ${index + 1} ต้องการในมือ เทิร์น ${turnIndex + 1}`}
              value={card.need[turnIndex] ?? 0}
              {...LIMITS.need}
              onChange={(v) => onNeed(turnIndex, v)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TurnCard({
  result,
  extraDraw,
  onExtraDraw,
}: {
  result: TurnResult
  extraDraw: number
  onExtraDraw: (value: number) => void
}) {
  const tone = toneFor(result.anyPlayable)

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-zinc-100">เทิร์น {result.turn}</span>
        <span className="text-[0.7rem] text-zinc-500">
          เห็นแล้ว {result.cardsSeen} ใบ · ⚡ {result.energy}
          {result.deckOut && <span className="text-amber-400"> · จั่วหมดเด็ค</span>}
        </span>
      </div>

      {result.anyPlayable === null ? (
        <p className="mt-3 flex-1 text-xs text-zinc-500">
          ยังไม่ได้ตั้ง “ต้องการในมือ” ของเทิร์นนี้ — ใส่ตัวเลขในช่อง T{result.turn}{' '}
          ด้านบนเพื่อดู %
        </p>
      ) : (
        <>
          <div className="mt-2 flex items-end gap-2">
            <span className={`text-4xl leading-none font-black tabular-nums ${tone.text}`}>
              {formatPercent(result.anyPlayable)}
            </span>
            <span className="pb-0.5 text-[0.7rem] leading-tight text-zinc-400">
              โอกาสมีการ์ด
              <br />
              ที่เล่นได้ ≥ 1 ใบ
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full ${tone.bar}`}
              style={{ width: `${result.anyPlayable * 100}%` }}
            />
          </div>

          {result.targets.length > 1 && result.allTargets !== null && (
            <p className="mt-2 text-[0.7rem] text-zinc-400">
              ได้ครบทุกใบที่ตั้งไว้{' '}
              <span className="font-bold text-zinc-200">
                {formatPercent(result.allTargets)}
              </span>
            </p>
          )}

          <ul className="mt-2 flex flex-col gap-1 border-t border-zinc-800 pt-2">
            {result.targets.map((target, index) => (
              <li key={target.id} className="flex items-center gap-2 text-[0.7rem]">
                <span className="min-w-0 flex-1 truncate text-zinc-300">
                  {target.name || `การ์ด ${index + 1}`}
                  <span className="text-zinc-600">
                    {' '}
                    ×{target.copies} · คอสต์ {target.cost}
                  </span>
                </span>
                {!target.affordable && (
                  <span className="shrink-0 rounded bg-amber-400/15 px-1 font-semibold text-amber-300">
                    ⚡ ไม่พอ
                  </span>
                )}
                <span className="shrink-0 text-zinc-500">ขอ {target.need}</span>
                <span className="w-12 shrink-0 text-right font-bold tabular-nums text-zinc-100">
                  {formatPercent(target.chance)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-zinc-900 px-2 py-1.5">
        <span className="text-[0.7rem] text-zinc-400">
          จั่วเพิ่มเทิร์นนี้
          <span className="block text-[0.6rem] text-zinc-600">จากเอฟเฟกต์การ์ด</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <StepButton
            label={`ลดจั่วเพิ่มเทิร์น ${result.turn}`}
            disabled={extraDraw <= LIMITS.extraDraw.min}
            onPress={() => onExtraDraw(extraDraw - 1)}
          >
            −
          </StepButton>
          <span className="w-7 text-center text-lg leading-none font-bold tabular-nums text-zinc-100">
            {extraDraw}
          </span>
          <StepButton
            label={`เพิ่มจั่วเพิ่มเทิร์น ${result.turn}`}
            disabled={extraDraw >= LIMITS.extraDraw.max}
            onPress={() => onExtraDraw(extraDraw + 1)}
          >
            +
          </StepButton>
        </div>
      </div>
    </div>
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
      className="h-9 w-9 shrink-0 rounded-lg bg-zinc-800 text-xl leading-none font-black text-zinc-200 transition-colors active:bg-zinc-700 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

/** สีตาม % เพื่อให้กวาดตาหาเทิร์นที่ยังไม่ผ่านเกณฑ์ได้เร็ว */
function toneFor(probability: number | null) {
  if (probability === null) return { text: 'text-zinc-500', bar: 'bg-zinc-700' }
  if (probability >= 0.8) return { text: 'text-emerald-300', bar: 'bg-emerald-400' }
  if (probability >= 0.5) return { text: 'text-amber-300', bar: 'bg-amber-400' }
  return { text: 'text-rose-300', bar: 'bg-rose-400' }
}
