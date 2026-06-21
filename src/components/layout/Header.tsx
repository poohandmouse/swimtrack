import { Download, Moon, Sun, Waves, ChevronDown } from 'lucide-react'
import type { Swimmer } from '../../types'

export function Header({
  swimmers,
  activeSwimmer,
  onSelectSwimmer,
  onToggleTheme,
  theme,
  onExport,
  onManageProfiles,
}: {
  swimmers: Swimmer[]
  activeSwimmer: Swimmer | null
  onSelectSwimmer: (id: string) => void
  onToggleTheme: () => void
  theme: 'light' | 'dark'
  onExport: () => void
  onManageProfiles: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-pool-500/15 text-pool-600 dark:text-pool-400 shrink-0">
            <Waves className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">SwimTrack</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Performance tracker for ages 13–17</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {swimmers.length > 0 && activeSwimmer ? (
            <div className="relative">
              <select
                value={activeSwimmer.id}
                onChange={(e) => onSelectSwimmer(e.target.value)}
                className="appearance-none input-field pr-8 py-1.5 min-w-[140px] bg-pool-50 dark:bg-slate-800 border-pool-200 dark:border-slate-600"
              >
                {swimmers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          ) : (
            <button type="button" onClick={onManageProfiles} className="btn-primary text-sm">
              Add Swimmer
            </button>
          )}

          <button type="button" onClick={onManageProfiles} className="btn-secondary hidden sm:inline-flex text-sm">
            Profiles
          </button>
          {activeSwimmer && (
            <button type="button" onClick={onExport} className="btn-secondary hidden md:inline-flex text-sm" title="Export PDF">
              <Download className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onToggleTheme} className="btn-secondary p-2" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}