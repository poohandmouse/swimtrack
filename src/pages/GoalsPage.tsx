import { useMemo, useState } from 'react'
import { SWIM_EVENTS, getEventLabel } from '../data/events'
import { formatSwimTime, parseSwimTime } from '../lib/time'
import type { useAppState } from '../hooks/useAppState'
import { Target } from 'lucide-react'

export function GoalsPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const swimmer = app.activeSwimmer
  const [event, setEvent] = useState(SWIM_EVENTS[0].id)
  const [target, setTarget] = useState('')

  const goals = useMemo(() => {
    if (!swimmer) return []
    return app.state.goals.filter((g) => g.swimmerId === swimmer.id)
  }, [swimmer, app.state.goals])

  const bestByEvent = useMemo(() => {
    if (!swimmer) return new Map<string, number>()
    const map = new Map<string, number>()
    app.swimmerResults(swimmer.id).forEach((r) => {
      const cur = map.get(r.event)
      if (!cur || r.timeSeconds < cur) map.set(r.event, r.timeSeconds)
    })
    return map
  }, [swimmer, app])

  if (!swimmer) return null

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const sec = parseSwimTime(target)
    if (sec === null) return
    app.addGoal({ swimmerId: swimmer.id, event, targetSeconds: sec })
    setTarget('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Goal Setting</h2>

      <form onSubmit={addGoal} className="card p-6 flex flex-wrap gap-3 items-end">
        <label className="flex-1 min-w-[160px] text-sm">
          <span className="text-slate-600 dark:text-slate-400">Event</span>
          <select className="input-field mt-1" value={event} onChange={(e) => setEvent(e.target.value)}>
            {SWIM_EVENTS.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-[120px] text-sm">
          <span className="text-slate-600 dark:text-slate-400">Target time</span>
          <input className="input-field mt-1 font-mono" placeholder="1:00.00" value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
        <button type="submit" className="btn-primary">Set goal</button>
      </form>

      <div className="space-y-4">
        {goals.map((g) => {
          const best = bestByEvent.get(g.event)
          const gap = best !== undefined ? best - g.targetSeconds : Infinity
          const progress = gap <= 0 ? 100 : Math.max(0, Math.min(95, 100 - (gap / (best ?? 1)) * 80))
          const met = best !== undefined && best <= g.targetSeconds

          return (
            <div key={g.id} className="card p-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{getEventLabel(g.event)}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Goal: <span className="font-mono text-lane-goal">{formatSwimTime(g.targetSeconds)}</span>
                    {best !== undefined && (
                      <> · Best: <span className="font-mono">{formatSwimTime(best)}</span></>
                    )}
                  </p>
                </div>
                {met ? (
                  <span className="pr-badge flex items-center gap-1">
                    <Target className="w-3 h-3" /> Met!
                  </span>
                ) : (
                  <button type="button" className="text-sm text-red-500" onClick={() => app.deleteGoal(g.id)}>
                    Remove
                  </button>
                )}
              </div>
              {best !== undefined && !met && (
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pool-500 to-lane-goal rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {(best - g.targetSeconds).toFixed(2)}s to goal
                  </p>
                </div>
              )}
            </div>
          )
        })}
        {goals.length === 0 && (
          <p className="text-center text-slate-500 py-8">No goals set. Add a target time to track progress.</p>
        )}
      </div>
    </div>
  )
}