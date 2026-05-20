export type SymptomCategory = 'Flow' | 'Mood' | 'Physical' | 'Lifestyle' | 'Other'

export type SymptomDef = {
  id: string
  label: string
  category: SymptomCategory
}

export const SYMPTOM_DEFS: SymptomDef[] = [
  { id: 'flow-light', label: 'Light', category: 'Flow' },
  { id: 'flow-medium', label: 'Medium', category: 'Flow' },
  { id: 'flow-heavy', label: 'Heavy', category: 'Flow' },
  
  { id: 'mood-calm', label: 'Calm', category: 'Mood' },
  { id: 'mood-happy', label: 'Happy', category: 'Mood' },
  { id: 'mood-anxious', label: 'Anxious', category: 'Mood' },
  { id: 'mood-sad', label: 'Sad', category: 'Mood' },
  { id: 'mood-irritable', label: 'Irritable', category: 'Mood' },
  
  { id: 'phys-cramps', label: 'Cramps', category: 'Physical' },
  { id: 'phys-headache', label: 'Headache', category: 'Physical' },
  { id: 'phys-bloating', label: 'Bloating', category: 'Physical' },
  { id: 'phys-fatigue', label: 'Fatigue', category: 'Physical' },
  { id: 'phys-tender', label: 'Breast tenderness', category: 'Physical' },
  { id: 'phys-acne', label: 'Acne', category: 'Physical' },

  { id: 'life-sleep', label: 'Sleep Quality', category: 'Lifestyle' },
  { id: 'life-bbt', label: 'BBT Logged', category: 'Lifestyle' },
  { id: 'life-sex', label: 'Sexual Activity', category: 'Lifestyle' },
  { id: 'life-pill', label: 'Pill Taken', category: 'Lifestyle' },
]

// Dummy data for the Recharts AreaChart
// 'severity' could represent the aggregate intensity of symptoms logged that day (0-10 scale)
export const SYMPTOM_HISTORY_DUMMY = [
  { day: 'Mon', severity: 2 },
  { day: 'Tue', severity: 4 },
  { day: 'Wed', severity: 7 },
  { day: 'Thu', severity: 5 },
  { day: 'Fri', severity: 3 },
  { day: 'Sat', severity: 1 },
  { day: 'Sun', severity: 0 },
]

export const CYCLE_LENGTH_HISTORY_6M = [
  { month: 'Jan', length: 28, average: 29 },
  { month: 'Feb', length: 27, average: 29 },
  { month: 'Mar', length: 29, average: 29 },
  { month: 'Apr', length: 31, average: 29 },
  { month: 'May', length: 28, average: 29 },
  { month: 'Jun', length: 30, average: 29 },
]

export const SYMPTOM_HISTORY_6M = [
  { month: 'Jan', cramps: 7, moodSwings: 4, fatigue: 6 },
  { month: 'Feb', cramps: 8, moodSwings: 5, fatigue: 5 },
  { month: 'Mar', cramps: 5, moodSwings: 3, fatigue: 4 },
  { month: 'Apr', cramps: 6, moodSwings: 6, fatigue: 7 },
  { month: 'May', cramps: 4, moodSwings: 4, fatigue: 5 },
  { month: 'Jun', cramps: 5, moodSwings: 3, fatigue: 4 },
]
