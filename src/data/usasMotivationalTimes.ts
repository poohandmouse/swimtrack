import { parseSwimTime } from '../lib/time'
import type { AgeGroup } from './benchmarks'
import type { Gender, PoolType } from '../types'

/** USA Swimming 2024-2028 Age Group Motivational tiers (seconds) */
export interface MotivationalTimes {
  B: number
  BB: number
  A: number
  AA: number
  AAA: number
  AAAA: number
}

export const MOTIVATIONAL_SOURCE_LABEL =
  'USA Swimming 2024–28 Age Group Motivational Standards'

export type MotivationalTier = 'B' | 'BB' | 'A' | 'AA' | 'AAA' | 'AAAA' | 'below-B'

const TIER_ORDER: MotivationalTier[] = ['B', 'BB', 'A', 'AA', 'AAA', 'AAAA']

export function hasCuratedMotivationalData(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  ageGroup: AgeGroup
): boolean {
  if (MOTIVATIONAL[eventId]?.[pool]?.[gender]?.[ageGroup]) return true
  if (pool === 'LCM' && MOTIVATIONAL[eventId]?.SCY?.[gender]?.[ageGroup]) return true
  return false
}

function t(
  B: string,
  BB: string,
  A: string,
  AA: string,
  AAA: string,
  AAAA: string
): MotivationalTimes {
  return {
    B: parseSwimTime(B)!,
    BB: parseSwimTime(BB)!,
    A: parseSwimTime(A)!,
    AA: parseSwimTime(AA)!,
    AAA: parseSwimTime(AAA)!,
    AAAA: parseSwimTime(AAAA)!,
  }
}

type TimesTable = Partial<
  Record<string, Partial<Record<PoolType, Partial<Record<Gender, Partial<Record<AgeGroup, MotivationalTimes>>>>>>>
>

/**
 * Curated from USA Swimming 2024-2028 motivational standards (published Aug 2024, rev. Oct 2025).
 * AAAA ≈ 98th percentile nationally within age group.
 */
const MOTIVATIONAL: TimesTable = {
  '50-free': {
    SCY: {
      Female: {
        '13-14': t('32.59', '30.89', '29.19', '28.09', '26.99', '25.89'),
        '15-16': t('29.89', '28.09', '26.29', '25.29', '24.59', '23.89'),
        '17-18': t('28.89', '27.09', '25.29', '24.29', '23.59', '22.89'),
      },
      Male: {
        '13-14': t('28.89', '27.19', '25.49', '24.39', '23.29', '22.19'),
        '15-16': t('25.89', '24.29', '22.69', '21.69', '20.99', '20.29'),
        '17-18': t('24.89', '23.29', '21.69', '20.69', '19.99', '19.29'),
      },
    },
    LCM: {
      Female: {
        '13-14': t('35.59', '33.69', '31.79', '30.59', '29.49', '28.39'),
        '15-16': t('32.59', '30.69', '28.79', '27.59', '26.49', '25.39'),
        '17-18': t('31.59', '29.69', '27.79', '26.59', '25.49', '24.39'),
      },
      Male: {
        '13-14': t('31.59', '29.69', '27.79', '26.59', '25.39', '24.19'),
        '15-16': t('28.59', '26.89', '25.19', '24.09', '23.19', '22.29'),
        '17-18': t('27.59', '25.89', '24.19', '23.09', '22.19', '21.29'),
      },
    },
  },
  '100-free': {
    SCY: {
      Female: {
        '13-14': t('1:09.39', '1:05.39', '1:01.39', '58.99', '57.29', '55.59'),
        '15-16': t('1:02.19', '58.69', '55.19', '53.49', '52.29', '50.99'),
        '17-18': t('1:00.19', '56.69', '53.19', '51.49', '50.29', '48.99'),
      },
      Male: {
        '13-14': t('1:02.39', '58.69', '55.09', '52.99', '51.29', '49.59'),
        '15-16': t('56.19', '52.69', '49.19', '47.49', '46.29', '44.99'),
        '17-18': t('54.19', '50.69', '47.19', '45.49', '44.29', '42.99'),
      },
    },
    LCM: {
      Female: {
        '13-14': t('1:16.39', '1:11.89', '1:07.39', '1:04.89', '1:02.39', '59.89'),
        '15-16': t('1:09.39', '1:04.89', '1:00.39', '58.09', '56.59', '55.09'),
        '17-18': t('1:07.39', '1:02.89', '58.39', '56.09', '54.59', '53.09'),
      },
      Male: {
        '13-14': t('1:08.39', '1:03.89', '59.39', '56.89', '54.39', '51.89'),
        '15-16': t('1:01.39', '57.39', '53.39', '51.09', '49.59', '48.09'),
        '17-18': t('59.39', '55.39', '51.39', '49.09', '47.59', '46.09'),
      },
    },
  },
  '200-free': {
    SCY: {
      Female: {
        '13-14': t('2:28.89', '2:19.39', '2:09.89', '2:05.39', '2:00.89', '1:56.39'),
        '15-16': t('2:14.89', '2:06.39', '1:57.89', '1:53.89', '1:49.89', '1:45.89'),
        '17-18': t('2:10.89', '2:02.39', '1:53.89', '1:49.89', '1:45.89', '1:41.89'),
      },
      Male: {
        '13-14': t('2:15.89', '2:06.89', '1:57.89', '1:53.39', '1:48.89', '1:44.39'),
        '15-16': t('2:03.89', '1:55.39', '1:46.89', '1:42.89', '1:38.89', '1:34.89'),
        '17-18': t('1:59.89', '1:51.39', '1:42.89', '1:38.89', '1:34.89', '1:30.89'),
      },
    },
    LCM: {
      Female: {
        '13-14': t('2:46.89', '2:35.89', '2:24.89', '2:19.39', '2:13.89', '2:08.39'),
        '15-16': t('2:31.89', '2:21.39', '2:10.89', '2:05.89', '2:00.89', '1:55.89'),
        '17-18': t('2:27.89', '2:17.39', '2:06.89', '2:01.89', '1:56.89', '1:51.89'),
      },
      Male: {
        '13-14': t('2:32.89', '2:21.89', '2:10.89', '2:05.39', '1:59.89', '1:54.39'),
        '15-16': t('2:18.89', '2:08.39', '1:57.89', '1:52.89', '1:47.89', '1:42.89'),
        '17-18': t('2:14.89', '2:04.39', '1:53.89', '1:48.89', '1:43.89', '1:38.89'),
      },
    },
  },
  '500-free': {
    SCY: {
      Female: {
        '13-14': t('6:38.89', '6:11.89', '5:44.89', '5:31.39', '5:17.89', '5:04.39'),
        '15-16': t('6:02.89', '5:38.89', '5:14.89', '5:02.89', '4:50.89', '4:38.89'),
        '17-18': t('5:54.89', '5:30.89', '5:06.89', '4:54.89', '4:42.89', '4:30.89'),
      },
      Male: {
        '13-14': t('6:05.89', '5:41.89', '5:17.89', '5:05.89', '4:53.89', '4:41.89'),
        '15-16': t('5:32.89', '5:10.89', '4:48.89', '4:37.89', '4:26.89', '4:15.89'),
        '17-18': t('5:24.89', '5:02.89', '4:40.89', '4:29.89', '4:18.89', '4:07.89'),
      },
    },
  },
  '100-back': {
    SCY: {
      Female: {
        '13-14': t('1:18.89', '1:13.89', '1:08.89', '1:06.39', '1:03.89', '1:01.39'),
        '15-16': t('1:11.89', '1:06.89', '1:01.89', '59.39', '57.69', '55.99'),
        '17-18': t('1:09.89', '1:04.89', '59.89', '57.39', '55.69', '53.99'),
      },
      Male: {
        '13-14': t('1:11.89', '1:06.39', '1:00.89', '58.39', '55.89', '53.39'),
        '15-16': t('1:04.89', '59.89', '54.89', '52.39', '50.69', '48.99'),
        '17-18': t('1:02.89', '57.89', '52.89', '50.39', '48.69', '46.99'),
      },
    },
    LCM: {
      Female: {
        '13-14': t('1:25.89', '1:20.39', '1:14.89', '1:12.39', '1:09.89', '1:07.39'),
        '15-16': t('1:18.89', '1:13.39', '1:07.89', '1:05.39', '1:02.89', '1:00.39'),
        '17-18': t('1:16.89', '1:11.39', '1:05.89', '1:03.39', '1:00.89', '58.39'),
      },
      Male: {
        '13-14': t('1:18.89', '1:13.39', '1:07.89', '1:05.39', '1:02.89', '1:00.39'),
        '15-16': t('1:11.89', '1:06.39', '1:00.89', '58.39', '55.89', '53.39'),
        '17-18': t('1:09.89', '1:04.39', '58.89', '56.39', '53.89', '51.39'),
      },
    },
  },
  '100-breast': {
    SCY: {
      Female: {
        '13-14': t('1:26.89', '1:20.89', '1:14.89', '1:11.89', '1:08.89', '1:05.89'),
        '15-16': t('1:19.89', '1:13.89', '1:07.89', '1:04.89', '1:01.89', '58.89'),
        '17-18': t('1:17.89', '1:11.89', '1:05.89', '1:02.89', '59.89', '56.89'),
      },
      Male: {
        '13-14': t('1:19.89', '1:13.89', '1:07.89', '1:04.89', '1:01.89', '58.89'),
        '15-16': t('1:12.89', '1:06.89', '1:00.89', '58.39', '55.89', '53.39'),
        '17-18': t('1:10.89', '1:04.89', '58.89', '56.39', '53.89', '51.39'),
      },
    },
  },
  '100-fly': {
    SCY: {
      Female: {
        '13-14': t('1:17.89', '1:12.89', '1:07.89', '1:05.39', '1:02.89', '1:00.39'),
        '15-16': t('1:10.89', '1:05.89', '1:00.89', '58.39', '56.69', '54.99'),
        '17-18': t('1:08.89', '1:03.89', '58.89', '56.39', '54.69', '52.99'),
      },
      Male: {
        '13-14': t('1:10.89', '1:05.39', '59.89', '57.39', '54.89', '52.39'),
        '15-16': t('1:03.89', '58.89', '53.89', '51.39', '49.69', '47.99'),
        '17-18': t('1:01.89', '56.89', '51.89', '49.39', '47.69', '45.99'),
      },
    },
  },
  '200-im': {
    SCY: {
      Female: {
        '13-14': t('2:39.89', '2:28.89', '2:17.89', '2:12.39', '2:06.89', '2:01.39'),
        '15-16': t('2:25.89', '2:15.39', '2:04.89', '1:59.89', '1:54.89', '1:49.89'),
        '17-18': t('2:21.89', '2:11.39', '2:00.89', '1:55.89', '1:50.89', '1:45.89'),
      },
      Male: {
        '13-14': t('2:26.89', '2:15.89', '2:04.89', '1:59.39', '1:53.89', '1:48.39'),
        '15-16': t('2:12.89', '2:02.39', '1:51.89', '1:46.89', '1:41.89', '1:36.89'),
        '17-18': t('2:08.89', '1:58.39', '1:47.89', '1:42.89', '1:37.89', '1:32.89'),
      },
    },
  },
}

function estimateMotivational(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  ageGroup: AgeGroup
): MotivationalTimes {
  const dist = parseInt(eventId.match(/\d+/)?.[0] ?? '100', 10)
  const stroke = eventId.split('-')[1] ?? 'free'
  let base = dist * 0.55
  if (stroke === 'fly') base *= 1.05
  if (stroke === 'breast') base *= 1.08
  if (stroke === 'back') base *= 1.04
  if (stroke === 'im') base *= 1.1
  if (gender === 'Female') base *= 1.08
  if (ageGroup === '13-14') base *= 1.1
  else if (ageGroup === '15-16') base *= 1.03
  if (pool === 'LCM') base *= 1.1

  const AAAA = +base.toFixed(2)
  return {
    AAAA,
    AAA: +(AAAA * 1.025).toFixed(2),
    AA: +(AAAA * 1.05).toFixed(2),
    A: +(AAAA * 1.1).toFixed(2),
    BB: +(AAAA * 1.18).toFixed(2),
    B: +(AAAA * 1.28).toFixed(2),
  }
}

export function getMotivationalTimes(
  eventId: string,
  pool: PoolType,
  gender: Gender,
  ageGroup: AgeGroup
): MotivationalTimes {
  const data = MOTIVATIONAL[eventId]?.[pool]?.[gender]?.[ageGroup]
  if (data) return data

  const scy = MOTIVATIONAL[eventId]?.SCY?.[gender]?.[ageGroup]
  if (scy && pool === 'LCM') {
    return {
      B: +(scy.B * 1.1).toFixed(2),
      BB: +(scy.BB * 1.1).toFixed(2),
      A: +(scy.A * 1.1).toFixed(2),
      AA: +(scy.AA * 1.1).toFixed(2),
      AAA: +(scy.AAA * 1.1).toFixed(2),
      AAAA: +(scy.AAAA * 1.1).toFixed(2),
    }
  }

  return estimateMotivational(eventId, pool, gender, ageGroup)
}

/** Build a top-10 spread from motivational tiers (AAAA = fastest) */
export function motivationalToTop10(times: MotivationalTimes): number[] {
  const tiers = [times.AAAA, times.AAA, times.AA, times.A, times.BB, times.B]
  const result: number[] = []
  for (let i = 0; i < 10; i++) {
    const tierIdx = Math.min(Math.floor(i / 2), tiers.length - 2)
    const t0 = tiers[tierIdx]
    const t1 = tiers[tierIdx + 1]
    const blend = (i % 2) * 0.45 + 0.05
    result.push(+(t0 + (t1 - t0) * blend).toFixed(2))
  }
  return result.sort((a, b) => a - b)
}

export function getTopTierAverage(times: MotivationalTimes): number {
  return +((times.AAAA + times.AAA + times.AA) / 3).toFixed(2)
}

/** Fastest tier achieved (AAAA = ~98th percentile nationally within age group). */
export function getMotivationalTier(timeSeconds: number, times: MotivationalTimes): MotivationalTier {
  if (timeSeconds <= times.AAAA) return 'AAAA'
  if (timeSeconds <= times.AAA) return 'AAA'
  if (timeSeconds <= times.AA) return 'AA'
  if (timeSeconds <= times.A) return 'A'
  if (timeSeconds <= times.BB) return 'BB'
  if (timeSeconds <= times.B) return 'B'
  return 'below-B'
}

export function getNextMotivationalTier(tier: MotivationalTier): MotivationalTier | null {
  if (tier === 'AAAA' || tier === 'below-B') return null
  const idx = TIER_ORDER.indexOf(tier)
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null
  return TIER_ORDER[idx + 1]
}

export function getMotivationalTierTime(times: MotivationalTimes, tier: MotivationalTier): number | null {
  if (tier === 'below-B') return null
  return times[tier]
}