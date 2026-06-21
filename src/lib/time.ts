/** Parse mm:ss.xx or ss.xx into seconds */
export function parseSwimTime(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split(':')
  if (parts.length === 1) {
    const sec = parseFloat(parts[0])
    return isNaN(sec) ? null : sec
  }
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10)
    const sec = parseFloat(parts[1])
    if (isNaN(min) || isNaN(sec)) return null
    return min * 60 + sec
  }
  return null
}

export function formatSwimTime(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(2)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(2).padStart(5, '0')}`
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatChartDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  })
}

export function toDateMs(iso: string): number {
  return new Date(iso + 'T12:00:00').getTime()
}