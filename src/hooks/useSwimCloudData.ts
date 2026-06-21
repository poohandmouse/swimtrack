import { useEffect, useState } from 'react'
import { getAgeGroup } from '../data/benchmarks'
import {
  fetchSwimCloudBenchmarks,
  fetchSwimCloudSwimmerTimes,
  type SwimCloudBenchmarkSet,
} from '../services/swimcloud'
import type { PoolType, SwimResult, Swimmer } from '../types'

interface SwimCloudState {
  benchmarks: SwimCloudBenchmarkSet | null
  swimmerTimes: SwimResult[]
  loading: boolean
  error: string | null
  usingSwimCloud: boolean
}

const EMPTY: SwimCloudState = {
  benchmarks: null,
  swimmerTimes: [],
  loading: false,
  error: null,
  usingSwimCloud: false,
}

export function useSwimCloudData(
  swimmer: Swimmer | null,
  eventId: string,
  pool: PoolType
): SwimCloudState {
  const [state, setState] = useState<SwimCloudState>(EMPTY)

  useEffect(() => {
    if (!swimmer) {
      setState(EMPTY)
      return
    }

    let cancelled = false
    const ageGroup = getAgeGroup(swimmer.age)

    setState((s) => ({ ...s, loading: true, error: null }))

    ;(async () => {
      try {
        const benchmarks = await fetchSwimCloudBenchmarks(
          eventId,
          pool,
          swimmer.gender,
          ageGroup,
          swimmer.state || undefined
        )

        let swimmerTimes: SwimResult[] = []
        if (swimmer.swimcloudId?.trim()) {
          const scTimes = await fetchSwimCloudSwimmerTimes(
            swimmer.swimcloudId.trim(),
            eventId,
            pool,
            swimmer.gender,
            ageGroup,
            swimmer.state || undefined
          )
          swimmerTimes = scTimes.map((t) => ({ ...t, swimmerId: swimmer.id }))
        }

        if (cancelled) return

        setState({
          benchmarks,
          swimmerTimes,
          loading: false,
          error: benchmarks ? null : 'Could not load SwimCloud benchmarks — showing estimates.',
          usingSwimCloud: benchmarks !== null,
        })
      } catch {
        if (cancelled) return
        setState({
          benchmarks: null,
          swimmerTimes: [],
          loading: false,
          error: 'SwimCloud unavailable — showing estimated benchmarks.',
          usingSwimCloud: false,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [swimmer?.id, swimmer?.swimcloudId, swimmer?.state, swimmer?.gender, swimmer?.age, eventId, pool])

  return state
}

/** Prefer SwimCloud times when linked; otherwise use locally logged results */
export function mergeSwimCloudResults(
  localResults: SwimResult[],
  swimCloudTimes: SwimResult[],
  swimmerId: string,
  eventId: string,
  pool: PoolType
): SwimResult[] {
  const localForEvent = localResults.filter(
    (r) => r.swimmerId === swimmerId && r.event === eventId && r.poolType === pool
  )

  if (swimCloudTimes.length === 0) return localForEvent

  const merged = [...swimCloudTimes]
  const scDates = new Set(swimCloudTimes.map((r) => r.date))

  for (const local of localForEvent) {
    if (!scDates.has(local.date)) merged.push(local)
  }

  let best: number | null = null
  return merged
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => {
      best = best === null ? r.timeSeconds : Math.min(best, r.timeSeconds)
      return { ...r, isPR: r.timeSeconds === best }
    })
}