import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { computeChartYDomain } from '../../data/eventBounds'
import { formatSwimTime } from '../../lib/time'
import type { BenchmarkChartPoint } from '../../data/stateTopSwimmers'
import type { Gender, PoolType } from '../../types'

export function EventBenchmarkChart({
  data,
  eventId,
  pool,
  gender,
  age,
  comparisonScope,
  nationalLeaderName,
  nationalAvgLabel = 'National Top-10 Avg',
  rivalName,
  hasState,
}: {
  data: BenchmarkChartPoint[]
  eventId: string
  pool: PoolType
  gender: Gender
  age: number
  comparisonScope: string
  nationalLeaderName: string
  nationalAvgLabel?: string
  rivalName?: string
  hasState: boolean
}) {
  const hasUserMeets = data.some((d) => d.isUserMeet)

  const yDomain = useMemo(() => {
    const times: number[] = []
    data.forEach((d) => {
      if (d.userMeet != null) times.push(d.userMeet)
      if (d.userBest != null) times.push(d.userBest)
      times.push(d.nationalRecord, d.nationalTop10Avg)
      if (d.stateTop != null) times.push(d.stateTop)
    })
    return computeChartYDomain(eventId, pool, gender, age, times)
  }, [data, eventId, pool, gender, age])

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Progress & Benchmarking</h3>
        <p className="text-sm text-slate-500 mt-1">
          {comparisonScope} — swim time by meet date (lower is faster)
        </p>
        <p className="text-sm text-violet-600 dark:text-violet-400 mt-2 font-medium">
          {nationalLeaderName}
        </p>
        {hasState && rivalName && (
          <p className="text-sm text-sky-600 dark:text-sky-400 font-medium">
            {rivalName}
          </p>
        )}
      </div>

      {!hasUserMeets ? (
        <div className="h-[420px] flex items-center justify-center text-slate-500 text-sm text-center px-6">
          Log meet results for this event to see your times plotted against national and state benchmarks.
        </div>
      ) : (
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 20, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                height={56}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatSwimTime(v)}
                domain={yDomain}
                reversed
                width={56}
                label={{ value: 'Time', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const row = payload[0].payload as BenchmarkChartPoint
                  return (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm shadow-xl min-w-[200px]">
                      <p className="font-semibold text-slate-900 dark:text-white mb-2">{row.dateLabel}</p>
                      {row.isUserMeet && (
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          You: {formatSwimTime(row.userMeet!)}
                          {row.isPR && <span className="ml-2 text-xs bg-green-500/20 px-1.5 py-0.5 rounded">PR</span>}
                        </p>
                      )}
                      {row.userBest !== null && (
                        <p className="text-teal-600 dark:text-teal-400 text-xs mt-0.5">
                          PR trend: {formatSwimTime(row.userBest)}
                        </p>
                      )}
                      <p className="text-violet-500 mt-1.5">
                        {nationalLeaderName}: {formatSwimTime(row.nationalRecord)}
                      </p>
                      <p className="text-violet-400/80 text-xs">{nationalAvgLabel}: {formatSwimTime(row.nationalTop10Avg)}</p>
                      {row.stateTop !== null && rivalName && (
                        <p className="text-sky-500 mt-1">{rivalName}: {formatSwimTime(row.stateTop)}</p>
                      )}
                    </div>
                  )
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="line" />

              <Line
                type="monotone"
                dataKey="nationalRecord"
                name={nationalLeaderName}
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                connectNulls
                strokeDasharray="6 3"
              />
              <Line
                type="monotone"
                dataKey="nationalTop10Avg"
                name={nationalAvgLabel}
                stroke="#c4b5fd"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              {hasState && rivalName && (
                <Line
                  type="monotone"
                  dataKey="stateTop"
                  name={rivalName}
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
              )}
              <Line
                type="monotone"
                dataKey="userMeet"
                name="Your times"
                stroke="#22c55e"
                strokeWidth={3.5}
                connectNulls
                dot={(props) => {
                  const { cx, cy, payload } = props
                  if (!payload.isUserMeet || cx == null || cy == null) return <g key={payload.date} />
                  const r = payload.isPR ? 8 : 5
                  return (
                    <circle
                      key={payload.date}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="#22c55e"
                      stroke={payload.isPR ? '#fbbf24' : '#fff'}
                      strokeWidth={payload.isPR ? 2.5 : 1.5}
                    />
                  )
                }}
                activeDot={{ r: 9, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="userBest"
                name="Your PR trend"
                stroke="#14b8a6"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-amber-400" /> PR meet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Meet result
        </span>
        <span>Y-axis scaled to realistic times for this event</span>
      </div>
    </div>
  )
}