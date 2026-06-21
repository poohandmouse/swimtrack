import { useRef, useState } from 'react'
import { getEventLabel } from '../data/events'
import { formatSwimTime } from '../lib/time'
import type { useAppState } from '../hooks/useAppState'
import {
  downloadCsvTemplate,
  type ConflictAction,
  type ParsedImportRow,
  parseImportFile,
} from '../utils/importResults'
import { AlertCircle, CheckCircle2, Download, FileUp, Upload } from 'lucide-react'

export function ImportResultsPage({ app }: { app: ReturnType<typeof useAppState> }) {
  const swimmer = app.activeSwimmer
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [conflictAction, setConflictAction] = useState<ConflictAction>('skip')
  const [imported, setImported] = useState<{ added: number; updated: number; skipped: number } | null>(null)

  if (!swimmer) return null

  const existing = app.state.results.filter((r) => r.swimmerId === swimmer.id)
  const validCount = rows.filter((r) => r.status === 'valid').length
  const conflictCount = rows.filter((r) => r.status === 'conflict').length
  const invalidCount = rows.filter((r) => r.status === 'invalid').length

  const handleFile = async (file: File) => {
    setParseError('')
    setImported(null)
    try {
      const text = await file.text()
      const parsed = parseImportFile(text, file.name, existing, swimmer.id)
      if (parsed.length === 0) {
        setParseError('No data rows found. Use the CSV template or a JSON array of results.')
        setRows([])
        setFileName('')
        return
      }
      setRows(parsed)
      setFileName(file.name)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file')
      setRows([])
      setFileName('')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const runImport = () => {
    const importable = rows.filter((r) => r.status === 'valid' || r.status === 'conflict')
    if (importable.length === 0) return

    const result = app.importResults(
      swimmer.id,
      importable.map((r) => ({
        date: r.date,
        event: r.event,
        timeSeconds: r.timeSeconds,
        meet: r.meet,
        poolType: r.poolType,
        existingResultId: r.existingResultId,
        status: r.status,
      })),
      conflictAction
    )
    setImported(result)
    setRows([])
    setFileName('')
  }

  const statusBadge = (status: ParsedImportRow['status']) => {
    if (status === 'valid') {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> New
        </span>
      )
    }
    if (status === 'conflict') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5" /> Duplicate
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5" /> Error
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Import Results</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload a CSV or JSON file to bulk-add meet results for {swimmer.name}. Matches on date, event, pool, and
          meet name.
        </p>
      </div>

      {swimmer.usasId && (
        <div className="card p-4 flex items-start gap-3 bg-pool-500/5 border-pool-500/20">
          <FileUp className="w-5 h-5 text-pool-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">USA Swimming ID: {swimmer.usasId}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct sync from USA Swimming Data Hub is coming soon. For now, export from SwimCloud or your meet
              software and import here.
            </p>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={onFileChange} />
          <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Choose file
          </button>
          <button type="button" className="btn-secondary" onClick={downloadCsvTemplate}>
            <Download className="w-4 h-4" />
            Download CSV template
          </button>
        </div>
        <p className="text-xs text-slate-500">
          CSV columns: <code className="text-pool-600">date</code>, <code className="text-pool-600">event</code>,{' '}
          <code className="text-pool-600">time</code>, <code className="text-pool-600">meet</code>,{' '}
          <code className="text-pool-600">pool</code> (SCY or LCM). Events accept labels like &quot;100 Freestyle&quot;
          or ids like <code className="text-pool-600">100-free</code>.
        </p>
        {parseError && <p className="text-red-500 text-sm">{parseError}</p>}
        {fileName && rows.length > 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loaded <span className="font-medium">{fileName}</span> — {validCount} new, {conflictCount} duplicates,{' '}
            {invalidCount} errors
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <>
          {conflictCount > 0 && (
            <div className="card p-4 space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">When a result already exists</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {(
                  [
                    ['skip', 'Skip duplicates'],
                    ['overwrite', 'Overwrite existing time'],
                    ['keep-both', 'Keep both'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="conflict"
                      checked={conflictAction === value}
                      onChange={() => setConflictAction(value)}
                      className="text-pool-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-3">Row</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Meet</th>
                    <th className="p-3">Pool</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rowIndex} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-3 text-slate-400">{r.rowIndex}</td>
                      <td className="p-3">
                        {statusBadge(r.status)}
                        {r.error && <p className="text-xs text-red-400 mt-0.5">{r.error}</p>}
                      </td>
                      <td className="p-3">{r.date || '—'}</td>
                      <td className="p-3">{r.event ? getEventLabel(r.event) : '—'}</td>
                      <td className="p-3 font-mono">{r.timeSeconds > 0 ? formatSwimTime(r.timeSeconds) : '—'}</td>
                      <td className="p-3">{r.meet || '—'}</td>
                      <td className="p-3">{r.poolType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={validCount + conflictCount === 0}
            onClick={runImport}
          >
            Import {validCount + conflictCount} result{validCount + conflictCount === 1 ? '' : 's'}
          </button>
        </>
      )}

      {imported && (
        <div className="card p-4 bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 text-sm">
          Import complete — {imported.added} added, {imported.updated} updated, {imported.skipped} skipped. PRs
          recalculated automatically.
        </div>
      )}
    </div>
  )
}