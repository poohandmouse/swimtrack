import { getStrokeShort } from '../data/training'
import { formatChartDate, formatSwimTime } from '../lib/time'
import type { TrainingSession, TrainingSet, TrainingStrokeType } from '../types'

export function setYardage(set: TrainingSet): number {
  return set.reps * set.distance
}

export function sessionYardage(session: TrainingSession): number {
  return session.sets.reduce((sum, s) => sum + setYardage(s), 0)
}

export function setPacePer100(set: TrainingSet): number | null {
  if (set.timeSeconds === null || set.distance <= 0) return null
  return (set.timeSeconds / set.distance) * 100
}

export function sessionAvgPace(session: TrainingSession): number | null {
  let weighted = 0
  let totalDist = 0
  for (const set of session.sets) {
    const pace = setPacePer100(set)
    const dist = setYardage(set)
    if (pace !== null && dist > 0) {
      weighted += pace * dist
      totalDist += dist
    }
  }
  if (totalDist === 0) return null
  return +(weighted / totalDist).toFixed(2)
}

export function formatPacePer100(seconds: number): string {
  return `${formatSwimTime(seconds)}/100`
}

export interface SessionSummary {
  totalYardage: number
  setCount: number
  avgPace: number | null
  strokeYardage: Partial<Record<TrainingStrokeType, number>>
  avgRpe: number | null
}

export function summarizeSession(session: TrainingSession): SessionSummary {
  const strokeYardage: Partial<Record<TrainingStrokeType, number>> = {}
  let rpeSum = 0
  let rpeCount = 0

  for (const set of session.sets) {
    const yd = setYardage(set)
    strokeYardage[set.stroke] = (strokeYardage[set.stroke] ?? 0) + yd
    if (set.rpe !== null) {
      rpeSum += set.rpe
      rpeCount++
    }
  }

  return {
    totalYardage: sessionYardage(session),
    setCount: session.sets.length,
    avgPace: sessionAvgPace(session),
    strokeYardage,
    avgRpe: rpeCount > 0 ? +(rpeSum / rpeCount).toFixed(1) : null,
  }
}

export interface TrainingFilters {
  stroke?: TrainingStrokeType | 'all'
  drillOnly?: boolean
  dateFrom?: string
  dateTo?: string
  search?: string
}

export function filterSessions(
  sessions: TrainingSession[],
  filters: TrainingFilters
): TrainingSession[] {
  return sessions.filter((session) => {
    if (filters.dateFrom && session.date < filters.dateFrom) return false
    if (filters.dateTo && session.date > filters.dateTo) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const inName = session.sessionName.toLowerCase().includes(q)
      const inNotes = session.sets.some((s) => s.notes.toLowerCase().includes(q))
      if (!inName && !inNotes) return false
    }
    if (filters.stroke && filters.stroke !== 'all') {
      if (!session.sets.some((s) => s.stroke === filters.stroke)) return false
    }
    if (filters.drillOnly) {
      if (!session.sets.some((s) => s.stroke === 'kick' || s.stroke === 'pull' || s.stroke === 'drill'))
        return false
    }
    return true
  })
}

export interface WeeklyYardagePoint {
  weekLabel: string
  weekStart: string
  yardage: number
  sessions: number
}

export function buildWeeklyYardageTrend(sessions: TrainingSession[]): WeeklyYardagePoint[] {
  const byWeek = new Map<string, { yardage: number; sessions: number }>()

  for (const session of sessions) {
    const d = new Date(session.date + 'T12:00:00')
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    const weekStart = monday.toISOString().slice(0, 10)

    const cur = byWeek.get(weekStart) ?? { yardage: 0, sessions: 0 }
    cur.yardage += sessionYardage(session)
    cur.sessions += 1
    byWeek.set(weekStart, cur)
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, data]) => ({
      weekStart,
      weekLabel: formatChartDate(weekStart),
      yardage: data.yardage,
      sessions: data.sessions,
    }))
}

export interface UnderwaterKickPoint {
  date: string
  dateLabel: string
  time: number
  timeLabel: string
  underwaterDistance: string
  stroke: string
  sessionName: string
}

export function isUnderwaterKickSet(set: TrainingSet): boolean {
  return (
    set.timeSeconds !== null &&
    (set.stroke === 'kick' ||
      set.withDolphinKick ||
      set.underwaterDistance.trim().length > 0)
  )
}

/** Best underwater/kick times per session date (fastest per day) */
export function buildUnderwaterKickTrend(sessions: TrainingSession[]): UnderwaterKickPoint[] {
  const byDate = new Map<string, UnderwaterKickPoint>()

  for (const session of sessions) {
    for (const set of session.sets) {
      if (!isUnderwaterKickSet(set) || set.timeSeconds === null) continue
      const existing = byDate.get(session.date)
      if (!existing || set.timeSeconds < existing.time) {
        byDate.set(session.date, {
          date: session.date,
          dateLabel: formatChartDate(session.date),
          time: set.timeSeconds,
          timeLabel: formatSwimTime(set.timeSeconds),
          underwaterDistance: set.underwaterDistance || (set.withDolphinKick ? 'fins' : '—'),
          stroke: getStrokeShort(set.stroke),
          sessionName: session.sessionName,
        })
      }
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function formatSetDescription(set: TrainingSet): string {
  const stroke = getStrokeShort(set.stroke)
  const base = set.reps > 1 ? `${set.reps}×${set.distance} ${stroke}` : `${set.distance} ${stroke}`
  const extras: string[] = []
  if (set.timeSeconds !== null) extras.push(`@ ${formatSwimTime(set.timeSeconds)}`)
  if (set.withDolphinKick) extras.push('fins')
  if (set.underwaterDistance) extras.push(`UW ${set.underwaterDistance}`)
  if (set.rpe !== null) extras.push(`RPE ${set.rpe}`)
  if (set.strokeCount !== null) extras.push(`${set.strokeCount} strokes`)
  return extras.length ? `${base} ${extras.join(' · ')}` : base
}