import { useMemo, useState } from 'react'
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Copy,
  History,
  Plus,
  Trash2,
  Waves,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { parseSwimTime, formatDate } from '../lib/time'
import type { useAppState } from '../hooks/useAppState'
import type { TrainingSet, TrainingStrokeType } from '../types'
import {
  createEmptySet,
  DISTANCE_PRESETS,
  REP_PRESETS,
  SESSION_NAME_PRESETS,
  SET_PRESETS,
  TRAINING_STROKES,
  UNDERWATER_PRESETS,
  getStrokeShort,
} from '../data/training'
import {
  buildUnderwaterKickTrend,
  buildWeeklyYardageTrend,
  filterSessions,
  formatPacePer100,
  formatSetDescription,
  summarizeSession,
} from '../utils/trainingStats'
import { TrainingCharts } from '../components/training/TrainingCharts'

type Tab = 'log' | 'history' | 'charts'

interface DraftSet extends Omit<TrainingSet, 'id' | 'timeSeconds'> {
  timeInput: string
}

function draftFromEmpty(): DraftSet {
  const base = createEmptySet()
  return { ...base, timeInput: '' }
}

function draftFromPreset(preset: (typeof SET_PRESETS)[number]): DraftSet {
  return {
    stroke: preset.stroke,
    distance: preset.distance,
    reps: preset.reps,
    timeInput: '',
    withDolphinKick: preset.withDolphinKick ?? false,
    underwaterDistance: preset.withDolphinKick ? '25y' : '',
    rpe: null,
    strokeCount: null,
    notes: '',
  }
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function TrainingPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const swimmer = app.activeSwimmer
  const [tab, setTab] = useState<Tab>('log')

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [sessionName, setSessionName] = useState('Morning Practice')
  const [sets, setSets] = useState<DraftSet[]>([draftFromEmpty()])
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)

  const [filterStroke, setFilterStroke] = useState<TrainingStrokeType | 'all'>('all')
  const [filterDrillOnly, setFilterDrillOnly] = useState(false)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  const sessions = useMemo(
    () => (swimmer ? app.swimmerTrainingSessions(swimmer.id) : []),
    [swimmer, app]
  )

  const filteredSessions = useMemo(
    () =>
      filterSessions(sessions, {
        stroke: filterStroke,
        drillOnly: filterDrillOnly,
        dateFrom: filterFrom || undefined,
        dateTo: filterTo || undefined,
        search: filterSearch || undefined,
      }),
    [sessions, filterStroke, filterDrillOnly, filterFrom, filterTo, filterSearch]
  )

  const weeklyYardage = useMemo(() => buildWeeklyYardageTrend(sessions), [sessions])
  const underwaterKicks = useMemo(() => buildUnderwaterKickTrend(sessions), [sessions])

  const draftSummary = useMemo(() => {
    const mockSets: TrainingSet[] = sets.map((s, i) => ({
      id: `draft-${i}`,
      stroke: s.stroke,
      distance: s.distance,
      reps: s.reps,
      timeSeconds: s.timeInput.trim() ? parseSwimTime(s.timeInput) : null,
      withDolphinKick: s.withDolphinKick,
      underwaterDistance: s.underwaterDistance,
      rpe: s.rpe,
      strokeCount: s.strokeCount,
      notes: s.notes,
    }))
    return summarizeSession({
      id: 'draft',
      swimmerId: '',
      date,
      sessionName,
      sets: mockSets,
      createdAt: '',
    })
  }, [sets, date, sessionName])

  const updateSet = (index: number, patch: Partial<DraftSet>) => {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const removeSet = (index: number) => {
    setSets((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const duplicateSet = (index: number) => {
    setSets((prev) => {
      const copy = { ...prev[index] }
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]
    })
  }

  const addPresetSet = (preset: (typeof SET_PRESETS)[number]) => {
    setSets((prev) => [...prev, draftFromPreset(preset)])
  }

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10))
    setSessionName('Morning Practice')
    setSets([draftFromEmpty()])
    setFormError('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!swimmer) return
    if (!sessionName.trim()) {
      setFormError('Session name is required.')
      return
    }

    const parsedSets: TrainingSet[] = []
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i]
      if (s.distance <= 0) {
        setFormError(`Set ${i + 1}: enter a distance greater than 0.`)
        return
      }
      let timeSeconds: number | null = null
      if (s.timeInput.trim()) {
        timeSeconds = parseSwimTime(s.timeInput)
        if (timeSeconds === null) {
          setFormError(`Set ${i + 1}: time must be mm:ss.xx (e.g. 1:32.50).`)
          return
        }
      }
      parsedSets.push({
        id: uid(),
        stroke: s.stroke,
        distance: s.distance,
        reps: Math.max(1, s.reps),
        timeSeconds,
        withDolphinKick: s.withDolphinKick,
        underwaterDistance: s.underwaterDistance.trim(),
        rpe: s.rpe,
        strokeCount: s.strokeCount,
        notes: s.notes.trim(),
      })
    }

    app.addTrainingSession({
      swimmerId: swimmer.id,
      date,
      sessionName: sessionName.trim(),
      sets: parsedSets,
    })
    setSaved(true)
    setFormError('')
    resetForm()
    setTimeout(() => setSaved(false), 2500)
  }

  if (!swimmer) return null

  const tabs: { id: Tab; label: string; icon: typeof Plus }[] = [
    { id: 'log', label: 'Log', icon: Plus },
    { id: 'history', label: 'History', icon: History },
    { id: 'charts', label: 'Insights', icon: BarChart3 },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Training Log</h2>
          <p className="text-sm text-slate-500 mt-1">
            {swimmer.name} · log sets fast, review volume and kick progress
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900/50">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === id
                  ? 'bg-white dark:bg-slate-800 text-pool-600 dark:text-pool-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'log' && (
        <form onSubmit={submit} className="space-y-5">
          <div className="card p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Date</span>
                <input
                  type="date"
                  className="input-field mt-1"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Session name</span>
                <input
                  className="input-field mt-1"
                  placeholder="Morning Practice - Distance Free"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {SESSION_NAME_PRESETS.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-pool-400 hover:text-pool-600 dark:hover:text-pool-400 transition-colors"
                  onClick={() => setSessionName(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Quick add set</span>
            {SET_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="btn-secondary text-xs py-1 px-2.5"
                onClick={() => addPresetSet(preset)}
              >
                + {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => (
              <SetCard
                key={index}
                index={index}
                set={set}
                onChange={(patch) => updateSet(index, patch)}
                onRemove={() => removeSet(index)}
                onDuplicate={() => duplicateSet(index)}
                canRemove={sets.length > 1}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSets((prev) => [...prev, draftFromEmpty()])}
            >
              <Plus className="w-4 h-4" />
              Add set
            </button>
            {sets.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => duplicateSet(sets.length - 1)}
              >
                <Copy className="w-4 h-4" />
                Duplicate last
              </button>
            )}
          </div>

          <SessionSummaryCard summary={draftSummary} sessionName={sessionName} />

          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          {saved && (
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">Session saved!</p>
          )}

          <button type="submit" className="btn-primary w-full sm:w-auto">
            <Waves className="w-4 h-4" />
            Save session
          </button>
        </form>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-sm">
              <span className="text-slate-500 text-xs">From</span>
              <input
                type="date"
                className="input-field mt-1"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500 text-xs">To</span>
              <input
                type="date"
                className="input-field mt-1"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500 text-xs">Stroke</span>
              <select
                className="input-field mt-1"
                value={filterStroke}
                onChange={(e) => setFilterStroke(e.target.value as TrainingStrokeType | 'all')}
              >
                <option value="all">All strokes</option>
                {TRAINING_STROKES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm flex items-end">
              <span className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={filterDrillOnly}
                  onChange={(e) => setFilterDrillOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-600 dark:text-slate-400">Kick / pull / drill only</span>
              </span>
            </label>
            <label className="text-sm sm:col-span-2 lg:col-span-4">
              <span className="text-slate-500 text-xs">Search session or notes</span>
              <input
                className="input-field mt-1"
                placeholder="e.g. distance, underwater..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </label>
          </div>

          <p className="text-sm text-slate-500">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            {filteredSessions.length !== sessions.length ? ` (of ${sessions.length})` : ''}
          </p>

          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <HistorySessionCard
                key={session.id}
                session={session}
                onDelete={() => {
                  if (confirm('Delete this training session?')) app.deleteTrainingSession(session.id)
                }}
              />
            ))}
            {filteredSessions.length === 0 && (
              <div className="card p-10 text-center text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No sessions match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'charts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill
              label="Total sessions"
              value={String(sessions.length)}
            />
            <StatPill
              label="All-time yardage"
              value={`${sessions.reduce((s, sess) => s + summarizeSession(sess).totalYardage, 0).toLocaleString()} yd`}
            />
            <StatPill
              label="This month"
              value={`${sessions
                .filter((s) => s.date.startsWith(new Date().toISOString().slice(0, 7)))
                .reduce((sum, s) => sum + summarizeSession(s).totalYardage, 0)
                .toLocaleString()} yd`}
            />
            <StatPill
              label="Kick sets logged"
              value={String(
                sessions.reduce(
                  (n, s) => n + s.sets.filter((set) => set.stroke === 'kick' || set.withDolphinKick).length,
                  0
                )
              )}
            />
          </div>
          <TrainingCharts weeklyYardage={weeklyYardage} underwaterKicks={underwaterKicks} />
        </div>
      )}
    </div>
  )
}

function SetCard({
  index,
  set,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
}: {
  index: number
  set: DraftSet
  onChange: (patch: Partial<DraftSet>) => void
  onRemove: () => void
  onDuplicate: () => void
  canRemove: boolean
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="card p-4 border-l-4 border-l-pool-400">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"
          onClick={() => setExpanded((e) => !e)}
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform', !expanded && '-rotate-90')} />
          Set {index + 1}
          <span className="text-slate-500 font-normal">
            — {set.reps}×{set.distance} {getStrokeShort(set.stroke)}
          </span>
        </button>
        <div className="flex gap-1">
          <button type="button" className="p-1.5 text-slate-400 hover:text-pool-500" onClick={onDuplicate} title="Duplicate">
            <Copy className="w-4 h-4" />
          </button>
          {canRemove && (
            <button type="button" className="p-1.5 text-slate-400 hover:text-red-500" onClick={onRemove}>
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {TRAINING_STROKES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ stroke: s.id })}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  set.stroke === s.id
                    ? 'bg-pool-100 dark:bg-pool-950/40 border-pool-400 text-pool-700 dark:text-pool-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-pool-300'
                )}
              >
                {s.short}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="text-sm">
              <span className="text-slate-500 text-xs">Reps</span>
              <div className="flex flex-wrap gap-1 mt-1 mb-1">
                {REP_PRESETS.slice(0, 6).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded border',
                      set.reps === r
                        ? 'border-pool-400 bg-pool-50 dark:bg-pool-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    )}
                    onClick={() => onChange({ reps: r })}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                className="input-field"
                value={set.reps}
                onChange={(e) => onChange({ reps: parseInt(e.target.value) || 1 })}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500 text-xs">Distance (yd)</span>
              <div className="flex flex-wrap gap-1 mt-1 mb-1">
                {DISTANCE_PRESETS.slice(0, 6).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded border',
                      set.distance === d
                        ? 'border-pool-400 bg-pool-50 dark:bg-pool-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    )}
                    onClick={() => onChange({ distance: d })}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                className="input-field"
                value={set.distance}
                onChange={(e) => onChange({ distance: parseInt(e.target.value) || 0 })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-slate-500 text-xs">Time per rep (mm:ss.xx)</span>
              <input
                className="input-field mt-1 font-mono"
                placeholder="1:32.50"
                value={set.timeInput}
                onChange={(e) => onChange({ timeInput: e.target.value })}
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-sm flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={set.withDolphinKick}
                onChange={(e) => onChange({ withDolphinKick: e.target.checked })}
                className="rounded border-slate-300"
              />
              <span className="text-slate-600 dark:text-slate-400">With fins / dolphin kick</span>
            </label>
            <label className="text-sm">
              <span className="text-slate-500 text-xs">Underwater distance</span>
              <select
                className="input-field mt-1"
                value={set.underwaterDistance}
                onChange={(e) => onChange({ underwaterDistance: e.target.value })}
              >
                {UNDERWATER_PRESETS.map((u) => (
                  <option key={u || 'none'} value={u}>
                    {u || '—'}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-500 text-xs">RPE (1–10)</span>
              <select
                className="input-field mt-1"
                value={set.rpe ?? ''}
                onChange={(e) =>
                  onChange({ rpe: e.target.value ? parseInt(e.target.value) : null })
                }
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-500 text-xs">Stroke count (optional)</span>
              <input
                type="number"
                min={0}
                className="input-field mt-1"
                placeholder="e.g. 12 per 25"
                value={set.strokeCount ?? ''}
                onChange={(e) =>
                  onChange({
                    strokeCount: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500 text-xs">Notes</span>
              <input
                className="input-field mt-1"
                placeholder="e.g. strong breakout, held streamline"
                value={set.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionSummaryCard({
  summary,
  sessionName,
}: {
  summary: ReturnType<typeof summarizeSession>
  sessionName: string
}) {
  const strokeEntries = Object.entries(summary.strokeYardage).filter(([, yd]) => yd && yd > 0)

  return (
    <div className="card p-4 bg-pool-50/50 dark:bg-pool-950/20 border-pool-200 dark:border-pool-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        Session preview — {sessionName || 'Untitled'}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
        <div>
          <p className="text-xs text-slate-500">Total yardage</p>
          <p className="text-xl font-bold tabular-nums">{summary.totalYardage.toLocaleString()} yd</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Sets</p>
          <p className="text-xl font-bold tabular-nums">{summary.setCount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg pace</p>
          <p className="text-xl font-bold tabular-nums font-mono text-sm mt-1">
            {summary.avgPace !== null ? formatPacePer100(summary.avgPace) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg RPE</p>
          <p className="text-xl font-bold tabular-nums">
            {summary.avgRpe !== null ? summary.avgRpe : '—'}
          </p>
        </div>
      </div>
      {strokeEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {strokeEntries.map(([stroke, yd]) => (
            <span
              key={stroke}
              className="text-xs px-2 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {getStrokeShort(stroke as TrainingStrokeType)} {yd?.toLocaleString()} yd
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function HistorySessionCard({
  session,
  onDelete,
}: {
  session: import('../types').TrainingSession
  onDelete: () => void
}) {
  const summary = summarizeSession(session)
  const [open, setOpen] = useState(false)

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4">
        <button type="button" className="text-left flex-1 min-w-0" onClick={() => setOpen((o) => !o)}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900 dark:text-white">{session.sessionName}</p>
            <span className="text-xs text-pool-600 dark:text-pool-400">{formatDate(session.date)}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {summary.totalYardage.toLocaleString()} yd · {summary.setCount} set
            {summary.setCount !== 1 ? 's' : ''}
            {summary.avgPace !== null ? ` · ${formatPacePer100(summary.avgPace)} avg` : ''}
            {summary.avgRpe !== null ? ` · RPE ${summary.avgRpe}` : ''}
          </p>
        </button>
        <button
          type="button"
          className="text-slate-400 hover:text-red-500 shrink-0 p-1"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
          {session.sets.map((set) => (
            <div key={set.id} className="text-sm flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-700 dark:text-slate-300">{formatSetDescription(set)}</span>
              {set.notes && (
                <span className="text-slate-500 text-xs sm:max-w-[40%] sm:text-right">{set.notes}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">{value}</p>
    </div>
  )
}