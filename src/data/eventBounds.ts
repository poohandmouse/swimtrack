import { getBenchmarks, getAgeGroup } from './benchmarks'
import { SWIM_EVENTS } from './events'
import type { Gender, PoolType } from '../types'

/** Realistic Y-axis window for age-group event times (seconds) */
export function getEventRealisticBounds(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  age: number
): { floor: number; ceiling: number } {
  const ageGroup = getAgeGroup(age)
  const bench = getBenchmarks(eventId, pool, gender, ageGroup)
  const fastest = bench[0]
  const tenth = bench[9]

  const event = SWIM_EVENTS.find((e) => e.id === eventId)
  const dist = event?.distance ?? 100

  // Competitive 13–17 window: slightly faster than #1 to ~15% slower than 10th
  let floor = fastest * 0.95
  let ceiling = tenth * 1.12

  // Distance-based caps so short events never show 40s+ axes inappropriately
  if (dist <= 50) {
    ceiling = Math.min(ceiling, pool === 'SCY' ? fastest * 1.35 : fastest * 1.4)
  } else if (dist <= 100) {
    ceiling = Math.min(ceiling, fastest * 1.45)
  } else if (dist <= 200) {
    ceiling = Math.min(ceiling, fastest * 1.35)
  }

  return {
    floor: +floor.toFixed(2),
    ceiling: +ceiling.toFixed(2),
  }
}

export function computeChartYDomain(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  age: number,
  times: number[]
): [number, number] {
  const { floor, ceiling } = getEventRealisticBounds(eventId, pool, gender, age)
  const valid = times.filter((t) => t > 0 && isFinite(t))

  if (valid.length === 0) {
    return [ceiling, floor]
  }

  const dataMin = Math.min(...valid)
  const dataMax = Math.max(...valid)
  const span = dataMax - dataMin || dataMax * 0.05
  const pad = Math.max(span * 0.06, 0.5)

  const domainFast = Math.max(floor, dataMin - pad)
  const domainSlow = Math.min(ceiling, dataMax + pad)

  // Ensure visible spread when all lines are close
  if (domainSlow - domainFast < span * 0.5) {
    return [
      Math.min(ceiling, domainSlow + pad),
      Math.max(floor, domainFast - pad),
    ]
  }

  return [domainSlow, domainFast]
}