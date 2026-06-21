import type { Stroke } from '../types'

export interface TechniqueQuestion {
  id: string
  question: string
  options: { value: string; label: string }[]
}

export interface TechniqueTip {
  title: string
  body: string
  links: { label: string; url: string }[]
}

const QUESTIONS: Record<Stroke, TechniqueQuestion[]> = {
  freestyle: [
    {
      id: 'breathing',
      question: 'Breathing pattern in races?',
      options: [
        { value: 'every2', label: 'Every 2 strokes' },
        { value: 'every3', label: 'Every 3 strokes' },
        { value: 'bilateral', label: 'Bilateral (every 3, both sides)' },
        { value: 'variable', label: 'Varies by distance' },
      ],
    },
    {
      id: 'catch',
      question: 'How does the catch feel at entry?',
      options: [
        { value: 'high-elbow', label: 'High elbow, early vertical forearm' },
        { value: 'straight', label: 'Somewhat straight arm' },
        { value: 'crossover', label: 'Hand crosses midline' },
        { value: 'unsure', label: 'Not sure' },
      ],
    },
    {
      id: 'kick',
      question: 'Kick engagement from the hips?',
      options: [
        { value: 'strong', label: 'Strong, steady 6-beat' },
        { value: 'moderate', label: 'Moderate, saves legs' },
        { value: 'weak', label: 'Weak / knees bend' },
        { value: 'two-beat', label: 'Minimal 2-beat' },
      ],
    },
  ],
  backstroke: [
    {
      id: 'head',
      question: 'Head position during swim?',
      options: [
        { value: 'still', label: 'Still, eyes up slightly' },
        { value: 'moving', label: 'Moves side to side' },
        { value: 'chin-tucked', label: 'Chin tucked too far' },
      ],
    },
    {
      id: 'rotation',
      question: 'Body rotation per stroke?',
      options: [
        { value: 'full', label: 'Full shoulder rotation' },
        { value: 'flat', label: 'Mostly flat' },
        { value: 'over-rotate', label: 'Over-rotates past 45°' },
      ],
    },
    {
      id: 'kick',
      question: 'Kick tempo and depth?',
      options: [
        { value: 'steady', label: 'Steady, near surface' },
        { value: 'deep', label: 'Deep, wide kick' },
        { value: 'inconsistent', label: 'Inconsistent' },
      ],
    },
  ],
  breaststroke: [
    {
      id: 'pullout',
      question: 'Pullout and breakout timing?',
      options: [
        { value: 'strong', label: 'Long glide, strong kick' },
        { value: 'short', label: 'Short glide' },
        { value: 'late-kick', label: 'Kick comes late' },
      ],
    },
    {
      id: 'kick',
      question: 'Kick width and snap?',
      options: [
        { value: 'narrow', label: 'Narrow, fast snap' },
        { value: 'wide', label: 'Wide kick' },
        { value: 'asymmetric', label: 'One foot turns out' },
      ],
    },
    {
      id: 'timing',
      question: 'Pull-breathe-kick-glide timing?',
      options: [
        { value: 'connected', label: 'Connected, minimal pause' },
        { value: 'long-glide', label: 'Long glide between cycles' },
        { value: 'rushed', label: 'Rushed recovery' },
      ],
    },
  ],
  butterfly: [
    {
      id: 'chin',
      question: 'Chin position on breath?',
      options: [
        { value: 'forward', label: 'Chin forward, low profile' },
        { value: 'up', label: 'Chin lifts high' },
        { value: 'late', label: 'Breath comes late' },
      ],
    },
    {
      id: 'kick-timing',
      question: 'Two-beat kick timing?',
      options: [
        { value: 'synced', label: 'Synced with arm entry & exit' },
        { value: 'late', label: 'Second kick delayed' },
        { value: 'single', label: 'Mostly single kick' },
      ],
    },
    {
      id: 'recovery',
      question: 'Arm recovery path?',
      options: [
        { value: 'low', label: 'Low recovery over water' },
        { value: 'high', label: 'High recovery' },
        { value: 'wide', label: 'Wide entry' },
      ],
    },
  ],
  im: [
    {
      id: 'transitions',
      question: 'Turn transitions between strokes?',
      options: [
        { value: 'smooth', label: 'Smooth, no pause' },
        { value: 'slow', label: 'Lose momentum on walls' },
        { value: 'fly-back', label: 'Struggle fly→back' },
      ],
    },
    {
      id: 'pacing',
      question: 'Pacing strategy?',
      options: [
        { value: 'negative', label: 'Negative split legs' },
        { value: 'even', label: 'Even splits' },
        { value: 'front', label: 'Go out fast' },
      ],
    },
    {
      id: 'weakest',
      question: 'Weakest leg typically?',
      options: [
        { value: 'fly', label: 'Butterfly' },
        { value: 'back', label: 'Backstroke' },
        { value: 'breast', label: 'Breaststroke' },
        { value: 'free', label: 'Freestyle' },
      ],
    },
  ],
  relay: [
    {
      id: 'exchange',
      question: 'Exchange timing?',
      options: [
        { value: 'tight', label: 'Tight, legal exchanges' },
        { value: 'early', label: 'Leaves early sometimes' },
        { value: 'late', label: 'Late takeoffs' },
      ],
    },
    {
      id: 'leadoff',
      question: 'Lead-off strategy?',
      options: [
        { value: 'race', label: 'Full race effort' },
        { value: 'controlled', label: 'Controlled build' },
      ],
    },
  ],
}

export function getTechniqueQuestions(stroke: Stroke): TechniqueQuestion[] {
  return QUESTIONS[stroke] ?? QUESTIONS.freestyle
}

export function generateTechniqueTips(
  stroke: Stroke,
  answers: Record<string, string>
): TechniqueTip[] {
  const tips: TechniqueTip[] = []
  const baseLinks = [
    { label: 'USA Swimming Technique', url: 'https://www.usaswimming.org' },
    { label: 'SwimSwam Training', url: 'https://swimswam.com' },
    { label: 'YouTube — Effortless Swimming', url: 'https://www.youtube.com/c/EffortlessSwimming' },
  ]

  if (stroke === 'freestyle') {
    if (answers.catch === 'crossover' || answers.catch === 'straight') {
      tips.push({
        title: 'Improve your catch',
        body: 'Focus on entering hand in line with shoulder, then bending elbow early for a vertical forearm. Drill: catch-up drill with snorkel, 6×50.',
        links: baseLinks,
      })
    }
    if (answers.kick === 'weak') {
      tips.push({
        title: 'Hip-driven kick',
        body: 'Kick from hips with slight knee bend. Add 4×25 vertical kick and 6×50 kickboard sets 2× per week.',
        links: baseLinks,
      })
    }
  }

  if (stroke === 'butterfly') {
    if (answers.chin === 'up' || answers.chin === 'late') {
      tips.push({
        title: 'Lower breath profile',
        body: 'Keep chin near water surface — breathe forward, not up. Practice 6×25 fly with one goggle in water.',
        links: [
          ...baseLinks,
          { label: 'YouTube — Butterfly breathing', url: 'https://www.youtube.com/results?search_query=butterfly+breathing+drill' },
        ],
      })
    }
    if (answers['kick-timing'] === 'late' || answers['kick-timing'] === 'single') {
      tips.push({
        title: 'Two-beat kick timing',
        body: 'First kick on hand entry, second (stronger) kick as hands exit. Drill: 8×25 fly kick on back with tempo trainer.',
        links: baseLinks,
      })
    }
  }

  if (stroke === 'breaststroke') {
    if (answers.timing === 'rushed' || answers.kick === 'wide') {
      tips.push({
        title: 'Connect pull-kick-glide',
        body: 'Finish pull → breathe → snap narrow kick → glide 1 count. Drill: 2 kicks / 1 pull sequence, 8×50.',
        links: baseLinks,
      })
    }
  }

  if (stroke === 'backstroke') {
    if (answers.head === 'moving') {
      tips.push({
        title: 'Stable head position',
        body: 'Keep head still, eyes at ceiling. Rotate from hips and shoulders together. Drill: cup-on-forehead balance 6×25.',
        links: baseLinks,
      })
    }
  }

  if (stroke === 'im') {
    if (answers.weakest) {
      tips.push({
        title: `Build the ${answers.weakest} leg`,
        body: `Add 200–400m weekly of ${answers.weakest}-specific skill work. In IM sets, practice race-pace transitions on the weakest leg.`,
        links: baseLinks,
      })
    }
  }

  if (tips.length === 0) {
    tips.push({
      title: 'Solid fundamentals',
      body: 'Technique responses look balanced. Maintain video feedback every 2–3 weeks and race-pace test sets before championship meets.',
      links: baseLinks,
    })
  }

  return tips
}