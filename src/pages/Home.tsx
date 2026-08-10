import { Link } from 'react-router-dom'
import { GAMES } from '../games/registry'

export default function Home() {
  return (
    <div
      className="min-h-[100dvh] bg-zinc-950 px-4 py-8"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 2rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
      }}
    >
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-zinc-50">TCG Tools</h1>
          <p className="mt-2 text-base text-zinc-400">
            เครื่องมือช่วยเล่นการ์ด — เลือกเกมที่จะเล่น
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {GAMES.map((game) => {
            const body = (
              <>
                <span aria-hidden className="text-4xl leading-none">
                  {game.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-bold text-zinc-50">{game.name}</span>
                  <span className="block text-sm text-zinc-400">{game.subtitle}</span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {game.ready
                      ? `นับ ${game.counters.map((c) => c.label).join(' · ')}`
                      : 'เร็ว ๆ นี้'}
                  </span>
                </span>
                <span aria-hidden className="text-2xl text-zinc-600">
                  {game.ready ? '›' : '🔒'}
                </span>
              </>
            )

            return (
              <li key={game.id}>
                {game.ready ? (
                  <Link
                    to={`/g/${game.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-colors active:bg-zinc-800"
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    aria-disabled
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 opacity-50"
                  >
                    {body}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-center text-sm text-zinc-600">เกมอื่นเร็ว ๆ นี้</p>
      </div>
    </div>
  )
}
