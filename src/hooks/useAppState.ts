import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  EMPTY_STATE,
  STORAGE_KEY,
  type AppState,
  type Goal,
  type PoolType,
  type SwimResult,
  type Swimmer,
  type TrainingSession,
  type TrainingSet,
} from '../types'
import type { ConflictAction } from '../utils/importResults'

function migrateLegacyTraining(raw: unknown): TrainingSession[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => {
    const t = entry as Record<string, unknown>
    if (typeof t.sessionName === 'string' && Array.isArray(t.sets)) {
      return {
        id: String(t.id),
        swimmerId: String(t.swimmerId),
        date: String(t.date),
        sessionName: t.sessionName,
        sets: (t.sets as TrainingSet[]).map((s) => ({
          id: String(s.id),
          stroke: s.stroke ?? 'other',
          distance: Number(s.distance) || 0,
          reps: Number(s.reps) || 1,
          timeSeconds: s.timeSeconds ?? null,
          withDolphinKick: !!s.withDolphinKick,
          underwaterDistance: s.underwaterDistance ?? '',
          rpe: s.rpe ?? null,
          strokeCount: s.strokeCount ?? null,
          notes: s.notes ?? '',
        })),
        createdAt: String(t.createdAt ?? new Date().toISOString()),
      }
    }
    const notes = typeof t.notes === 'string' ? t.notes : ''
    return {
      id: String(t.id),
      swimmerId: String(t.swimmerId),
      date: String(t.date),
      sessionName: 'Imported workout',
      sets: notes
        ? [
            {
              id: `legacy-${t.id}`,
              stroke: 'other' as const,
              distance: 0,
              reps: 1,
              timeSeconds: null,
              withDolphinKick: false,
              underwaterDistance: '',
              rpe: null,
              strokeCount: null,
              notes,
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
    }
  })
}

function normalizeState(parsed: Partial<AppState> & { training?: unknown[] }): AppState {
  const swimmers = (parsed.swimmers ?? []).map((s) => ({
    ...s,
    state: s.state ?? '',
    usasId: s.usasId ?? '',
    swimcloudId: s.swimcloudId ?? '',
  }))
  const activeSwimmerId =
    swimmers.length === 0
      ? null
      : swimmers.some((s) => s.id === parsed.activeSwimmerId)
        ? parsed.activeSwimmerId!
        : swimmers[0].id

  const trainingSessions =
    parsed.trainingSessions ?? migrateLegacyTraining(parsed.training ?? [])

  return {
    ...EMPTY_STATE,
    ...parsed,
    swimmers,
    activeSwimmerId,
    trainingSessions,
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_STATE }
    return normalizeState(JSON.parse(raw) as Partial<AppState>)
  } catch {
    return { ...EMPTY_STATE }
  }
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function recalculatePRs(results: SwimResult[]): SwimResult[] {
  const bestByGroup = new Map<string, number>()
  for (const r of results) {
    const key = `${r.swimmerId}|${r.event}|${r.poolType}`
    const cur = bestByGroup.get(key)
    if (cur === undefined || r.timeSeconds < cur) bestByGroup.set(key, r.timeSeconds)
  }
  return results.map((r) => {
    const key = `${r.swimmerId}|${r.event}|${r.poolType}`
    const best = bestByGroup.get(key)!
    return { ...r, isPR: r.timeSeconds === best }
  })
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state])

  const activeSwimmer = useMemo(
    () => state.swimmers.find((s) => s.id === state.activeSwimmerId) ?? null,
    [state.swimmers, state.activeSwimmerId]
  )

  const swimmerResults = useCallback(
    (swimmerId: string) =>
      state.results
        .filter((r) => r.swimmerId === swimmerId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.results]
  )

  const addSwimmer = useCallback((data: Omit<Swimmer, 'id' | 'createdAt'>) => {
    const swimmer: Swimmer = { ...data, id: uid(), createdAt: new Date().toISOString() }
    setState((s) => ({
      ...s,
      swimmers: [...s.swimmers, swimmer],
      activeSwimmerId: s.activeSwimmerId ?? swimmer.id,
    }))
    return swimmer
  }, [])

  const updateSwimmer = useCallback((id: string, data: Partial<Swimmer>) => {
    setState((s) => ({
      ...s,
      swimmers: s.swimmers.map((sw) => (sw.id === id ? { ...sw, ...data } : sw)),
    }))
  }, [])

  const deleteSwimmer = useCallback((id: string) => {
    setState((s) => {
      const swimmers = s.swimmers.filter((sw) => sw.id !== id)
      return {
        ...s,
        swimmers,
        activeSwimmerId: s.activeSwimmerId === id ? swimmers[0]?.id ?? null : s.activeSwimmerId,
        results: s.results.filter((r) => r.swimmerId !== id),
        goals: s.goals.filter((g) => g.swimmerId !== id),
        trainingSessions: s.trainingSessions.filter((t) => t.swimmerId !== id),
      }
    })
  }, [])

  const setActiveSwimmer = useCallback((id: string) => {
    setState((s) => ({ ...s, activeSwimmerId: id }))
  }, [])

  const addResult = useCallback((data: Omit<SwimResult, 'id' | 'isPR'>) => {
    const result: SwimResult = { ...data, id: uid(), isPR: false }
    setState((s) => ({ ...s, results: recalculatePRs([...s.results, result]) }))
    return result
  }, [])

  const updateResult = useCallback(
    (id: string, data: { timeSeconds?: number; meet?: string }) => {
      setState((s) => {
        const updated = s.results.map((r) =>
          r.id === id
            ? {
                ...r,
                ...(data.timeSeconds !== undefined ? { timeSeconds: data.timeSeconds } : {}),
                ...(data.meet !== undefined ? { meet: data.meet } : {}),
              }
            : r
        )
        return { ...s, results: recalculatePRs(updated) }
      })
    },
    []
  )

  const deleteResult = useCallback((id: string) => {
    setState((s) => ({ ...s, results: recalculatePRs(s.results.filter((r) => r.id !== id)) }))
  }, [])

  const importResults = useCallback(
    (
      swimmerId: string,
      rows: Array<{
        date: string
        event: string
        timeSeconds: number
        meet: string
        poolType: PoolType
        existingResultId?: string
        status: 'valid' | 'conflict' | 'invalid'
      }>,
      conflictAction: ConflictAction
    ) => {
      let added = 0
      let updated = 0
      let skipped = 0

      setState((s) => {
        let results = [...s.results]

        for (const row of rows) {
          if (row.status === 'invalid') continue

          if (row.status === 'conflict' && row.existingResultId) {
            if (conflictAction === 'skip') {
              skipped++
              continue
            }
            if (conflictAction === 'overwrite') {
              results = results.map((r) =>
                r.id === row.existingResultId ? { ...r, timeSeconds: row.timeSeconds } : r
              )
              updated++
              continue
            }
          }

          results.push({
            id: uid(),
            swimmerId,
            date: row.date,
            event: row.event,
            timeSeconds: row.timeSeconds,
            meet: row.meet,
            poolType: row.poolType,
            isPR: false,
          })
          added++
        }

        return { ...s, results: recalculatePRs(results) }
      })

      return { added, updated, skipped }
    },
    []
  )

  const addGoal = useCallback((data: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal: Goal = { ...data, id: uid(), createdAt: new Date().toISOString() }
    setState((s) => ({ ...s, goals: [...s.goals, goal] }))
    return goal
  }, [])

  const deleteGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))
  }, [])

  const swimmerTrainingSessions = useCallback(
    (swimmerId: string) =>
      state.trainingSessions
        .filter((t) => t.swimmerId === swimmerId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [state.trainingSessions]
  )

  const addTrainingSession = useCallback(
    (data: Omit<TrainingSession, 'id' | 'createdAt'>) => {
      const session: TrainingSession = {
        ...data,
        id: uid(),
        createdAt: new Date().toISOString(),
      }
      setState((s) => ({ ...s, trainingSessions: [...s.trainingSessions, session] }))
      return session
    },
    []
  )

  const deleteTrainingSession = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      trainingSessions: s.trainingSessions.filter((t) => t.id !== id),
    }))
  }, [])

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
  }, [])

  return {
    state,
    activeSwimmer,
    swimmerResults,
    addSwimmer,
    updateSwimmer,
    deleteSwimmer,
    setActiveSwimmer,
    addResult,
    updateResult,
    deleteResult,
    importResults,
    addGoal,
    deleteGoal,
    swimmerTrainingSessions,
    addTrainingSession,
    deleteTrainingSession,
    toggleTheme,
  }
}