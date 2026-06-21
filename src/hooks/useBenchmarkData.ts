import { useMemo } from 'react'
import { getAgeGroup } from '../data/benchmarks'
import { getPublicBenchmarks } from '../services/benchmarkProvider'
import type { PoolType, Swimmer } from '../types'

export function useBenchmarkData(
  swimmer: Swimmer | null,
  eventId: string,
  pool: PoolType
) {
  return useMemo(() => {
    if (!swimmer) {
      return {
        benchmarks: null,
        sourceLabel: '',
        usingPublicData: false,
      }
    }

    const ageGroup = getAgeGroup(swimmer.age)
    const benchmarks = getPublicBenchmarks(
      eventId,
      pool,
      swimmer.gender,
      ageGroup,
      swimmer.state || undefined
    )

    return {
      benchmarks,
      sourceLabel: benchmarks.sourceLabel,
      usingPublicData: true,
      isEstimated: benchmarks.source === 'estimated',
      motivationalTimes: benchmarks.motivationalTimes,
    }
  }, [swimmer?.id, swimmer?.state, swimmer?.gender, swimmer?.age, eventId, pool])
}