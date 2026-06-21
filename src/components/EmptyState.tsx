import { Waves } from 'lucide-react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="card p-10 text-center max-w-md mx-auto mt-12">
      <div className="inline-flex p-4 rounded-full bg-pool-100 dark:bg-pool-900/30 text-pool-600 dark:text-pool-400 mb-4">
        <Waves className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="text-slate-500 mt-2 text-sm leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}