export type SymptomCategory = 'Flow' | 'Mood' | 'Physical' | 'Other'

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
