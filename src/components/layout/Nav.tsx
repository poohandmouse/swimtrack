import { cn } from '../../lib/utils'
import { LayoutDashboard, Plus, List, Target, Dumbbell, BarChart3, User, Upload } from 'lucide-react'

export type Page = 'dashboard' | 'add' | 'import' | 'results' | 'goals' | 'training' | 'analysis' | 'profiles'

const ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'add', label: 'Add Result', icon: Plus },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'results', label: 'History', icon: List },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'profiles', label: 'Profiles', icon: User },
]

export function Nav({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
      <div className="max-w-6xl mx-auto px-4 flex gap-1">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              page === id
                ? 'border-pool-500 text-pool-600 dark:text-pool-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}