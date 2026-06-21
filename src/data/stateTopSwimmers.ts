import {
  getBenchmarks,
  getAgeGroup,
  getTop10Average,
  type AgeGroup,
  type BenchmarkComparisonParams,
} from './benchmarks'
import { getNationalTopSwimmer, getStateRival, type NationalTopSwimmer, type StateRival } from './stateRival'
import type { PoolType, SwimResult, Swimmer } from '../types'
import { formatChartDate, formatSwimTime, toDateMs } from '../lib/time'
import type { PublicBenchmarkSet } from '../services/benchmarkProvider'
import type { SwimCloudBenchmarkSet } from '../services/swimcloud'
import { getStateName } from './states'

export type { StateRival, NationalTopSwimmer }
export { getStateRival, getNationalTopSwimmer }

export type { BenchmarkComparisonParams }

export interface BenchmarkComparison {
  params: BenchmarkComparisonParams
  national: NationalTopProfile
  nationalAvg: NationalTopProfile
  state: StateTopProfile | null
  rival: StateRival | null
}

export function resolveBenchmarkParams(
  swimmer: Pick<Swimmer, 'gender' | 'age'>,
  eventId: string,
  pool: PoolType
): BenchmarkComparisonParams {
  return {
    gender: swimmer.gender,
    age: swimmer.age,
    ageGroup: getAgeGroup(swimmer.age),
    eventId,
    pool,
  }
}

function assertBenchmarkAlignment(
  params: BenchmarkComparisonParams,
  national: NationalTopProfile,
  state: StateTopProfile | null,
  rival: StateRival | null
) {
  if (national.eventId !== params.eventId || national.ageGroup !== params.ageGroup) {
    throw new Error('National benchmark does not match comparison event/age group')
  }
  if (rival && (rival.eventId !== params.eventId || rival.ageGroup !== params.ageGroup)) {
    throw new Error('State rival does not match comparison event/age group')
  }
  if (state && (state.eventId !== params.eventId || state.ageGroup !== params.ageGroup)) {
    throw new Error('State benchmark does not match comparison event/age group')
  }
}

export function buildBenchmarkComparison(
  swimmer: Pick<Swimmer, 'gender' | 'age' | 'state'>,
  eventId: string,
  pool: PoolType
): BenchmarkComparison {
  const params = resolveBenchmarkParams(swimmer, eventId, pool)
  const national = getNationalTopProfile(params)
  const nationalAvg = getNationalTop10AvgProfile(params)
  const rival = swimmer.state ? getStateRival(swimmer.state, params) : null
  const state = rival ? getStateTopProfile(rival, params.pool) : null
  assertBenchmarkAlignment(params, national, state, rival)
  return { params, national, nationalAvg, state, rival }
}

export function buildBenchmarkComparisonFromPublic(
  swimmer: Pick<Swimmer, 'gender' | 'age' | 'state'>,
  eventId: string,
  pool: PoolType,
  benchmarks: PublicBenchmarkSet
): BenchmarkComparison {
  const params = resolveBenchmarkParams(swimmer, eventId, pool)
  const national: NationalTopProfile = {
    label: benchmarks.national.name,
    rivalName: benchmarks.national.name,
    club: benchmarks.national.club,
    eventId,
    ageGroup: params.ageGroup,
    currentBest: benchmarks.national.timeSeconds,
    improvementSeconds: 0,
    startTime: benchmarks.national.timeSeconds,
  }
  const nationalAvg: NationalTopProfile = {
    label: 'National Top-Tier Avg',
    rivalName: 'National Top-Tier Avg',
    club: '',
    eventId,
    ageGroup: params.ageGroup,
    currentBest: benchmarks.nationalTop10Avg,
    improvementSeconds: 0,
    startTime: benchmarks.nationalTop10Avg,
  }

  let rival: StateRival | null = null
  let state: StateTopProfile | null = null
  if (benchmarks.state && swimmer.state) {
    const nameParts = benchmarks.state.name.split(' ')
    rival = {
      id: `pub-${swimmer.state}-${eventId}`,
      firstName: nameParts[0] ?? benchmarks.state.name,
      lastName: nameParts.slice(1).join(' ') || benchmarks.state.name,
      fullName: benchmarks.state.name,
      stateCode: swimmer.state,
      stateName: getStateName(swimmer.state),
      gender: swimmer.gender,
      ageGroup: params.ageGroup,
      club: benchmarks.state.club,
      eventId,
    }
    state = {
      label: benchmarks.state.name,
      stateName: getStateName(swimmer.state),
      rivalName: benchmarks.state.name,
      eventId,
      ageGroup: params.ageGroup,
      currentBest: benchmarks.state.timeSeconds,
      improvementSeconds: 0,
      startTime: benchmarks.state.timeSeconds,
    }
  }

  return { params, national, nationalAvg, state, rival }
}

export function buildBenchmarkComparisonFromSwimCloud(
  swimmer: Pick<Swimmer, 'gender' | 'age' | 'state'>,
  eventId: string,
  pool: PoolType,
  swimCloud: SwimCloudBenchmarkSet
): BenchmarkComparison {
  const params = resolveBenchmarkParams(swimmer, eventId, pool)
  const national: NationalTopProfile = {
    label: swimCloud.national.name,
    rivalName: swimCloud.national.name,
    club: swimCloud.national.club,
    eventId,
    ageGroup: params.ageGroup,
    currentBest: swimCloud.national.timeSeconds,
    improvementSeconds: 0,
    startTime: swimCloud.national.timeSeconds,
  }
  const nationalAvg: NationalTopProfile = {
    label: 'National Top-10 Avg',
    rivalName: 'National Top-10 Avg',
    club: '',
    eventId,
    ageGroup: params.ageGroup,
    currentBest: swimCloud.nationalTop10Avg,
    improvementSeconds: 0,
    startTime: swimCloud.nationalTop10Avg,
  }

  let rival: StateRival | null = null
  let state: StateTopProfile | null = null
  if (swimCloud.state && swimmer.state) {
    const nameParts = swimCloud.state.name.split(' ')
    rival = {
      id: `sc-${swimCloud.state.swimmerId}`,
      firstName: nameParts[0] ?? swimCloud.state.name,
      lastName: nameParts.slice(1).join(' ') || swimCloud.state.name,
      fullName: swimCloud.state.name,
      stateCode: swimmer.state,
      stateName: getStateName(swimmer.state),
      gender: swimmer.gender,
      ageGroup: params.ageGroup,
      club: swimCloud.state.club,
      eventId,
    }
    state = {
      label: swimCloud.state.name,
      stateName: getStateName(swimmer.state),
      rivalName: swimCloud.state.name,
      eventId,
      ageGroup: params.ageGroup,
      currentBest: swimCloud.state.timeSeconds,
      improvementSeconds: 0,
      startTime: swimCloud.state.timeSeconds,
    }
  }

  return { params, national, nationalAvg, state, rival }
}

export function formatComparisonScope(params: BenchmarkComparisonParams, eventLabel: string): string {
  const genderLabel = params.gender === 'Male' ? 'Boys' : 'Girls'
  return `${eventLabel} · ${params.pool} · ${genderLabel} ${params.ageGroup}`
}

/** Strong swim states trend slightly faster; smaller states trend slower */
export const STATE_FACTOR: Record<string, number> = {
  CA: 0.96, FL: 0.97, TX: 0.97, AZ: 0.98, CO: 0.98, NC: 0.98, VA: 0.98,
  MD: 0.98, NJ: 0.98, PA: 0.99, OH: 0.99, IL: 0.99, GA: 0.99, MI: 0.99,
  WA: 0.99, OR: 0.99, MN: 1.0, MA: 0.99, IN: 1.0, WI: 1.0, MO: 1.01,
  TN: 1.01, SC: 1.01, LA: 1.01, AL: 1.02, KY: 1.02, OK: 1.02, KS: 1.02,
  AR: 1.03, MS: 1.03, WV: 1.03, NM: 1.03, NE: 1.03, IA: 1.03, UT: 1.02,
  NV: 1.02, ID: 1.03, MT: 1.04, WY: 1.05, AK: 1.05, HI: 1.0, NH: 1.02,
  ME: 1.03, RI: 1.01, CT: 0.99, DE: 1.01, SD: 1.04, ND: 1.04, VT: 1.03,
  DC: 0.98,
}

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i)
  let s = Math.abs(h) || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export interface StateTopProfile {
  label: string
  stateName: string
  rivalName: string
  eventId: string
  ageGroup: AgeGroup
  currentBest: number
  improvementSeconds: number
  startTime: number
}

export interface LeaderProgressPoint {
  date: string
  dateLabel: string
  time: number
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export interface NationalTopProfile {
  label: string
  rivalName: string
  club: string
  eventId: string
  ageGroup: AgeGroup
  currentBest: number
  improvementSeconds: number
  startTime: number
}

export function getNationalTopProfile(params: BenchmarkComparisonParams): NationalTopProfile {
  const { gender, age, ageGroup, eventId, pool } = params
  const leader = getNationalTopSwimmer(gender, age, eventId)
  const national = getBenchmarks(eventId, pool, gender, ageGroup)
  const currentBest = national[0]
  const rng = seededRandom(`${leader.id}-${pool}`)
  const improvementSeconds = +(currentBest * (0.05 + rng() * 0.04)).toFixed(2)

  return {
    label: leader.fullName,
    rivalName: leader.fullName,
    club: leader.club,
    eventId: leader.eventId,
    ageGroup: leader.ageGroup,
    currentBest,
    improvementSeconds,
    startTime: +(currentBest + improvementSeconds).toFixed(2),
  }
}

export function getStateTopProfile(rival: StateRival, pool: PoolType): StateTopProfile {
  const { stateCode, gender, ageGroup, eventId } = rival
  const national = getBenchmarks(eventId, pool, gender, ageGroup)
  const factor = STATE_FACTOR[stateCode] ?? 1.02
  const currentBest = +(national[0] * factor).toFixed(2)
  const trait = seededRandom(`${rival.id}-${eventId}-${pool}`)()
  const improvementSeconds = +(currentBest * (0.04 + trait * 0.05)).toFixed(2)

  return {
    label: rival.fullName,
    stateName: rival.stateName,
    rivalName: rival.fullName,
    eventId: rival.eventId,
    ageGroup: rival.ageGroup,
    currentBest,
    improvementSeconds,
    startTime: +(currentBest + improvementSeconds).toFixed(2),
  }
}

function buildLeaderProgression(
  profile: { currentBest: number; improvementSeconds: number; startTime: number },
  seed: string,
  monthsBack = 14
): LeaderProgressPoint[] {
  const rng = seededRandom(seed)
  const today = new Date()
  const points: LeaderProgressPoint[] = []

  for (let i = monthsBack; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 15)
    const date = isoDate(d)
    const progress = (monthsBack - i) / monthsBack
    const noise = (rng() - 0.5) * 0.8 * (1 - progress)
    const time = +(profile.startTime - profile.improvementSeconds * progress + noise).toFixed(2)
    points.push({ date, dateLabel: formatChartDate(date), time })
  }
  return points
}

function interpolateLeaderAtDate(leaderProg: LeaderProgressPoint[], date: string): number {
  const target = toDateMs(date)
  let before = leaderProg[0]
  let after = leaderProg[leaderProg.length - 1]

  for (let i = 0; i < leaderProg.length; i++) {
    const ms = toDateMs(leaderProg[i].date)
    if (ms <= target) before = leaderProg[i]
    if (ms >= target) {
      after = leaderProg[i]
      break
    }
  }

  const beforeMs = toDateMs(before.date)
  const afterMs = toDateMs(after.date)
  if (beforeMs === afterMs || target <= beforeMs) return before.time
  if (target >= afterMs) return after.time

  const t = (target - beforeMs) / (afterMs - beforeMs)
  return +(before.time + (after.time - before.time) * t).toFixed(2)
}

export function getNationalTop10AvgProfile(params: BenchmarkComparisonParams): NationalTopProfile {
  const { gender, ageGroup, eventId, pool } = params
  const bench = getBenchmarks(eventId, pool, gender, ageGroup)
  const currentBest = getTop10Average(bench)
  const rng = seededRandom(`nat-avg-${gender}-${ageGroup}-${eventId}-${pool}`)
  const improvementSeconds = +(currentBest * (0.04 + rng() * 0.03)).toFixed(2)
  const genderLabel = gender === 'Male' ? 'Boys' : 'Girls'

  return {
    label: `National Top-10 Avg ${genderLabel} ${ageGroup}`,
    rivalName: 'National Top-10 Avg',
    club: '',
    eventId,
    ageGroup,
    currentBest,
    improvementSeconds,
    startTime: +(currentBest + improvementSeconds).toFixed(2),
  }
}

export function getNationalTopProgression(params: BenchmarkComparisonParams, monthsBack = 14) {
  const profile = getNationalTopProfile(params)
  const { gender, ageGroup, eventId, pool } = params
  return buildLeaderProgression(profile, `nat-prog-${gender}-${ageGroup}-${eventId}-${pool}`, monthsBack)
}

export function getNationalTop10AvgProgression(params: BenchmarkComparisonParams, monthsBack = 14) {
  const profile = getNationalTop10AvgProfile(params)
  const { gender, ageGroup, eventId, pool } = params
  return buildLeaderProgression(profile, `nat-avg-prog-${gender}-${ageGroup}-${eventId}-${pool}`, monthsBack)
}

/** Season progression for the state's #1 athlete in this event */
export function getStateRivalProgression(
  rival: StateRival,
  pool: PoolType,
  dateWindow?: { start: string; end: string }
): LeaderProgressPoint[] {
  const profile = getStateTopProfile(rival, pool)
  const full = buildLeaderProgression(profile, `prog-${rival.id}-${rival.eventId}-${pool}`, 14)

  if (!dateWindow) return full

  const startMs = toDateMs(dateWindow.start)
  const endMs = toDateMs(dateWindow.end)
  const filtered = full.filter((p) => {
    const ms = toDateMs(p.date)
    return ms >= startMs && ms <= endMs
  })

  return filtered.length > 0 ? filtered : full.slice(-6)
}

export interface BenchmarkChartPoint {
  date: string
  dateLabel: string
  userMeet: number | null
  userBest: number | null
  isUserMeet: boolean
  isPR: boolean
  nationalRecord: number
  nationalTop10Avg: number
  stateTop: number | null
}

export interface ImprovementChartPoint {
  date: string
  dateLabel: string
  user: number | null
  national: number
  nationalAvg: number
  state: number | null
}

/** Flat benchmark lines using live SwimCloud season bests */
export function buildSwimCloudBenchmarkSeries(
  params: BenchmarkComparisonParams,
  userResults: SwimResult[],
  nationalTime: number,
  nationalAvgTime: number,
  stateTime: number | null
): BenchmarkChartPoint[] {
  const { eventId, pool } = params
  const userForEvent = userResults
    .filter((r) => r.event === eventId && r.poolType === pool)
    .sort((a, b) => a.date.localeCompare(b.date))

  let runningBest: number | null = null

  return userForEvent.map((r) => {
    runningBest = runningBest === null ? r.timeSeconds : Math.min(runningBest, r.timeSeconds)
    return {
      date: r.date,
      dateLabel: formatChartDate(r.date),
      userMeet: r.timeSeconds,
      userBest: runningBest,
      isUserMeet: true,
      isPR: !!r.isPR,
      nationalRecord: nationalTime,
      nationalTop10Avg: nationalAvgTime,
      stateTop: stateTime,
    }
  })
}

export function buildUnifiedBenchmarkSeries(
  params: BenchmarkComparisonParams,
  rival: StateRival | null,
  userResults: SwimResult[],
  options?: { flatBenchmarks?: { national: number; nationalAvg: number; state: number | null } }
): BenchmarkChartPoint[] {
  if (options?.flatBenchmarks) {
    return buildSwimCloudBenchmarkSeries(
      params,
      userResults,
      options.flatBenchmarks.national,
      options.flatBenchmarks.nationalAvg,
      options.flatBenchmarks.state
    )
  }
  const { eventId, pool } = params
  const userForEvent = userResults
    .filter((r) => r.event === eventId && r.poolType === pool)
    .sort((a, b) => a.date.localeCompare(b.date))

  const dateWindow =
    userForEvent.length > 0
      ? { start: userForEvent[0].date, end: userForEvent[userForEvent.length - 1].date }
      : undefined

  const nationalProg = dateWindow
    ? getNationalTopProgression(params).filter((p) => {
        const ms = toDateMs(p.date)
        return ms >= toDateMs(dateWindow.start) && ms <= toDateMs(dateWindow.end)
      })
    : getNationalTopProgression(params)

  const nationalAvgProg = dateWindow
    ? getNationalTop10AvgProgression(params).filter((p) => {
        const ms = toDateMs(p.date)
        return ms >= toDateMs(dateWindow.start) && ms <= toDateMs(dateWindow.end)
      })
    : getNationalTop10AvgProgression(params)

  const stateProg = rival ? getStateRivalProgression(rival, pool, dateWindow) : null

  const dateSet = new Set<string>()
  userForEvent.forEach((r) => dateSet.add(r.date))
  nationalProg.forEach((p) => dateSet.add(p.date))
  nationalAvgProg.forEach((p) => dateSet.add(p.date))
  stateProg?.forEach((p) => dateSet.add(p.date))

  const userByDate = new Map<string, { time: number; isPR: boolean }>()
  userForEvent.forEach((r) => userByDate.set(r.date, { time: r.timeSeconds, isPR: !!r.isPR }))

  const nationalFull = getNationalTopProgression(params)
  const nationalAvgFull = getNationalTop10AvgProgression(params)
  const stateFull = rival ? getStateRivalProgression(rival, pool) : null

  let runningBest: number | null = null

  return [...dateSet].sort().map((date) => {
    const entry = userByDate.get(date)
    const isUserMeet = entry !== undefined
    if (isUserMeet) {
      runningBest = runningBest === null ? entry.time : Math.min(runningBest, entry.time)
    }
    return {
      date,
      dateLabel: formatChartDate(date),
      userMeet: entry?.time ?? null,
      userBest: runningBest,
      isUserMeet,
      isPR: entry?.isPR ?? false,
      nationalRecord: interpolateLeaderAtDate(nationalFull, date),
      nationalTop10Avg: interpolateLeaderAtDate(nationalAvgFull, date),
      stateTop: stateFull ? interpolateLeaderAtDate(stateFull, date) : null,
    }
  })
}

export function buildImprovementSeries(
  chartData: BenchmarkChartPoint[],
  nationalStart: number,
  nationalAvgStart: number,
  stateStart: number | null,
  userStart: number | null
): ImprovementChartPoint[] {
  return chartData.map((row) => ({
    date: row.date,
    dateLabel: row.dateLabel,
    user:
      userStart !== null && row.userBest !== null
        ? +(Math.max(0, userStart - row.userBest).toFixed(2))
        : null,
    national: +(Math.max(0, nationalStart - row.nationalRecord).toFixed(2)),
    nationalAvg: +(Math.max(0, nationalAvgStart - row.nationalTop10Avg).toFixed(2)),
    state:
      stateStart !== null && row.stateTop !== null
        ? +(Math.max(0, stateStart - row.stateTop).toFixed(2))
        : null,
  }))
}

export interface TimeShavedRow {
  name: string
  shaved: number
  startTime: number
  currentTime: number
  color: string
}

export function buildTimeShavedComparison(
  national: NationalTopProfile,
  state: StateTopProfile,
  userResults: SwimResult[],
  eventId: string,
  pool: PoolType
): TimeShavedRow[] {
  const userForEvent = userResults
    .filter((r) => r.event === eventId && r.poolType === pool)
    .sort((a, b) => a.date.localeCompare(b.date))

  let userShaved = 0
  let userStart = 0
  let userCurrent = 0

  if (userForEvent.length > 0) {
    userStart = userForEvent[0].timeSeconds
    userCurrent = Math.min(...userForEvent.map((r) => r.timeSeconds))
    userShaved = Math.max(0, +(userStart - userCurrent).toFixed(2))
  }

  return [
    {
      name: national.rivalName,
      shaved: national.improvementSeconds,
      startTime: national.startTime,
      currentTime: national.currentBest,
      color: '#a78bfa',
    },
    {
      name: state.rivalName,
      shaved: state.improvementSeconds,
      startTime: state.startTime,
      currentTime: state.currentBest,
      color: '#0ea5e9',
    },
    {
      name: 'You',
      shaved: userShaved,
      startTime: userStart,
      currentTime: userCurrent,
      color: '#22c55e',
    },
  ]
}

export function getStateGapSummary(
  profile: StateTopProfile,
  userBest: number | null
): string {
  if (userBest === null) return `Log results for this event to see your gap vs ${profile.rivalName}.`
  const gap = userBest - profile.currentBest
  if (gap <= 0) {
    return `At ${formatSwimTime(userBest)}, you are at or ahead of ${profile.rivalName}'s benchmark (${formatSwimTime(profile.currentBest)}).`
  }
  return `Your best ${formatSwimTime(userBest)} is ${gap.toFixed(2)}s behind ${profile.rivalName} (${formatSwimTime(profile.currentBest)}).`
}