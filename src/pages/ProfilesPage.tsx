import { useState } from 'react'
import type { Gender, Swimmer } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { US_STATES } from '../data/states'

export function ProfilesPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const [editing, setEditing] = useState<Swimmer | null>(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState(14)
  const [gender, setGender] = useState<Gender>('Female')
  const [club, setClub] = useState('')
  const [state, setState] = useState('')
  const [usasId, setUsasId] = useState('')
  const [swimcloudId, setSwimcloudId] = useState('')
  const [formError, setFormError] = useState('')

  const reset = () => {
    setEditing(null)
    setName('')
    setAge(14)
    setGender('Female')
    setClub('')
    setState('')
    setUsasId('')
    setSwimcloudId('')
    setFormError('')
  }

  const startEdit = (s: Swimmer) => {
    setEditing(s)
    setName(s.name)
    setAge(s.age)
    setGender(s.gender)
    setClub(s.club)
    setState(s.state ?? '')
    setUsasId(s.usasId ?? '')
    setSwimcloudId(s.swimcloudId ?? '')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !club.trim() || !state) {
      setFormError('Name, club, and state are required.')
      return
    }
    setFormError('')
    const profile = {
      name: name.trim(),
      age,
      gender,
      club: club.trim(),
      state,
      usasId: usasId.trim(),
      swimcloudId: swimcloudId.trim(),
    }
    if (editing) {
      app.updateSwimmer(editing.id, profile)
    } else {
      app.addSwimmer(profile)
    }
    reset()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Swimmer Profiles</h2>
        <p className="text-slate-500 text-sm mt-1">Manage swimmers — switch between them in the header.</p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <h3 className="font-semibold">{editing ? 'Edit profile' : 'New swimmer'}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Name</span>
            <input className="input-field mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Age (13–17)</span>
            <input
              type="number"
              min={13}
              max={17}
              className="input-field mt-1"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 13)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Gender</span>
            <select className="input-field mt-1" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Club / Team</span>
            <input className="input-field mt-1" value={club} onChange={(e) => setClub(e.target.value)} required />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600 dark:text-slate-400">State</span>
            <select className="input-field mt-1" value={state} onChange={(e) => setState(e.target.value)} required>
              <option value="">Select your state...</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 mt-1 block">Used for state leader comparisons on the Analysis tab</span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600 dark:text-slate-400">SwimCloud ID (optional)</span>
            <input
              className="input-field mt-1 font-mono"
              value={swimcloudId}
              onChange={(e) => setSwimcloudId(e.target.value)}
              placeholder="e.g. 3472615"
            />
            <span className="text-xs text-slate-500 mt-1 block">
              Optional — reserved for future meet sync. Comparisons use USA Swimming motivational standards.
            </span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600 dark:text-slate-400">USA Swimming ID (optional)</span>
            <input
              className="input-field mt-1 font-mono"
              value={usasId}
              onChange={(e) => setUsasId(e.target.value)}
              placeholder="e.g. 1234AB56"
            />
          </label>
        </div>
        {formError && <p className="text-red-500 text-sm">{formError}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {editing ? 'Save changes' : 'Add swimmer'}
          </button>
          {editing && (
            <button type="button" className="btn-secondary" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {app.state.swimmers.length > 0 && (
        <div className="card divide-y divide-slate-200 dark:divide-slate-800">
          {app.state.swimmers.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
                <p className="text-sm text-slate-500">
                  Age {s.age} · {s.gender} · {s.club}
                  {s.state ? ` · ${US_STATES.find((st) => st.code === s.state)?.name ?? s.state}` : ''}
                  {s.swimcloudId ? ` · SwimCloud ${s.swimcloudId}` : ''}
                  {s.usasId ? ` · USAS ${s.usasId}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary text-sm" onClick={() => startEdit(s)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="text-sm text-red-500 hover:text-red-400 px-2"
                  onClick={() => {
                    if (confirm(`Delete ${s.name} and all their data?`)) app.deleteSwimmer(s.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}