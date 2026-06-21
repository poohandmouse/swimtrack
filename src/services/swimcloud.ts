import type { AgeGroup } from '../data/benchmarks'
import {
  getCurrentSeasonId,
  getSwimCloudAgeGroup,
  getSwimCloudEventCourse,
  getSwimCloudEventId,
  getSwimCloudGender,
} from '../data/swimcloudEvents'
import { parseSwimTime } from '../lib/time'
import type { Gender, PoolType, SwimResult } from '../types'

const API_BASE = import.meta.env.DEV
  ? '/swimcloud-api'
  : 'https://www.swimcloud.com/api'

export interface SwimCloudSplash {
  id: number
  eventtime: string
  dateofswim: string
  swimmer_id: number
  swimmer_splash_age: number | null
  is_relayleadoff: boolean | string
  relayname: string
  display_name: string
  swimmer: {
    id: number
    display_name: string
    state: string
    age: number | null
  }
  team: {
    name: string
    abbr: string
  }
  meet: {
    display_name: string
    name: string
  }
}

interface TopTimesResponse {
  results: SwimCloudSplash[]
  page_count: number
}

export interface SwimCloudLeader {
  swimmerId: number
  name: string
  club: string
  timeSeconds: number
  date: string
}

export interface SwimCloudBenchmarkSet {
  national: SwimCloudLeader
  nationalTop10Avg: number
  state: SwimCloudLeader | null
  source: 'swimcloud'
}

async function fetchTopTimesPage(params: URLSearchParams): Promise<TopTimesResponse> {
  const url = `${API_BASE}/splashes/top_times/?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`SwimCloud request failed (${res.status})`)
  const data = (await res.json()) as TopTimesResponse
  return { results: data.results ?? [], page_count: data.page_count ?? 1 }
}

function isIndividualSplash(s: SwimCloudSplash): boolean {
  if (s.is_relayleadoff === true || s.is_relayleadoff === 'true') return false
  if (s.relayname && s.is_relayleadoff) return false
  return true
}

function splashAge(s: SwimCloudSplash): number | null {
  return s.swimmer_splash_age ?? s.swimmer?.age ?? null
}

function matchesAgeGroup(s: SwimCloudSplash, ageGroup: AgeGroup): boolean {
  const age = splashAge(s)
  if (age === null) return true
  if (ageGroup === '13-14') return age >= 13 && age <= 14
  if (ageGroup === '15-16') return age >= 15 && age <= 16
  return age >= 17 && age <= 18
}

function toSeconds(time: string): number | null {
  return parseSwimTime(time)
}

function splashToLeader(s: SwimCloudSplash): SwimCloudLeader | null {
  const timeSeconds = toSeconds(s.eventtime)
  if (timeSeconds === null) return null
  return {
    swimmerId: s.swimmer_id,
    name: s.display_name || s.swimmer.display_name,
    club: s.team?.name || s.team?.abbr || '',
    timeSeconds,
    date: s.dateofswim,
  }
}

async function fetchFilteredTopTimes(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  region: string,
  ageGroup: AgeGroup,
  maxPages = 3
): Promise<SwimCloudSplash[]> {
  const scEvent = getSwimCloudEventId(eventId)
  if (!scEvent) return []

  const seasonId = getCurrentSeasonId()
  const collected: SwimCloudSplash[] = []

  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({
      event: String(scEvent),
      eventcourse: getSwimCloudEventCourse(pool),
      gender: getSwimCloudGender(gender),
      region,
      season_id: String(seasonId),
      age_group: getSwimCloudAgeGroup(ageGroup),
      page: String(page),
    })

    const { results, page_count } = await fetchTopTimesPage(params)
    const filtered = results.filter(
      (s) => isIndividualSplash(s) && matchesAgeGroup(s, ageGroup)
    )
    collected.push(...filtered)
    if (page >= page_count) break
  }

  return collected.sort(
    (a, b) => (toSeconds(a.eventtime) ?? Infinity) - (toSeconds(b.eventtime) ?? Infinity)
  )
}

export async function fetchSwimCloudBenchmarks(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  ageGroup: AgeGroup,
  stateCode?: string
): Promise<SwimCloudBenchmarkSet | null> {
  try {
    const [nationalSplashes, stateSplashes] = await Promise.all([
      fetchFilteredTopTimes(eventId, pool, gender, 'country_USA', ageGroup, 2),
      stateCode
        ? fetchFilteredTopTimes(eventId, pool, gender, `state_${stateCode}`, ageGroup, 2)
        : Promise.resolve([]),
    ])

    const nationalLeader = nationalSplashes[0] ? splashToLeader(nationalSplashes[0]) : null
    if (!nationalLeader) return null

    const top10 = nationalSplashes.slice(0, 10)
    const top10Times = top10
      .map((s) => toSeconds(s.eventtime))
      .filter((t): t is number => t !== null)
    const nationalTop10Avg =
      top10Times.length > 0
        ? +(top10Times.reduce((a, b) => a + b, 0) / top10Times.length).toFixed(2)
        : nationalLeader.timeSeconds

    const stateLeader = stateSplashes[0] ? splashToLeader(stateSplashes[0]) : null

    return {
      national: nationalLeader,
      nationalTop10Avg,
      state: stateLeader,
      source: 'swimcloud',
    }
  } catch {
    return null
  }
}

async function collectSwimmerSplashes(
  swimmerId: number,
  eventId: string,
  pool: PoolType,
  gender: Gender,
  ageGroup: AgeGroup,
  stateCode?: string
): Promise<SwimCloudSplash[]> {
  const regions = stateCode
    ? [`state_${stateCode}`, 'country_USA']
    : ['country_USA']

  const found: SwimCloudSplash[] = []

  for (const region of regions) {
    const splashes = await fetchFilteredTopTimes(
      eventId,
      pool,
      gender,
      region,
      ageGroup,
      region.startsWith('state_') ? 8 : 5
    )
    const matches = splashes.filter((s) => s.swimmer_id === swimmerId)
    found.push(...matches)
    if (matches.length > 0 && region.startsWith('state_')) break
  }

  const byId = new Map<number, SwimCloudSplash>()
  for (const s of found) byId.set(s.id, s)
  return [...byId.values()]
}

/** Collect a swimmer's season times for an event from SwimCloud top-times listings */
export async function fetchSwimCloudSwimmerTimes(
  swimcloudId: string,
  eventId: string,
  pool: PoolType,
  gender: Gender,
  ageGroup: AgeGroup,
  stateCode?: string
): Promise<SwimResult[]> {
  const id = parseInt(swimcloudId, 10)
  if (!Number.isFinite(id)) return []

  try {
    if (!getSwimCloudEventId(eventId)) return []

    const swimmerSplashes = await collectSwimmerSplashes(
      id,
      eventId,
      pool,
      gender,
      ageGroup,
      stateCode
    )

    const swimResults: SwimResult[] = []
    for (const s of swimmerSplashes) {
      const timeSeconds = toSeconds(s.eventtime)
      if (timeSeconds === null) continue
      swimResults.push({
        id: `sc-${s.id}`,
        swimmerId: '',
        date: s.dateofswim,
        event: eventId,
        timeSeconds,
        meet: s.meet?.display_name || s.meet?.name || 'SwimCloud',
        poolType: pool,
        isPR: false,
      })
    }
    return swimResults.sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}