import { SWIM_EVENTS } from '../data/events'
import { parseSwimTime } from '../lib/time'
import type { PoolType, SwimResult } from '../types'

export type ConflictAction = 'overwrite' | 'skip' | 'keep-both'
export type ImportRowStatus = 'valid' | 'invalid' | 'conflict'

export interface ParsedImportRow {
  rowIndex: number
  date: string
  event: string
  timeSeconds: number
  meet: string
  poolType: PoolType
  status: ImportRowStatus
  error?: string
  existingResultId?: string
}

const EVENT_ALIASES: Record<string, string> = {}
for (const ev of SWIM_EVENTS) {
  EVENT_ALIASES[ev.id] = ev.id
  EVENT_ALIASES[ev.id.toLowerCase()] = ev.id
  EVENT_ALIASES[ev.label.toLowerCase()] = ev.id
  const short = ev.label
    .replace(/Freestyle/gi, 'Free')
    .replace(/Backstroke/gi, 'Back')
    .replace(/Breaststroke/gi, 'Breast')
    .replace(/Butterfly/gi, 'Fly')
    .replace(/Individual Medley/gi, 'IM')
  EVENT_ALIASES[short.toLowerCase()] = ev.id
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

const COLUMN_MAP: Record<string, string> = {
  date: 'date',
  meetdate: 'date',
  event: 'event',
  stroke: 'event',
  distance: 'distance',
  time: 'time',
  swimtime: 'time',
  result: 'time',
  meet: 'meet',
  meetname: 'meet',
  competition: 'meet',
  pool: 'pool',
  pooltype: 'pool',
  course: 'pool',
}

export function resolveEventId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (EVENT_ALIASES[lower]) return EVENT_ALIASES[lower]
  const compact = lower.replace(/[^a-z0-9]/g, '')
  for (const [alias, id] of Object.entries(EVENT_ALIASES)) {
    if (alias.replace(/[^a-z0-9]/g, '') === compact) return id
  }
  const distMatch = trimmed.match(/(\d+)\s*(free|fr|back|bk|breast|br|fly|butterfly|im|medley)/i)
  if (distMatch) {
    const dist = distMatch[1]
    const stroke = distMatch[2].toLowerCase()
    const strokeMap: Record<string, string> = {
      free: 'free',
      fr: 'free',
      back: 'back',
      bk: 'back',
      breast: 'breast',
      br: 'breast',
      fly: 'fly',
      butterfly: 'fly',
      im: 'im',
      medley: 'im',
    }
    const suffix = strokeMap[stroke]
    if (suffix) {
      const id = `${dist}-${suffix}`
      if (EVENT_ALIASES[id]) return EVENT_ALIASES[id]
    }
  }
  return null
}

function parsePoolType(raw: string): PoolType | null {
  const v = raw.trim().toUpperCase()
  if (v === 'SCY' || v === 'SHORT' || v === 'SHORT COURSE' || v === 'Y' || v === 'YARDS') return 'SCY'
  if (v === 'LCM' || v === 'LONG' || v === 'LONG COURSE' || v === 'M' || v === 'METERS' || v === 'LC') return 'LCM'
  return null
}

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3]
    const month = slash[1].padStart(2, '0')
    const day = slash[2].padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return null
}

function mapRow(raw: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const field = COLUMN_MAP[normalizeKey(key)]
    if (field) mapped[field] = value
  }
  return mapped
}

function parseRecord(
  raw: Record<string, string>,
  rowIndex: number,
  existing: SwimResult[],
  swimmerId: string
): ParsedImportRow {
  const row = mapRow(raw)
  const date = normalizeDate(row.date ?? '')
  const event = resolveEventId(row.event ?? '')
  const timeSeconds = parseSwimTime(row.time ?? '')
  const meet = (row.meet ?? '').trim()
  const poolType = parsePoolType(row.pool ?? 'SCY') ?? (row.pool ? null : 'SCY')

  if (!date) {
    return {
      rowIndex,
      date: '',
      event: row.event ?? '',
      timeSeconds: 0,
      meet,
      poolType: 'SCY',
      status: 'invalid',
      error: 'Invalid or missing date',
    }
  }
  if (!event) {
    return {
      rowIndex,
      date,
      event: row.event ?? '',
      timeSeconds: 0,
      meet,
      poolType: poolType ?? 'SCY',
      status: 'invalid',
      error: `Unknown event: ${row.event || '(empty)'}`,
    }
  }
  if (timeSeconds === null || timeSeconds <= 0) {
    return {
      rowIndex,
      date,
      event,
      timeSeconds: 0,
      meet,
      poolType: poolType ?? 'SCY',
      status: 'invalid',
      error: 'Invalid or missing time',
    }
  }
  if (!meet) {
    return {
      rowIndex,
      date,
      event,
      timeSeconds,
      meet: '',
      poolType: poolType ?? 'SCY',
      status: 'invalid',
      error: 'Missing meet name',
    }
  }
  if (!poolType) {
    return {
      rowIndex,
      date,
      event,
      timeSeconds,
      meet,
      poolType: 'SCY',
      status: 'invalid',
      error: `Unknown pool type: ${row.pool}`,
    }
  }

  const conflict = existing.find(
    (r) =>
      r.swimmerId === swimmerId &&
      r.date === date &&
      r.event === event &&
      r.poolType === poolType &&
      r.meet.toLowerCase() === meet.toLowerCase()
  )

  return {
    rowIndex,
    date,
    event,
    timeSeconds,
    meet,
    poolType,
    status: conflict ? 'conflict' : 'valid',
    existingResultId: conflict?.id,
  }
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const parseLine = (line: string): string[] => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = parseLine(line).map((v) => v.replace(/^"|"$/g, ''))
    const record: Record<string, string> = {}
    headers.forEach((h, i) => {
      record[h] = values[i] ?? ''
    })
    return record
  })
}

export function parseJsonImport(text: string): Record<string, string>[] {
  const data = JSON.parse(text) as unknown
  const rows = Array.isArray(data) ? data : (data as { results?: unknown }).results
  if (!Array.isArray(rows)) throw new Error('JSON must be an array or { results: [...] }')

  return rows.map((item) => {
    if (typeof item !== 'object' || item === null) return {}
    const record: Record<string, string> = {}
    for (const [key, value] of Object.entries(item)) {
      record[key] = value == null ? '' : String(value)
    }
    return record
  })
}

export function parseImportFile(
  text: string,
  filename: string,
  existing: SwimResult[],
  swimmerId: string
): ParsedImportRow[] {
  const lower = filename.toLowerCase()
  let records: Record<string, string>[]
  if (lower.endsWith('.json')) {
    records = parseJsonImport(text)
  } else {
    records = parseCsv(text)
  }
  return records.map((record, i) => parseRecord(record, i + 2, existing, swimmerId))
}

export const CSV_TEMPLATE = `date,event,time,meet,pool
2025-03-15,50 Freestyle,24.50,State Championships,SCY
2025-03-15,100 Freestyle,52.34,State Championships,SCY
2025-04-02,200 IM,2:15.80,Spring Invite,LCM`

export function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'swimtrack-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}