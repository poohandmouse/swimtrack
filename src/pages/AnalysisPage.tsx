import { useMemo, useState } from 'react'
import { getEventLabel, getEventStroke, SWIM_EVENTS } from '../data/events'
import { formatSwimTime } from '../lib/time'
import type { useAppState } from '../hooks/useAppState'
import { generateSynopsis } from '../utils/synopsis'
import { getTechniqueQuestions, generateTechniqueTips } from '../utils/technique'
import {
  buildBenchmarkComparison,
  buildBenchmarkComparisonFromPublic,
  buildImprovementSeries,
  buildUnifiedBenchmarkSeries,
  formatComparisonScope,
} from '../data/stateTopSwimmers'
import { useBenchmarkData } from '../hooks/useBenchmarkData'
import {
  getMotivationalTier,
  getMotivationalTierTime,
  getNextMotivationalTier,
} from '../data/usasMotivationalTimes'
import { getStateName } from '../data/states'
import { EventBenchmarkChart } from '../components/charts/EventBenchmarkChart'
import { ImprovementLineChart } from '../components/charts/ImprovementLineChart'
import type { PoolType } from '../types'

export function AnalysisPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const swimmer = app.activeSwimmer
  const results = swimmer ? app.swimmerResults(swimmer.id) : []
  const [compareEvent, setCompareEvent] = useState(results[0]?.event ?? '100-free')
  const [comparePool, setComparePool] = useState<PoolType>(results[0]?.poolType ?? 'SCY')
  const [selectedId, setSelectedId] = useState(results[0]?.id ?? '')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showTips, setShowTips] = useState(false)

  const benchmarkData = useBenchmarkData(swimmer, compareEvent, comparePool)

  const chartBundle = useMemo(() => {
    if (!swimmer || !benchmarkData.benchmarks) return null

    const comparisonResults = results.filter(
      (r) => r.event === compareEvent && r.poolType === comparePool
    )

    const comparison = buildBenchmarkComparisonFromPublic(
      swimmer,
      compareEvent,
      comparePool,
      benchmarkData.benchmarks
    )

    const flatBenchmarks = {
      national: benchmarkData.benchmarks.national.timeSeconds,
      nationalAvg: benchmarkData.benchmarks.nationalTop10Avg,
      state: benchmarkData.benchmarks.state?.timeSeconds ?? null,
    }

    const benchmarkChartData = buildUnifiedBenchmarkSeries(
      comparison.params,
      comparison.rival,
      comparisonResults,
      { flatBenchmarks }
    )

    const userForEvent = comparisonResults.sort((a, b) => a.date.localeCompare(b.date))
    const userStart = userForEvent[0]?.timeSeconds ?? null

    const improvementData = buildImprovementSeries(
      benchmarkChartData,
      comparison.national.startTime,
      comparison.nationalAvg.startTime,
      comparison.state?.startTime ?? null,
      userStart
    )

    const scopeLabel = formatComparisonScope(comparison.params, getEventLabel(compareEvent))

    return {
      benchmarkData: benchmarkChartData,
      improvementData,
      comparison,
      scopeLabel,
      comparisonResults,
      sourceLabel: benchmarkData.sourceLabel,
      usingPublicData: benchmarkData.usingPublicData,
    }
  }, [swimmer, compareEvent, comparePool, results, benchmarkData])

  const comparisonResults = chartBundle?.comparisonResults ?? results.filter(
    (r) => r.event === compareEvent && r.poolType === comparePool
  )
  const selected =
    comparisonResults.find((r) => r.id === selectedId) ??
    comparisonResults.find((r) => r.event === compareEvent && r.poolType === comparePool)
  const stroke = selected ? getEventStroke(selected.event) : 'freestyle'
  const questions = getTechniqueQuestions(stroke)

  const synopsis = swimmer
    ? generateSynopsis(
        swimmer,
        results,
        selected,
        chartBundle?.comparison ?? buildBenchmarkComparison(swimmer, compareEvent, comparePool),
        chartBundle?.usingPublicData ?? true
      )
    : []
  const tips = showTips ? generateTechniqueTips(stroke, answers) : []

  const tierInfo = useMemo(() => {
    if (!selected || !benchmarkData.motivationalTimes) return null
    const times = benchmarkData.motivationalTimes
    const tier = getMotivationalTier(selected.timeSeconds, times)
    const nextTier = getNextMotivationalTier(tier)
    const nextTime = nextTier ? getMotivationalTierTime(times, nextTier) : null
    const gap =
      nextTime != null ? +(selected.timeSeconds - nextTime).toFixed(2) : null
    return { tier, nextTier, nextTime, gap }
  }, [selected, benchmarkData.motivationalTimes])

  if (!swimmer) return null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Comparison & Analysis</h2>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm flex-1 min-w-[200px]">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Event</span>
          <select
            className="input-field mt-1"
            value={compareEvent}
            onChange={(e) => setCompareEvent(e.target.value)}
          >
            {SWIM_EVENTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm w-36">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Pool</span>
          <select
            className="input-field mt-1"
            value={comparePool}
            onChange={(e) => setComparePool(e.target.value as PoolType)}
          >
            <option value="SCY">SCY</option>
            <option value="LCM">LCM</option>
          </select>
        </label>
      </div>

      {!swimmer.state && (
        <div className="card p-4 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Add your <strong>State</strong> on Profiles to compare against a state-adjusted AAAA benchmark.
          </p>
        </div>
      )}

      {benchmarkData.isEstimated && (
        <div className="card p-4 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            No published standard for this event/course — benchmarks are estimated from distance and stroke.
            Pick a common event (e.g. 50–500 free, 100 strokes, 200 IM) for official USA Swimming times.
          </p>
        </div>
      )}

      {chartBundle && (
        <div className="card p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Comparing within: {chartBundle.scopeLabel}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-violet-600 dark:text-violet-400">AAAA</span>
            {' '}— {formatSwimTime(chartBundle.comparison.national.currentBest)} national motivational cut (~98th percentile)
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-violet-500 dark:text-violet-400">AAA–AA avg</span>
            {' '}— {formatSwimTime(chartBundle.comparison.nationalAvg.currentBest)} top-tier reference
          </p>
          {chartBundle.comparison.state && swimmer.state && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-sky-700 dark:text-sky-300">State-adjusted AAAA</span>
              {' '}— {formatSwimTime(chartBundle.comparison.state.currentBest)} for {getStateName(swimmer.state)}
            </p>
          )}
          <p className="text-xs text-slate-500">
            Source: {chartBundle.sourceLabel}. Log meet results below to plot your progress against these standards.
          </p>
        </div>
      )}

      {chartBundle && (
        <>
          <EventBenchmarkChart
            data={chartBundle.benchmarkData}
            eventId={compareEvent}
            pool={comparePool}
            gender={swimmer.gender}
            age={swimmer.age}
            comparisonScope={chartBundle.scopeLabel}
            nationalLeaderName="AAAA standard"
            nationalAvgLabel="AAA–AA avg"
            rivalName={swimmer.state ? 'State AAAA (adj.)' : undefined}
            hasState={!!swimmer.state}
          />
          <ImprovementLineChart
            data={chartBundle.improvementData}
            comparisonScope={chartBundle.scopeLabel}
            nationalLeaderName="AAAA standard"
            rivalName={swimmer.state ? 'State AAAA (adj.)' : undefined}
            hasState={!!swimmer.state}
          />
        </>
      )}

      {chartBundle && (
        <p className="text-xs text-slate-500 text-center">
          {chartBundle.scopeLabel}: AAAA {formatSwimTime(chartBundle.comparison.national.currentBest)}
          {chartBundle.comparison.state
            ? ` · State adj. ${formatSwimTime(chartBundle.comparison.state.currentBest)} (${getStateName(swimmer.state!)})`
            : ''}
        </p>
      )}

      {chartBundle && comparisonResults.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          Log meet results for this event to see your times plotted against national and state benchmarks.
        </div>
      ) : (
        <>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Select result for synopsis & technique</span>
            <select
              className="input-field mt-1"
              value={selected?.id ?? selectedId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedId(id)
                const result = results.find((r) => r.id === id)
                if (result) {
                  setCompareEvent(result.event)
                  setComparePool(result.poolType)
                }
                setShowTips(false)
                setAnswers({})
              }}
            >
              {results
                .filter((r) => r.event === compareEvent && r.poolType === comparePool)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatSwimTime(r.timeSeconds)} — {getEventLabel(r.event)} ({r.date})
                  </option>
                ))}
            </select>
          </label>

          {selected && (
            <>
              {tierInfo && (
                <div className="card p-5 flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Motivational tier</p>
                    <p className="text-2xl font-bold text-pool-600 dark:text-pool-400 mt-1">
                      {tierInfo.tier === 'below-B' ? 'Below B' : tierInfo.tier}
                    </p>
                  </div>
                  {tierInfo.nextTier && tierInfo.gap != null && tierInfo.gap > 0 && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-900 dark:text-white">{tierInfo.gap.toFixed(2)}s</span>
                      {' '}to {tierInfo.nextTier} ({formatSwimTime(tierInfo.nextTime!)})
                    </div>
                  )}
                  {tierInfo.tier === 'AAAA' ? (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      At or above the national AAAA motivational cut.
                    </p>
                  ) : null}
                </div>
              )}

              <div className="card p-5">
                <h3 className="font-semibold mb-3">Progress synopsis</h3>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {synopsis.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-1">Technique feedback</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {getEventLabel(selected.event)} — answer a few form questions for personalized tips
                </p>
                <div className="space-y-4">
                  {questions.map((q) => (
                    <label key={q.id} className="block text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{q.question}</span>
                      <select
                        className="input-field mt-1"
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        {q.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-primary mt-4"
                  disabled={questions.some((q) => !answers[q.id])}
                  onClick={() => setShowTips(true)}
                >
                  Get technique tips
                </button>
                {tips.length > 0 && (
                  <ul className="mt-6 space-y-4">
                    {tips.map((t, i) => (
                      <li
                        key={i}
                        className="p-4 rounded-lg bg-pool-50 dark:bg-slate-800/50 border border-pool-200 dark:border-slate-700"
                      >
                        <p className="font-medium text-slate-900 dark:text-white">{t.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.body}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.links.map((l) => (
                            <a
                              key={l.url}
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-pool-600 dark:text-pool-400 hover:underline"
                            >
                              {l.label}
                            </a>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}