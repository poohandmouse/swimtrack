import { useState } from 'react'
import { SWIM_EVENTS } from '../data/events'
import { parseSwimTime } from '../lib/time'
import type { PoolType } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { Trophy } from 'lucide-react'

export function AddResultPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const swimmer = app.activeSwimmer
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [event, setEvent] = useState(SWIM_EVENTS[0].id)
  const [time, setTime] = useState('')
  const [meet, setMeet] = useState('')
  const [poolType, setPoolType] = useState<PoolType>('SCY')
  const [saved, setSaved] = useState<{ pr: boolean } | null>(null)
  const [error, setError] = useState('')

  if (!swimmer) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const seconds = parseSwimTime(time)
    if (seconds === null || seconds <= 0) {
      setError('Enter time as mm:ss.xx (e.g. 1:02.45 or 24.50)')
      return
    }
    if (!meet.trim()) {
      setError('Meet name is required')
      return
    }
    const result = app.addResult({
      swimmerId: swimmer.id,
      date,
      event,
      timeSeconds: seconds,
      meet: meet.trim(),
      poolType,
    })
    setSaved({ pr: !!result.isPR })
    setTime('')
    setMeet('')
    setError('')
    setTimeout(() => setSaved(null), 3000)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Add Swim Result</h2>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Date</span>
          <input type="date" className="input-field mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Event</span>
          <select className="input-field mt-1" value={event} onChange={(e) => setEvent(e.target.value)}>
            {SWIM_EVENTS.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Time (mm:ss.xx)</span>
          <input
            className="input-field mt-1 font-mono"
            placeholder="1:02.45 or 24.50"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Meet name</span>
          <input className="input-field mt-1" value={meet} onChange={(e) => setMeet(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Pool type</span>
          <select className="input-field mt-1" value={poolType} onChange={(e) => setPoolType(e.target.value as PoolType)}>
            <option value="SCY">SCY (Short Course Yards)</option>
            <option value="LCM">LCM (Long Course Meters)</option>
          </select>
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {saved && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${saved.pr ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-pool-500/10 text-pool-600'}`}>
            {saved.pr && <Trophy className="w-5 h-5" />}
            <span className="text-sm font-medium">{saved.pr ? 'Personal best recorded!' : 'Result saved.'}</span>
          </div>
        )}
        <button type="submit" className="btn-primary w-full">
          Save result
        </button>
      </form>
    </div>
  )
}