import type { Stroke } from '../types'

export interface SwimEvent {
  id: string
  label: string
  stroke: Stroke
  distance: number
}

export const SWIM_EVENTS: SwimEvent[] = [
  { id: '50-free', label: '50 Freestyle', stroke: 'freestyle', distance: 50 },
  { id: '100-free', label: '100 Freestyle', stroke: 'freestyle', distance: 100 },
  { id: '200-free', label: '200 Freestyle', stroke: 'freestyle', distance: 200 },
  { id: '500-free', label: '500 Freestyle', stroke: 'freestyle', distance: 500 },
  { id: '1000-free', label: '1000 Freestyle', stroke: 'freestyle', distance: 1000 },
  { id: '1650-free', label: '1650 Freestyle', stroke: 'freestyle', distance: 1650 },
  { id: '50-back', label: '50 Backstroke', stroke: 'backstroke', distance: 50 },
  { id: '100-back', label: '100 Backstroke', stroke: 'backstroke', distance: 100 },
  { id: '200-back', label: '200 Backstroke', stroke: 'backstroke', distance: 200 },
  { id: '50-breast', label: '50 Breaststroke', stroke: 'breaststroke', distance: 50 },
  { id: '100-breast', label: '100 Breaststroke', stroke: 'breaststroke', distance: 100 },
  { id: '200-breast', label: '200 Breaststroke', stroke: 'breaststroke', distance: 200 },
  { id: '50-fly', label: '50 Butterfly', stroke: 'butterfly', distance: 50 },
  { id: '100-fly', label: '100 Butterfly', stroke: 'butterfly', distance: 100 },
  { id: '200-fly', label: '200 Butterfly', stroke: 'butterfly', distance: 200 },
  { id: '200-im', label: '200 Individual Medley', stroke: 'im', distance: 200 },
  { id: '400-im', label: '400 Individual Medley', stroke: 'im', distance: 400 },
  { id: '4x50-free', label: '4x50 Freestyle Relay', stroke: 'relay', distance: 200 },
  { id: '4x100-free', label: '4x100 Freestyle Relay', stroke: 'relay', distance: 400 },
  { id: '4x200-free', label: '4x200 Freestyle Relay', stroke: 'relay', distance: 800 },
  { id: '4x50-medley', label: '4x50 Medley Relay', stroke: 'relay', distance: 200 },
  { id: '4x100-medley', label: '4x100 Medley Relay', stroke: 'relay', distance: 400 },
  { id: '4x200-medley', label: '4x200 Medley Relay', stroke: 'relay', distance: 800 },
]

export function getEventLabel(id: string): string {
  return SWIM_EVENTS.find((e) => e.id === id)?.label ?? id
}

export function getEventStroke(id: string): Stroke {
  return SWIM_EVENTS.find((e) => e.id === id)?.stroke ?? 'freestyle'
}