import { getBenchmarks, getAgeGroup, getPercentileRank } from '../data/benchmarks'
import { getEventLabel } from '../data/events'
import { formatSwimTime } from '../lib/time'
import {
  buildBenchmarkComparison,
  formatComparisonScope,
  getStateGapSummary,
  type BenchmarkComparison,
} from '../data/stateTopSwimmers'
import { getStateName } from '../data/states'
import type { Gender, PoolType, SwimResult, Swimmer } from '../types'

export function generateSynopsis(
  swimmer: Swimmer,
  results: SwimResult[],
  selected?: SwimResult,
  comparison?: BenchmarkComparison,
  usingPublicBenchmarks?: boolean
): string[] {
  const paragraphs: string[] = []
  const prs = results.filter((r) => r.isPR)

  if (results.length === 0) {
    return ['Add meet results to unlock personalized progress analysis.']
  }

  paragraphs.push(
    `${swimmer.name} (${swimmer.age}, ${swimmer.club}) has logged ${results.length} result${results.length > 1 ? 's' : ''} across ${new Set(results.map((r) => r.event)).size} events.`
  )

  if (prs.length > 0) {
    const recent = [...prs].sort((a, b) => b.date.localeCompare(a.date))[0]
    paragraphs.push(
      `Recent momentum: a personal best in ${getEventLabel(recent.event)} (${formatSwimTime(recent.timeSeconds)}) at ${recent.meet} on ${recent.date}. ${prs.length} total PR${prs.length > 1 ? 's' : ''} recorded.`
    )
  }

  const byEvent = new Map<string, SwimResult[]>()
  results.forEach((r) => {
    const list = byEvent.get(r.event) ?? []
    list.push(r)
    byEvent.set(r.event, list)
  })

  const improvements: string[] = []
  byEvent.forEach((list, event) => {
    if (list.length < 2) return
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
    const first = sorted[0].timeSeconds
    const last = sorted[sorted.length - 1].timeSeconds
    const delta = first - last
    if (delta > 0.5) {
      improvements.push(`${getEventLabel(event)} (−${delta.toFixed(1)}s)`)
    }
  })

  if (improvements.length) {
    paragraphs.push(`Strongest improvement trends: ${improvements.slice(0, 3).join(', ')}.`)
  }

  const strokeTimes = new Map<string, number[]>()
  results.forEach((r) => {
    const stroke = r.event.split('-')[1] ?? 'free'
    const list = strokeTimes.get(stroke) ?? []
    list.push(r.timeSeconds / (parseInt(r.event) || 100))
    strokeTimes.set(stroke, list)
  })

  if (selected) {
    const group = getAgeGroup(swimmer.age)
    const refTimes = getBenchmarks(
      selected.event,
      selected.poolType as PoolType,
      swimmer.gender as Gender,
      group
    )
    const rank = getPercentileRank(selected.timeSeconds, refTimes)
    const rankSource = usingPublicBenchmarks
      ? 'USA Swimming motivational standards'
      : 'our reference set'
    paragraphs.push(
      `Selected swim (${getEventLabel(selected.event)}, ${selected.poolType}): approximately top-${rank} nationally among ${group} ${swimmer.gender.toLowerCase()} age-group swimmers per ${rankSource}.`
    )

    const comparisonData =
      comparison ??
      buildBenchmarkComparison(swimmer, selected.event, selected.poolType as PoolType)
    const scope = formatComparisonScope(comparisonData.params, getEventLabel(selected.event))
    paragraphs.push(
      `Benchmark scope (USA Swimming AAAA): ${scope} — national motivational cut at ${formatSwimTime(comparisonData.national.currentBest)} (~98th percentile).`
    )

    if (comparisonData.state && swimmer.state) {
      paragraphs.push(getStateGapSummary(comparisonData.state, selected.timeSeconds))
      paragraphs.push(
        `State-adjusted AAAA for ${getStateName(swimmer.state)}: ${formatSwimTime(comparisonData.state.currentBest)} — a regional target based on published standards and state swim strength.`
      )
    }
  }

  const freestyles = results.filter((r) => r.event.includes('free') && !r.event.includes('x'))
  const flys = results.filter((r) => r.event.includes('fly'))
  if (freestyles.length && flys.length) {
    const avgFree = freestyles.reduce((s, r) => s + r.timeSeconds, 0) / freestyles.length
    const avgFly = flys.reduce((s, r) => s + r.timeSeconds, 0) / flys.length
    if (avgFree < avgFly * 0.85) {
      paragraphs.push(
        'Strength profile: freestyle events show relatively stronger performances — consider maintaining aerobic base while building butterfly-specific power.'
      )
    } else {
      paragraphs.push(
        'Balanced stroke portfolio — continue event-specific technique work to convert training fitness into race-day speed.'
      )
    }
  }

  paragraphs.push(
    'Coaching focus: prioritize consistent race pace in practice, video review 2× per month, and goal-aligned test sets 3 weeks before target meets.'
  )

  return paragraphs
}