import { getAgeGroup, type AgeGroup, type BenchmarkComparisonParams } from './benchmarks'
import { getStateName } from './states'
import type { Gender } from '../types'

const FIRST_NAMES_F: string[] = [
  'Jane', 'Emma', 'Olivia', 'Sophia', 'Mia', 'Ava', 'Chloe', 'Lily', 'Grace', 'Ella',
  'Harper', 'Zoe', 'Nora', 'Ruby', 'Stella', 'Violet', 'Hazel', 'Claire', 'Paige', 'Brooke',
]
const FIRST_NAMES_M: string[] = [
  'James', 'Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Owen', 'Caleb', 'Ryan', 'Jack',
  'Henry', 'Leo', 'Nate', 'Cole', 'Dylan', 'Alex', 'Max', 'Tyler', 'Grant', 'Blake',
]
const LAST_NAMES: string[] = [
  'Doe', 'Chen', 'Martinez', 'Williams', 'Johnson', 'Patel', 'Anderson', 'Brooks', 'Nguyen', 'Foster',
  'Kim', 'Reed', 'Hayes', 'Morgan', 'Sullivan', 'Cooper', 'Bennett', 'Rivera', 'Campbell', 'Parker',
]
const NATIONAL_CLUBS: string[] = [
  'Carmel Swim Club', 'Bolles School Sharks', 'Nation\'s Capital Swim Club', 'Aquazot',
  'Mission Viejo Nadadores', 'SwimMAC Carolina', 'Razorback Aquatic Club', 'Sandpipers of Nevada',
  'North Baltimore Aquatic Club', 'Club Wolverine', 'Phoenix Swim Club', 'Unattached',
]

function seededIndex(seed: string, max: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i)
  return Math.abs(h) % max
}

/** State #1 athlete for a specific event */
export interface StateRival {
  id: string
  firstName: string
  lastName: string
  fullName: string
  stateCode: string
  stateName: string
  gender: Gender
  ageGroup: AgeGroup
  club: string
  eventId: string
}

/** National #1 athlete for a specific event */
export interface NationalTopSwimmer {
  id: string
  firstName: string
  lastName: string
  fullName: string
  gender: Gender
  ageGroup: AgeGroup
  club: string
  eventId: string
}

export function getStateRival(stateCode: string, params: BenchmarkComparisonParams): StateRival {
  const { gender, ageGroup, eventId } = params
  const seed = `${stateCode}-${gender}-${ageGroup}-${eventId}`
  const firstPool = gender === 'Female' ? FIRST_NAMES_F : FIRST_NAMES_M
  const firstName = firstPool[seededIndex(seed, firstPool.length)]
  const lastName = LAST_NAMES[seededIndex(seed + 'ln', LAST_NAMES.length)]
  const stateName = getStateName(stateCode)

  return {
    id: `state-top-${seed}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    stateCode,
    stateName,
    gender,
    ageGroup,
    club: `${stateName.split(' ')[0]} Aquatics`,
    eventId,
  }
}

export function getNationalTopSwimmer(gender: Gender, age: number, eventId: string): NationalTopSwimmer {
  const ageGroup = getAgeGroup(age)
  const seed = `national-${gender}-${ageGroup}-${eventId}`
  const firstPool = gender === 'Female' ? FIRST_NAMES_F : FIRST_NAMES_M
  const firstName = firstPool[seededIndex(seed, firstPool.length)]
  const lastName = LAST_NAMES[seededIndex(seed + 'ln', LAST_NAMES.length)]

  return {
    id: `national-top-${seed}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender,
    ageGroup,
    club: NATIONAL_CLUBS[seededIndex(seed + 'club', NATIONAL_CLUBS.length)],
    eventId,
  }
}