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

export const CYCLE_LENGTH_HISTORY_6M = [
  { month: 'Jan', length: 28, average: 29 },
  { month: 'Feb', length: 27, average: 29 },
  { month: 'Mar', length: 29, average: 29 },
  { month: 'Apr', length: 31, average: 29 },
  { month: 'May', length: 28, average: 29 },
  { month: 'Jun', length: 30, average: 29 },
]
