
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
    id: 'role',
    question: 'Choose your role',
    description: 'Are you tracking your own cycle or supporting a partner?',
    type: 'single-choice',
    options: [
      { label: "I'm tracking my own cycle", value: 'lady', img: '/images/lady.png' },
      { label: "I'm supporting my partner", value: 'partner', img: '/images/calm.jpg' },
    ],
  },
  {
    id: 'partner_code',
    question: "Enter your partner's code",
    description: "Got a pairing code from your partner? Enter it here to pair instantly, or leave blank to connect later.",
    type: 'input',
    placeholder: 'e.g. XY82HA',
  },
  {
    id: 'goal',
    question: 'Your main goal?',
    description: 'We will personalize your experience.',
    type: 'single-choice',
    options: [
      { label: 'Track energy', value: 'track', img: '/images/cal.png' },
      { label: 'Build habits', value: 'health', img: '/images/calm.jpg' },
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
  {
    id: 'access_level',
    question: 'Choose your access level',
    description: 'Select how you want to use the platform.',
    type: 'single-choice',
    options: [
      { label: 'Full Access (All features)', value: 'full' },
      { label: 'Educational Access (Learn & Chat only)', value: 'educational' },
    ],
  },
]
