import { useMemo, useState } from 'react'
import { getEventLabel, SWIM_EVENTS } from '../data/events'
import { formatSwimTime, formatDate, parseSwimTime } from '../lib/time'
import type { useAppState } from '../hooks/useAppState'
import type { SwimResult } from '../types'
import { Trash2, Pencil, Check, X } from 'lucide-react'

type SortKey = 'date' | 'event' | 'time' | 'meet'

export function ResultsPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const swimmer = app.activeSwimmer
  const [filterEvent, setFilterEvent] = useState('')
  const [filterPool, setFilterPool] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTime, setEditTime] = useState('')
  const [editMeet, setEditMeet] = useState('')
  const [editError, setEditError] = useState('')

  const results = useMemo(() => {
    if (!swimmer) return []
    let list = app.swimmerResults(swimmer.id)
    if (filterEvent) list = list.filter((r) => r.event === filterEvent)
    if (filterPool) list = list.filter((r) => r.poolType === filterPool)
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortKey === 'event') cmp = a.event.localeCompare(b.event)
      else if (sortKey === 'time') cmp = a.timeSeconds - b.timeSeconds
      else cmp = a.meet.localeCompare(b.meet)
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [swimmer, app, filterEvent, filterPool, sortKey, sortAsc])

  if (!swimmer) return null

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(key === 'event' || key === 'meet')
    }
  }

  const startEdit = (r: SwimResult) => {
    setEditingId(r.id)
    setEditTime(formatSwimTime(r.timeSeconds))
    setEditMeet(r.meet)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTime('')
    setEditMeet('')
    setEditError('')
  }

  const saveEdit = (id: string) => {
    const seconds = parseSwimTime(editTime)
    if (seconds === null || seconds <= 0) {
      setEditError('Enter a valid time (mm:ss.xx or ss.xx)')
      return
    }
    if (!editMeet.trim()) {
      setEditError('Meet name is required')
      return
    }
    app.updateResult(id, { timeSeconds: seconds, meet: editMeet.trim() })
    cancelEdit()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Results History</h2>
      <p className="text-sm text-slate-500">Click the pencil icon to correct a time or meet name.</p>
      <div className="flex flex-wrap gap-3">
        <select className="input-field w-auto" value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
          <option value="">All events</option>
          {SWIM_EVENTS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <select className="input-field w-auto" value={filterPool} onChange={(e) => setFilterPool(e.target.value)}>
          <option value="">All pools</option>
          <option value="SCY">SCY</option>
          <option value="LCM">LCM</option>
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
              <tr>
                <th className="p-3 cursor-pointer hover:text-pool-600" onClick={() => toggleSort('date')}>
                  Date {sortKey === 'date' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-3 cursor-pointer hover:text-pool-600" onClick={() => toggleSort('event')}>
                  Event {sortKey === 'event' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-3 cursor-pointer hover:text-pool-600" onClick={() => toggleSort('time')}>
                  Time {sortKey === 'time' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-3">Pool</th>
                <th className="p-3 cursor-pointer hover:text-pool-600" onClick={() => toggleSort('meet')}>
                  Meet {sortKey === 'meet' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-slate-100 dark:border-slate-800 ${
                    editingId === r.id ? 'bg-pool-50 dark:bg-pool-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <td className="p-3">{formatDate(r.date)}</td>
                  <td className="p-3">{getEventLabel(r.event)}</td>
                  <td className="p-3 font-mono">
                    {editingId === r.id ? (
                      <input
                        className="input-field font-mono w-28 py-1"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        placeholder="1:02.45"
                        autoFocus
                      />
                    ) : (
                      <>
                        {formatSwimTime(r.timeSeconds)}
                        {r.isPR && <span className="pr-badge ml-2">PR</span>}
                      </>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{r.poolType}</td>
                  <td className="p-3">
                    {editingId === r.id ? (
                      <input
                        className="input-field py-1 min-w-[140px]"
                        value={editMeet}
                        onChange={(e) => setEditMeet(e.target.value)}
                      />
                    ) : (
                      r.meet
                    )}
                  </td>
                  <td className="p-3">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-500/10"
                          onClick={() => saveEdit(r.id)}
                          aria-label="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-500/10"
                          onClick={cancelEdit}
                          aria-label="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 text-slate-400 hover:text-pool-600"
                          onClick={() => startEdit(r)}
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-slate-400 hover:text-red-500"
                          onClick={() => app.deleteResult(r.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {editError && (
            <p className="text-red-500 text-sm px-3 py-2 border-t border-slate-100 dark:border-slate-800">{editError}</p>
          )}
          {results.length === 0 && (
            <p className="text-center text-slate-500 py-12">No results yet. Add your first swim!</p>
          )}
        </div>
      </div>
    </div>
  )
}