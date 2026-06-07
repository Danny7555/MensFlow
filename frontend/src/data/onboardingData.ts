
export type OnboardingQuestion = {
  id: string
  question: string
  description?: string
  type: 'single-choice' | 'multi-choice' | 'input' | 'intro'
  options?: { label: string; value: string }[]
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
    id: 'age_group',
    question: 'What age group are you in?',
    description: 'This helps us tailor age-appropriate content.',
    type: 'single-choice',
    options: [
      { label: 'Under 13', value: 'under_13' },
      { label: '13–17', value: '13_17' },
      { label: '18–24', value: '18_24' },
      { label: '25–34', value: '25_34' },
      { label: '35+', value: '35_plus' },
    ],
  },
  {
    id: 'purpose',
    question: 'What do you need MensFlow for?',
    description: 'We will personalize your experience based on your needs.',
    type: 'single-choice',
    options: [
      { label: 'To help me track my period', value: 'track_period' },
      { label: 'For educational purpose only', value: 'education' },
    ],
  },
  {
    id: 'cycle_regularity',
    question: 'What best describes your menstrual cycle?',
    description: 'This helps us understand your cycle pattern.',
    type: 'single-choice',
    options: [
      { label: 'Very regular', value: 'very_regular' },
      { label: 'Mostly regular', value: 'mostly_regular' },
      { label: 'Irregular', value: 'irregular' },
      { label: 'I just started menstruating', value: 'just_started' },
    ],
  },
  {
    id: 'cycle_length',
    question: 'What is your typical cycle length?',
    description: 'From the first day of one period to the first day of the next.',
    type: 'single-choice',
    options: [
      { label: 'Less than 24 days', value: 'less_24' },
      { label: '24–28 days', value: '24_28' },
      { label: '29–35 days', value: '29_35' },
      { label: 'More than 35 days', value: 'more_35' },
    ],
  },
  {
    id: 'flow_description',
    question: 'How would you describe your menstrual flow?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'Light', value: 'light' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'Heavy', value: 'heavy' },
      { label: 'Varies from cycle to cycle', value: 'varies' },
    ],
  },
  {
    id: 'period_impact',
    question: 'How much does your period affect your daily activities?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'Not at all', value: 'not_at_all' },
      { label: 'Slightly', value: 'slightly' },
      { label: 'Moderately', value: 'moderately' },
      { label: 'Significantly', value: 'significantly' },
    ],
  },
  {
    id: 'tracking_goal',
    question: 'What is your main goal for tracking your cycle?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'Predict my next period', value: 'predict_period' },
      { label: 'Understand my symptoms', value: 'understand_symptoms' },
      { label: 'Monitor my cycle health', value: 'monitor_health' },
      { label: 'Learn more about my body', value: 'learn_body' },
    ],
  },
  {
    id: 'education_purpose',
    question: 'What is the purpose of your visit today?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'Learn about menstrual health', value: 'learn_menstrual' },
      { label: 'Support someone who menstruates', value: 'support_someone' },
      { label: 'School or academic research', value: 'academic_research' },
      { label: 'General health education', value: 'general_education' },
    ],
  },
  {
    id: 'knowledge_level',
    question: 'How would you rate your knowledge on menstrual health?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'Beginner', value: 'beginner' },
      { label: 'Basic understanding', value: 'basic' },
      { label: 'Intermediate', value: 'intermediate' },
      { label: 'Advanced', value: 'advanced' },
    ],
  },
  {
    id: 'recommendation_topics',
    question: 'Which of these topics would you like personalized recommendations for?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'Menstrual cycle basics', value: 'cycle_basics' },
      { label: 'Period hygiene and care', value: 'hygiene' },
      { label: 'Reproductive health', value: 'reproductive_health' },
      { label: 'Hormones and body changes', value: 'hormones' },
    ],
  },
  {
    id: 'learning_preference',
    question: 'How do you prefer to learn?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'AI conversations', value: 'ai_conversations' },
      { label: 'Short articles and tips', value: 'articles' },
      { label: 'Videos and infographics', value: 'videos' },
      { label: 'Comprehensive guides', value: 'guides' },
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
    id: 'referral_source',
    question: 'How did you hear about MensFlow?',
    description: '',
    type: 'single-choice',
    options: [
      { label: 'Social Media', value: 'social_media' },
      { label: 'Friend or Family', value: 'friend_family' },
      { label: 'School or Healthcare Provider', value: 'school_healthcare' },
      { label: 'Online Search (Google, Bing, etc.)', value: 'online_search' },
    ],
  },
]
