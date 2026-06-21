import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatSwimTime } from '../../lib/time'
import type { UnderwaterKickPoint, WeeklyYardagePoint } from '../../utils/trainingStats'

export function TrainingCharts({
  weeklyYardage,
  underwaterKicks,
}: {
  weeklyYardage: WeeklyYardagePoint[]
  underwaterKicks: UnderwaterKickPoint[]
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white">Weekly yardage</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Total yards logged per week</p>
        {weeklyYardage.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-slate-500">
            Log sessions to see weekly volume trends.
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyYardage} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 10 }} width={48} />
                <Tooltip
                  formatter={(v) => [`${v} yd`, 'Yardage']}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as WeeklyYardagePoint | undefined
                    return row ? `Week of ${row.weekLabel} · ${row.sessions} session${row.sessions !== 1 ? 's' : ''}` : ''
                  }}
                />
                <Bar dataKey="yardage" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white">Best kick / underwater times</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Fastest timed kick or UW set per practice day</p>
        {underwaterKicks.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-slate-500">
            Add kick sets with times and underwater distance to track progress.
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={underwaterKicks} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={48} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => formatSwimTime(v)}
                  reversed
                  width={52}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const row = payload[0].payload as UnderwaterKickPoint
                    return (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm shadow-lg">
                        <p className="font-medium">{row.dateLabel}</p>
                        <p className="text-pool-600 dark:text-pool-400 font-mono">{row.timeLabel}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {row.stroke} · UW {row.underwaterDistance}
                        </p>
                        <p className="text-slate-500 text-xs">{row.sessionName}</p>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#14b8a6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}