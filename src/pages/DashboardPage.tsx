import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { getEventLabel, SWIM_EVENTS } from '../data/events'
import { getStateName } from '../data/states'
import { formatSwimTime, formatDate } from '../lib/time'
import type { useAppState } from '../hooks/useAppState'
import { Trophy, TrendingDown } from 'lucide-react'

export function DashboardPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const swimmer = app.activeSwimmer
  const [chartEvent, setChartEvent] = useState('')

  const results = swimmer ? app.swimmerResults(swimmer.id) : []
  const eventsWithData = useMemo(() => {
    const set = new Set(results.map((r) => r.event))
    return SWIM_EVENTS.filter((e) => set.has(e.id))
  }, [results])

  const selectedEvent = chartEvent || eventsWithData[0]?.id || ''

  const chartData = useMemo(() => {
    return results
      .filter((r) => r.event === selectedEvent)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        date: formatDate(r.date),
        time: r.timeSeconds,
        label: formatSwimTime(r.timeSeconds),
        pr: r.isPR,
      }))
  }, [results, selectedEvent])

  const prs = results.filter((r) => r.isPR)
  const goals = swimmer ? app.state.goals.filter((g) => g.swimmerId === swimmer.id) : []
  const goalsMet = goals.filter((g) => {
    const best = results.filter((r) => r.event === g.event).map((r) => r.timeSeconds)
    return best.length && Math.min(...best) <= g.targetSeconds
  }).length

  const improvement = useMemo(() => {
    if (chartData.length < 2) return null
    const first = chartData[0].time
    const last = chartData[chartData.length - 1].time
    return first - last
  }, [chartData])

  if (!swimmer) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {swimmer.name}&apos;s Dashboard
          </h2>
          <p className="text-slate-500 text-sm">
            {swimmer.club} · Age {swimmer.age}
            {swimmer.state ? ` · ${getStateName(swimmer.state)}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total swims" value={String(results.length)} />
        <StatCard label="Personal bests" value={String(prs.length)} icon={<Trophy className="w-5 h-5 text-lane-pr" />} highlight />
        <StatCard label="Events swum" value={String(eventsWithData.length)} />
        <StatCard label="Goals met" value={`${goalsMet}/${goals.length}`} />
      </div>

      {eventsWithData.length > 0 ? (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Progress by event</h3>
              {improvement !== null && improvement > 0 && (
                <p className="text-sm text-lane-pr flex items-center gap-1 mt-1">
                  <TrendingDown className="w-4 h-4" />
                  {improvement.toFixed(2)}s improvement over recorded history
                </p>
              )}
            </div>
            <select
              className="input-field w-auto"
              value={selectedEvent}
              onChange={(e) => setChartEvent(e.target.value)}
            >
              {eventsWithData.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatSwimTime(v)}
                  reversed
                />
                <Tooltip
                  formatter={(v) => [formatSwimTime(Number(v)), 'Time']}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#0ea5e9' }}
                  activeDot={{ r: 6, fill: '#22c55e' }}
                />
                {goals
                  .filter((g) => g.event === selectedEvent)
                  .map((g) => (
                    <ReferenceLine
                      key={g.id}
                      y={g.targetSeconds}
                      stroke="#14b8a6"
                      strokeDasharray="4 4"
                      label={{ value: 'Goal', fill: '#14b8a6', fontSize: 11 }}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">Green dots = personal bests · Teal dashed line = goal time</p>
        </div>
      ) : (
        <div className="card p-8 text-center text-slate-500">
          Add results to see progress charts and PR timeline.
        </div>
      )}

      {prs.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Recent PRs</h3>
          <ul className="space-y-2">
            {[...prs]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((r) => (
                <li key={r.id} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span>
                    <span className="pr-badge mr-2">PR</span>
                    {getEventLabel(r.event)}
                  </span>
                  <span className="font-mono">{formatSwimTime(r.timeSeconds)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={`card p-4 ${highlight ? 'border-lane-pr/30 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
      <div className="flex justify-between items-start">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{value}</p>
    </div>
  )
}