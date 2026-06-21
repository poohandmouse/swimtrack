import type { AgeGroup } from './benchmarks'
import type { PoolType } from '../types'

/** SwimCloud numeric event IDs (same ID, pool set via eventcourse=Y|L) */
const EVENT_IDS: Record<string, number> = {
  '50-free': 150,
  '100-free': 1100,
  '200-free': 1200,
  '500-free': 1500,
  '1000-free': 11000,
  '1650-free': 11650,
  '50-back': 250,
  '100-back': 2100,
  '200-back': 2200,
  '50-breast': 350,
  '100-breast': 3100,
  '200-breast': 3200,
  '50-fly': 450,
  '100-fly': 4100,
  '200-fly': 4200,
  '200-im': 5200,
  '400-im': 5400,
}

export function getSwimCloudEventId(eventId: string): number | null {
  return EVENT_IDS[eventId] ?? null
}

export function getSwimCloudEventCourse(pool: PoolType): 'Y' | 'L' {
  return pool === 'SCY' ? 'Y' : 'L'
}

export function getSwimCloudGender(gender: 'Male' | 'Female'): 'M' | 'F' {
  return gender === 'Male' ? 'M' : 'F'
}

/** SwimCloud age_group filter (1314, 1516, 1718) */
export function getSwimCloudAgeGroup(ageGroup: AgeGroup): string {
  if (ageGroup === '13-14') return '1314'
  if (ageGroup === '15-16') return '1516'
  return '1718'
}

/** Current USA swimming season id (2025-26 → 29) */
export function getCurrentSeasonId(): number {
  const now = new Date()
  const seasonStartYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return seasonStartYear - 1996
}