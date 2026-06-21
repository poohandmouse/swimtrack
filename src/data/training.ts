import type { TrainingSet, TrainingStrokeType } from '../types'

export const TRAINING_STROKES: { id: TrainingStrokeType; label: string; short: string }[] = [
  { id: 'freestyle', label: 'Freestyle', short: 'Free' },
  { id: 'backstroke', label: 'Backstroke', short: 'Back' },
  { id: 'breaststroke', label: 'Breaststroke', short: 'Breast' },
  { id: 'butterfly', label: 'Butterfly', short: 'Fly' },
  { id: 'im', label: 'Individual Medley', short: 'IM' },
  { id: 'kick', label: 'Kick', short: 'Kick' },
  { id: 'pull', label: 'Pull', short: 'Pull' },
  { id: 'drill', label: 'Drill', short: 'Drill' },
  { id: 'other', label: 'Other', short: 'Other' },
]

export const DISTANCE_PRESETS = [25, 50, 75, 100, 150, 200, 300, 400, 500, 800, 1000, 1650]

export const REP_PRESETS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20]

export const SESSION_NAME_PRESETS = [
  'Morning Practice',
  'Afternoon Practice',
  'Evening Practice',
  'Distance Free',
  'Sprint & Race Pace',
  'Technique & Drills',
  'Kick & Underwaters',
  'Recovery Swim',
]

export const UNDERWATER_PRESETS = ['', '5y', '10y', '15y', '25y', '10m', '15m', '25m']

export const DRILL_STROKES: TrainingStrokeType[] = ['kick', 'pull', 'drill']

export function getStrokeLabel(stroke: TrainingStrokeType): string {
  return TRAINING_STROKES.find((s) => s.id === stroke)?.label ?? stroke
}

export function getStrokeShort(stroke: TrainingStrokeType): string {
  return TRAINING_STROKES.find((s) => s.id === stroke)?.short ?? stroke
}

export function createEmptySet(): Omit<TrainingSet, 'id'> {
  return {
    stroke: 'freestyle',
    distance: 100,
    reps: 1,
    timeSeconds: null,
    withDolphinKick: false,
    underwaterDistance: '',
    rpe: null,
    strokeCount: null,
    notes: '',
  }
}

export interface SetPreset {
  label: string
  stroke: TrainingStrokeType
  reps: number
  distance: number
  withDolphinKick?: boolean
}

export const SET_PRESETS: SetPreset[] = [
  { label: '4×100 Free', stroke: 'freestyle', reps: 4, distance: 100 },
  { label: '8×50 Free', stroke: 'freestyle', reps: 8, distance: 50 },
  { label: '4×200 Free', stroke: 'freestyle', reps: 4, distance: 200 },
  { label: '6×100 Kick', stroke: 'kick', reps: 6, distance: 100 },
  { label: '4×50 Fly', stroke: 'butterfly', reps: 4, distance: 50 },
  { label: '200 IM', stroke: 'im', reps: 1, distance: 200 },
  { label: 'UW 25y Kick', stroke: 'kick', reps: 4, distance: 25, withDolphinKick: true },
]