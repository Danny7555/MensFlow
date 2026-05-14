
export type OnboardingQuestion = {
  id: string
  question: string
  description?: string
  type: 'single-choice' | 'multi-choice' | 'input' | 'intro'
  options?: { label: string; value: string; icon?: React.ReactNode; img?: string }[]
  placeholder?: string
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'intro',
    question: 'Tailor your MensFlow program',
    description: 'Answer a few quick questions to personalize your insights.',
    type: 'intro',
  },
  {
    id: 'goal',
    question: 'Your main goal?',
    description: 'We will personalize your experience.',
    type: 'single-choice',
    options: [
      { label: 'Track energy', value: 'track', img: '/images/cal.png' },
      { label: 'Build habits', value: 'health', img: '/images/heart.png' },
      { label: 'Monitor mood', value: 'symptoms', img: '/images/brain.png' },
      { label: 'Learn wellness', value: 'learn', img: '/images/flow.jpg' },
    ],
  },
  {
    id: 'energy_consistency',
    question: 'Energy levels?',
    description: 'Helps us find your natural rhythm.',
    type: 'single-choice',
    options: [
      { label: 'Very consistent', value: 'regular' },
      { label: 'Mostly stable', value: 'mostly' },
      { label: 'Unpredictable', value: 'irregular' },
      { label: 'Not sure', value: 'unknown' },
    ],
  },
  {
    id: 'symptoms',
    question: 'Regular challenges?',
    description: 'Select all that apply',
    type: 'multi-choice',
    options: [
      { label: 'Low energy', value: 'fatigue' },
      { label: 'Brain fog', value: 'fog' },
      { label: 'High stress', value: 'stress' },
      { label: 'Mood swings', value: 'mood' },
      { label: 'Poor sleep', value: 'sleep' },
      { label: 'None', value: 'none' },
    ],
  },
  {
    id: 'activity_level',
    question: 'Activity level?',
    description: 'Your average weekly activity.',
    type: 'single-choice',
    options: [
      { label: 'Sedentary', value: 'sedentary' },
      { label: 'Light', value: 'light' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'High', value: 'active' },
    ],
  },
  {
    id: 'name',
    question: 'Your name?',
    description: 'To customize your dashboard.',
    type: 'input',
    placeholder: 'First name',
  },
]
