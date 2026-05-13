
export type OnboardingQuestion = {
  id: string
  question: string
  description?: string
  type: 'single-choice' | 'multi-choice' | 'input' | 'intro'
  options?: { label: string; value: string; icon?: React.ReactNode }[]
  placeholder?: string
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'intro',
    question: 'Got it! Achieve your goals faster with MensFlow’s tailored program',
    description: 'We’ll ask you a few more questions about your goals, and if it’s OK with you, we’ll use your answers to show you content to help you achieve them. Find out more in our Privacy Policy.',
    type: 'intro',
  },
  {
    id: 'goal',
    question: 'What is your main goal?',
    description: 'We will personalize your experience based on your selection.',
    type: 'single-choice',
    options: [
      { label: 'Track my cycle', value: 'track', icon: 'calendar' },
      { label: 'Improve health habits', value: 'health', icon: 'heart' },
      { label: 'Monitor symptoms', value: 'symptoms', icon: 'brain' },
      { label: 'Learn about wellness', value: 'learn', icon: 'lightbulb' },
    ],
  },
  {
    id: 'cycle_regularity',
    question: 'Is your cycle regular?',
    type: 'single-choice',
    options: [
      { label: 'Yes, like clockwork', value: 'regular' },
      { label: 'Mostly regular', value: 'mostly' },
      { label: 'Irregular', value: 'irregular' },
      { label: 'I don\'t know yet', value: 'unknown' },
    ],
  },
  {
    id: 'symptoms',
    question: 'Do you experience any of these regularly?',
    description: 'Select all that apply.',
    type: 'multi-choice',
    options: [
      { label: 'Cramps', value: 'cramps' },
      { label: 'Bloating', value: 'bloating' },
      { label: 'Mood swings', value: 'mood' },
      { label: 'Fatigue', value: 'fatigue' },
      { label: 'Headaches', value: 'headaches' },
      { label: 'None of the above', value: 'none' },
    ],
  },
  {
    id: 'activity_level',
    question: 'How active are you?',
    type: 'single-choice',
    options: [
      { label: 'Sedentary', value: 'sedentary' },
      { label: 'Lightly active', value: 'light' },
      { label: 'Moderately active', value: 'moderate' },
      { label: 'Very active', value: 'active' },
    ],
  },
  {
    id: 'name',
    question: 'What should we call you?',
    description: 'Your name will be used to personalize your dashboard.',
    type: 'input',
    placeholder: 'Enter your name',
  },
]
