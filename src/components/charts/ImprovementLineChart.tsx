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
import type { ImprovementChartPoint } from '../../data/stateTopSwimmers'

export function ImprovementLineChart({
  data,
  comparisonScope,
  nationalLeaderName,
  rivalName,
  hasState,
}: {
  data: ImprovementChartPoint[]
  comparisonScope: string
  nationalLeaderName: string
  rivalName?: string
  hasState: boolean
}) {
  const hasUser = data.some((d) => d.user !== null && d.user > 0)

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Time shaved — season progress</h3>
        <p className="text-sm text-slate-500 mt-1">
          {comparisonScope} — seconds dropped from season start vs {nationalLeaderName}
          {hasState && rivalName ? ` and ${rivalName}` : ''}
        </p>
      </div>

      <div className="h-72 w-full">
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
              unit="s"
              label={{ value: 'Seconds dropped', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(v, name) => [`${Number(v).toFixed(2)}s`, String(name)]}
              contentStyle={{ borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

            <Line
              type="monotone"
              dataKey="national"
              name={nationalLeaderName}
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              connectNulls
              strokeDasharray="6 3"
            />
            <Line
              type="monotone"
              dataKey="nationalAvg"
              name="AAA–AA avg"
              stroke="#c4b5fd"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            {hasState && rivalName && (
              <Line
                type="monotone"
                dataKey="state"
                name={rivalName}
                stroke="#0ea5e9"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
            )}
            <Line
              type="monotone"
              dataKey="user"
              name="You"
              stroke="#22c55e"
              strokeWidth={3}
              connectNulls
              dot={{ r: 4, fill: '#22c55e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!hasUser && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
          Add multiple meet results to see your improvement curve vs {rivalName ?? 'benchmarks'}.
        </p>
      )}
    </div>
  )
}