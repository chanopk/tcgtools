import type { CounterDef } from '../games/types'
import type { PlayerCounters } from '../hooks/useMatch'

export type AccentName = 'amber' | 'sky'

/**
 * เขียน class เต็ม ๆ ไว้ตรงนี้เพราะ Tailwind สแกนซอร์สแบบข้อความ
 * ต่อ string เอาเอง (`bg-${color}-500`) จะไม่ถูก generate
 */
const ACCENTS: Record<
  AccentName,
  { text: string; surface: string; border: string; button: string; badge: string }
> = {
  amber: {
    text: 'text-amber-300',
    surface: 'bg-amber-500/[0.07]',
    border: 'border-amber-400/20',
    button: 'bg-amber-500/15 text-amber-200 active:bg-amber-400/40',
    badge: 'bg-amber-400 text-amber-950',
  },
  sky: {
    text: 'text-sky-300',
    surface: 'bg-sky-500/[0.07]',
    border: 'border-sky-400/20',
    button: 'bg-sky-500/15 text-sky-200 active:bg-sky-400/40',
    badge: 'bg-sky-400 text-sky-950',
  },
}

interface Props {
  name: string
  accent: AccentName
  counters: CounterDef[]
  values: PlayerCounters
  /** true = หมุน 180° ให้ผู้เล่นที่นั่งฝั่งตรงข้ามอ่านได้ */
  flipped: boolean
  outcome: 'win' | 'lose' | null
  onAdjust: (counterKey: string, delta: number) => void
}

export default function PlayerPanel({
  name,
  accent,
  counters,
  values,
  flipped,
  outcome,
  onAdjust,
}: Props) {
  const a = ACCENTS[accent]
  const primary = counters.find((c) => c.role === 'primary')
  const resources = counters.filter((c) => c.role === 'resource')

  return (
    <section
      className={[
        'flex min-h-0 flex-1 flex-col gap-2 px-3 py-2 transition-opacity',
        a.surface,
        flipped ? 'rotate-180' : '',
        outcome === 'lose' ? 'opacity-45' : '',
      ].join(' ')}
      aria-label={name}
    >
      <header className="flex shrink-0 items-center justify-between">
        <span className={`text-sm font-semibold tracking-wide ${a.text}`}>{name}</span>
        {outcome === 'win' && (
          <span
            className={`rounded-full px-3 py-0.5 text-sm font-bold ${a.badge}`}
            role="status"
          >
            🏆 ชนะ!
          </span>
        )}
        {outcome === 'lose' && (
          <span className="rounded-full bg-zinc-700 px-3 py-0.5 text-sm font-bold text-zinc-300">
            แพ้
          </span>
        )}
      </header>

      {primary && (
        <div className="flex min-h-0 flex-1 items-stretch gap-2">
          <StepButton
            className={a.button}
            label={`ลด ${primary.label} ของ${name}`}
            disabled={values[primary.key] <= primary.min}
            onPress={() => onAdjust(primary.key, -primary.step)}
          >
            −
          </StepButton>

          <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
            <span
              className="text-[clamp(3rem,17vh,8.5rem)] leading-none font-black tabular-nums"
              aria-live="polite"
            >
              {values[primary.key]}
            </span>
            <span className={`mt-1 text-xs font-semibold ${a.text}`}>
              {primary.label}
              {primary.hint && (
                <span className="text-zinc-500"> · {primary.hint}</span>
              )}
            </span>
          </div>

          <StepButton
            className={a.button}
            label={`เพิ่ม ${primary.label} ของ${name}`}
            disabled={values[primary.key] >= primary.max}
            onPress={() => onAdjust(primary.key, primary.step)}
          >
            +
          </StepButton>
        </div>
      )}

      {resources.length > 0 && (
        <div className="flex shrink-0 gap-2">
          {resources.map((counter) => (
            <div
              key={counter.key}
              className={`flex flex-1 flex-col rounded-xl border ${a.border} bg-zinc-900/60 px-2 py-1`}
            >
              <span className="text-center text-[0.65rem] leading-tight font-semibold text-zinc-400">
                {counter.label}
                {counter.hint && <span className="text-zinc-600"> · {counter.hint}</span>}
              </span>
              <div className="flex items-center gap-1">
                <MiniButton
                  className={a.button}
                  label={`ลด ${counter.label} ของ${name}`}
                  disabled={values[counter.key] <= counter.min}
                  onPress={() => onAdjust(counter.key, -counter.step)}
                >
                  −
                </MiniButton>
                <span className="flex-1 text-center text-2xl leading-none font-bold tabular-nums">
                  {values[counter.key]}
                </span>
                <MiniButton
                  className={a.button}
                  label={`เพิ่ม ${counter.label} ของ${name}`}
                  disabled={values[counter.key] >= counter.max}
                  onPress={() => onAdjust(counter.key, counter.step)}
                >
                  +
                </MiniButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

interface ButtonProps {
  children: string
  className: string
  label: string
  disabled: boolean
  onPress: () => void
}

function StepButton({ children, className, label, disabled, onPress }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      className={`w-[27%] shrink-0 rounded-2xl text-[clamp(2.25rem,8vh,4rem)] leading-none font-black transition-colors disabled:opacity-25 ${className}`}
    >
      {children}
    </button>
  )
}

function MiniButton({ children, className, label, disabled, onPress }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      className={`h-10 w-11 shrink-0 rounded-lg text-2xl leading-none font-black transition-colors disabled:opacity-25 ${className}`}
    >
      {children}
    </button>
  )
}
