import { getMotivationalTimes, motivationalToTop10 } from './usasMotivationalTimes'
import type { Gender, PoolType } from '../types'

export type AgeGroup = '13-14' | '15-16' | '17-18'

/** Shared scope for state vs national comparisons — same event, pool, gender, and age group */
export interface BenchmarkComparisonParams {
  gender: Gender
  age: number
  ageGroup: AgeGroup
  eventId: string
  pool: PoolType
}

function top10(base: number, spread = 0.02): number[] {
  return Array.from({ length: 10 }, (_, i) => +(base * (1 + i * spread)).toFixed(2))
}

/** Approximate top-10 national age-group times (seconds) */
const BENCHMARKS: Partial<
  Record<string, Partial<Record<PoolType, Partial<Record<Gender, Partial<Record<AgeGroup, number[]>>>>>>>
> = {
  '50-free': {
    SCY: {
      Male: { '13-14': top10(22.5), '15-16': top10(21.8), '17-18': top10(21.0) },
      Female: { '13-14': top10(25.0), '15-16': top10(24.0), '17-18': top10(23.0) },
    },
    LCM: {
      Male: { '13-14': top10(26.0), '15-16': top10(25.0), '17-18': top10(24.0) },
      Female: { '13-14': top10(28.5), '15-16': top10(27.5), '17-18': top10(26.5) },
    },
  },
  '100-free': {
    SCY: {
      Male: { '13-14': top10(52.0, 0.025), '15-16': top10(50.0, 0.025), '17-18': top10(47.5, 0.025) },
      Female: { '13-14': top10(56.0, 0.025), '15-16': top10(53.5, 0.025), '17-18': top10(51.5, 0.025) },
    },
    LCM: {
      Male: { '13-14': top10(58.0, 0.025), '15-16': top10(55.5, 0.025), '17-18': top10(52.5, 0.025) },
      Female: { '13-14': top10(63.0, 0.025), '15-16': top10(59.5, 0.025), '17-18': top10(56.5, 0.025) },
    },
  },
  '200-free': {
    SCY: {
      Male: { '13-14': top10(115, 0.02), '15-16': top10(108, 0.02), '17-18': top10(102, 0.02) },
      Female: { '13-14': top10(122, 0.02), '15-16': top10(115, 0.02), '17-18': top10(108, 0.02) },
    },
    LCM: {
      Male: { '13-14': top10(130, 0.02), '15-16': top10(122, 0.02), '17-18': top10(115, 0.02) },
      Female: { '13-14': top10(138, 0.02), '15-16': top10(130, 0.02), '17-18': top10(122, 0.02) },
    },
  },
}

function generateFallback(eventId: string, pool: PoolType, gender: Gender, group: AgeGroup): number[] {
  const dist = parseInt(eventId.match(/\d+/)?.[0] ?? '100', 10)
  let base = dist * 0.6
  if (gender === 'Female') base *= 1.08
  if (group === '13-14') base *= 1.12
  else if (group === '15-16') base *= 1.05
  if (pool === 'LCM') base *= 1.1
  return top10(base, 0.025)
}

export function getBenchmarks(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  group: AgeGroup
): number[] {
  const motivational = getMotivationalTimes(eventId, pool, gender, group)
  if (motivational.AAAA > 0) return motivationalToTop10(motivational)

  const data = BENCHMARKS[eventId]?.[pool]?.[gender]?.[group]
  return data ?? generateFallback(eventId, pool, gender, group)
}

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 14) return '13-14'
  if (age <= 16) return '15-16'
  return '17-18'
}

export function getTop10Average(benchmarks: number[]): number {
  const sum = benchmarks.reduce((a, b) => a + b, 0)
  return +(sum / benchmarks.length).toFixed(2)
}

export function getPercentileRank(time: number, benchmarks: number[]): number {
  const sorted = [...benchmarks].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    if (time <= sorted[i]) return i + 1
  }
  return 10
}