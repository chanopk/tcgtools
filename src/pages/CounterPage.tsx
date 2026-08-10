import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import PlayerPanel from '../components/PlayerPanel'
import { getGame } from '../games/registry'
import type { GameDef } from '../games/types'
import { useMatch } from '../hooks/useMatch'
import { useWakeLock } from '../hooks/useWakeLock'

export default function CounterPage() {
  const { gameId } = useParams()
  const game = getGame(gameId)

  if (!game) return <Navigate to="/" replace />
  return <CounterBoard game={game} />
}

function CounterBoard({ game }: { game: GameDef }) {
  const [keepAwake, setKeepAwake] = useState(true)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const wakeLock = useWakeLock(keepAwake)
  const match = useMatch(game)

  const outcomeFor = (index: 0 | 1) =>
    match.winner === null ? null : match.winner === index ? 'win' : 'lose'

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-zinc-950"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <PlayerPanel
        name="ผู้เล่น 2"
        accent="sky"
        flipped
        counters={game.counters}
        values={match.state[1]}
        outcome={outcomeFor(1)}
        onAdjust={(key, delta) => match.adjust(1, key, delta)}
      />

      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-y border-zinc-800 bg-zinc-900 px-3">
        {confirmingReset ? (
          <>
            <span className="truncate text-sm text-zinc-300">
              เริ่มเกมใหม่? ค่าทั้งหมดกลับไปตั้งต้น
            </span>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-300 active:bg-zinc-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  match.reset()
                  setConfirmingReset(false)
                }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white active:bg-red-400"
              >
                ยืนยัน
              </button>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/"
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-semibold text-zinc-400 active:bg-zinc-800"
            >
              ‹ เปลี่ยนเกม
            </Link>

            <span className="truncate text-xs font-semibold text-zinc-500">
              {game.name}
            </span>

            <div className="flex shrink-0 items-center gap-2">
              {wakeLock.supported && (
                <button
                  type="button"
                  aria-pressed={keepAwake}
                  onClick={() => setKeepAwake((v) => !v)}
                  className={`rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors ${
                    wakeLock.active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                  title={keepAwake ? 'กันจอดับอยู่' : 'ปล่อยให้จอดับได้'}
                >
                  ☀ จอ
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-200 active:bg-zinc-700"
              >
                ⟳ เริ่มใหม่
              </button>
            </div>
          </>
        )}
      </div>

      <PlayerPanel
        name="ผู้เล่น 1"
        accent="amber"
        flipped={false}
        counters={game.counters}
        values={match.state[0]}
        outcome={outcomeFor(0)}
        onAdjust={(key, delta) => match.adjust(0, key, delta)}
      />
    </div>
  )
}
