export type Gender = 'Male' | 'Female'
export type PoolType = 'SCY' | 'LCM'
export type Stroke = 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'im' | 'relay'

export interface Swimmer {
  id: string
  name: string
  age: number
  gender: Gender
  club: string
  state: string
  usasId?: string
  swimcloudId?: string
  createdAt: string
}

export interface SwimResult {
  id: string
  swimmerId: string
  date: string
  event: string
  timeSeconds: number
  meet: string
  poolType: PoolType
  isPR?: boolean
}

export interface Goal {
  id: string
  swimmerId: string
  event: string
  targetSeconds: number
  createdAt: string
}

export type TrainingStrokeType =
  | 'freestyle'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'im'
  | 'kick'
  | 'pull'
  | 'drill'
  | 'other'

export interface TrainingSet {
  id: string
  stroke: TrainingStrokeType
  distance: number
  reps: number
  timeSeconds: number | null
  withDolphinKick: boolean
  underwaterDistance: string
  rpe: number | null
  strokeCount: number | null
  notes: string
}

export interface TrainingSession {
  id: string
  swimmerId: string
  date: string
  sessionName: string
  sets: TrainingSet[]
  createdAt: string
}

/** @deprecated Legacy shape — migrated to TrainingSession on load */
export interface TrainingEntry {
  id: string
  swimmerId: string
  date: string
  notes: string
}

export interface AppState {
  swimmers: Swimmer[]
  activeSwimmerId: string | null
  results: SwimResult[]
  goals: Goal[]
  trainingSessions: TrainingSession[]
  theme: 'light' | 'dark'
}

export const STORAGE_KEY = 'swimtrack-v1'

export const EMPTY_STATE: AppState = {
  swimmers: [],
  activeSwimmerId: null,
  results: [],
  goals: [],
  trainingSessions: [],
  theme: 'light',
}