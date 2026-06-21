import type { AgeGroup } from '../data/benchmarks'
import { STATE_FACTOR } from '../data/stateTopSwimmers'
import {
  MOTIVATIONAL_SOURCE_LABEL,
  getMotivationalTimes,
  getTopTierAverage,
  hasCuratedMotivationalData,
  type MotivationalTimes,
} from '../data/usasMotivationalTimes'
import { getNationalTopSwimmer, getStateRival } from '../data/stateRival'
import { getStateName } from '../data/states'
import type { Gender, PoolType } from '../types'

export type BenchmarkDataSource = 'usas-motivational' | 'estimated'

export interface PublicBenchmarkLeader {
  name: string
  club: string
  timeSeconds: number
  tier: string
}

export interface PublicBenchmarkSet {
  national: PublicBenchmarkLeader
  nationalTop10Avg: number
  state: PublicBenchmarkLeader | null
  motivationalTimes: MotivationalTimes
  source: BenchmarkDataSource
  sourceLabel: string
}

export function getPublicBenchmarks(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  ageGroup: AgeGroup,
  stateCode?: string
): PublicBenchmarkSet {
  const times = getMotivationalTimes(eventId, pool, gender, ageGroup)
  const nationalSwimmer = getNationalTopSwimmer(gender, ageGroup === '13-14' ? 14 : ageGroup === '15-16' ? 16 : 17, eventId)

  const national: PublicBenchmarkLeader = {
    name: nationalSwimmer.fullName,
    club: nationalSwimmer.club,
    timeSeconds: times.AAAA,
    tier: 'AAAA',
  }

  let state: PublicBenchmarkLeader | null = null
  if (stateCode) {
    const rival = getStateRival(stateCode, {
      gender,
      age: ageGroup === '13-14' ? 14 : ageGroup === '15-16' ? 16 : 17,
      ageGroup,
      eventId,
      pool,
    })
    const factor = STATE_FACTOR[stateCode] ?? 1.02
    state = {
      name: rival.fullName,
      club: rival.club || `${getStateName(stateCode).split(' ')[0]} Aquatics`,
      timeSeconds: +(times.AAAA * factor).toFixed(2),
      tier: 'AAAA (state adj.)',
    }
  }

  const hasCurated = hasCuratedMotivationalData(eventId, pool, gender, ageGroup)

  return {
    national,
    nationalTop10Avg: getTopTierAverage(times),
    state,
    motivationalTimes: times,
    source: hasCurated ? 'usas-motivational' : 'estimated',
    sourceLabel: hasCurated
      ? MOTIVATIONAL_SOURCE_LABEL
      : `${MOTIVATIONAL_SOURCE_LABEL} (estimated — event not in published tables)`,
  }
}