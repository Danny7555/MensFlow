import { SYMPTOM_DEFS } from '../data/symptomsData'
import { getPhaseFromDay } from './cycleUtils'

export interface SymptomForecast {
  symptomId: string
  label: string
  phase: 'menstrual' | 'follicular' | 'fertile' | 'luteal'
  phaseLabel: string
  probability: number // 0 to 100
  confidence: 'Low' | 'Medium' | 'High'
  recommendation: string
}

// Map phase keys to human labels
const PHASE_LABELS = {
  menstrual: 'Menstrual Phase',
  follicular: 'Follicular Phase',
  fertile: 'Ovulatory Phase',
  luteal: 'Luteal Phase'
}

// Basic default recommendations for forecast symptoms
const RECS: Record<string, string> = {
  cramps: 'Apply heat therapy (hot water bottle) and prioritize light stretching/rest.',
  fatigue: 'Ensure 8+ hours of sleep, limit caffeine in the afternoon, and prioritize gentle movements.',
  bloating: 'Reduce sodium intake, drink peppermint tea, and enjoy smaller, frequent meals.',
  headache: 'Stay hydrated, limit screen time, and try diffusing lavender or peppermint essential oils.',
  mood: 'Practice mindfulness or journaling, and share how you feel with supportive friends or partner.',
  backache: 'Use a foam roller or heating pad, and focus on gentle lower back stretches.',
  pelvicpain: 'Rest with feet elevated, practice deep diaphragmatic breathing, and avoid heavy lifting.',
  insomnia: 'Optimize your bedroom temperature, avoid screens 1 hour before bed, and drink chamomile tea.',
  acne: 'Keep skin clean and hydrated, use non-comedogenic products, and minimize sugar/dairy.'
}

export function forecastSymptoms(
  logs: { date: string; symptoms: string[] }[],
  lastPeriodStart: string,
  typicalCycleDays: number
): SymptomForecast[] {
  const forecasts: SymptomForecast[] = []
  const startIso = lastPeriodStart || new Date().toISOString().split('T')[0]
  const cycleLen = typicalCycleDays || 28

  // Fallback: If no logs or logs have no symptoms, bootstrap with general cycle averages
  if (!logs || logs.length === 0 || logs.every(l => l.symptoms.length === 0)) {
    return [
      {
        symptomId: 'cramps',
        label: 'Cramps & Pelvic Pain',
        phase: 'menstrual',
        phaseLabel: 'Menstrual Phase',
        probability: 65,
        confidence: 'Low',
        recommendation: RECS.cramps
      },
      {
        symptomId: 'fatigue',
        label: 'Fatigue',
        phase: 'menstrual',
        phaseLabel: 'Menstrual Phase',
        probability: 50,
        confidence: 'Low',
        recommendation: RECS.fatigue
      },
      {
        symptomId: 'bloating',
        label: 'Bloating',
        phase: 'luteal',
        phaseLabel: 'Luteal Phase',
        probability: 55,
        confidence: 'Low',
        recommendation: RECS.bloating
      },
      {
        symptomId: 'mood',
        label: 'Mood Swings / PMS',
        phase: 'luteal',
        phaseLabel: 'Luteal Phase',
        probability: 60,
        confidence: 'Low',
        recommendation: RECS.mood
      }
    ]
  }

  // Phase logs counter
  const phaseLogCount: Record<string, number> = { menstrual: 0, follicular: 0, fertile: 0, luteal: 0 }
  // Symptom counts by phase: { symptomId: { phaseKey: count } }
  const symptomCounts: Record<string, Record<string, number>> = {}

  logs.forEach((log) => {
    const start = new Date(`${startIso}T12:00:00`)
    const current = new Date(`${log.date}T12:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return
    const daysDiff = Math.floor((current.getTime() - start.getTime()) / 86400000)
    const cycleDay = ((daysDiff % cycleLen) + cycleLen) % cycleLen + 1
    const phaseKey = getPhaseFromDay(cycleDay, cycleLen)

    phaseLogCount[phaseKey]++

    log.symptoms.forEach((sId) => {
      // Group symptoms slightly to capture patterns better
      let groupKey = sId
      if (sId.includes('cramps') || sId.includes('pelvicpain')) groupKey = 'cramps'
      else if (sId.includes('fatigue') || sId.includes('brainfog')) groupKey = 'fatigue'
      else if (sId.includes('bloating')) groupKey = 'bloating'
      else if (sId.includes('headache') || sId.includes('backache')) groupKey = 'headache'
      else if (sId.includes('mood-') && sId !== 'mood-calm' && sId !== 'mood-happy') groupKey = 'mood'

      if (!symptomCounts[groupKey]) {
        symptomCounts[groupKey] = { menstrual: 0, follicular: 0, fertile: 0, luteal: 0 }
      }
      symptomCounts[groupKey][phaseKey]++
    })
  })

  // Calculate probabilities
  Object.entries(symptomCounts).forEach(([sId, phaseCounts]) => {
    Object.entries(phaseCounts).forEach(([phaseKey, count]) => {
      const logsInPhase = phaseLogCount[phaseKey]
      if (logsInPhase >= 2 && count > 0) {
        const prob = Math.min(Math.round((count / logsInPhase) * 100), 95)
        if (prob >= 30) {
          const confidence = logsInPhase >= 8 ? 'High' : logsInPhase >= 4 ? 'Medium' : 'Low'
          
          let label = SYMPTOM_DEFS.find(s => s.id === sId)?.label || sId
          if (sId === 'cramps') label = 'Cramps & Pelvic Pain'
          else if (sId === 'fatigue') label = 'Fatigue & Brain Fog'
          else if (sId === 'mood') label = 'Mood Swings / PMS'

          forecasts.push({
            symptomId: sId,
            label,
            phase: phaseKey as 'menstrual' | 'follicular' | 'fertile' | 'luteal',
            phaseLabel: PHASE_LABELS[phaseKey as keyof typeof PHASE_LABELS],
            probability: prob,
            confidence,
            recommendation: RECS[sId] || 'Stay hydrated, eat whole foods, and log daily to receive custom recommendations.'
          })
        }
      }
    })
  })

  // Sort by probability desc
  forecasts.sort((a, b) => b.probability - a.probability)

  // If no patterns found, fallback
  if (forecasts.length === 0) {
    return [
      {
        symptomId: 'cramps',
        label: 'Cramps & Pelvic Pain',
        phase: 'menstrual',
        phaseLabel: 'Menstrual Phase',
        probability: 45,
        confidence: 'Low',
        recommendation: RECS.cramps
      },
      {
        symptomId: 'fatigue',
        label: 'Fatigue',
        phase: 'menstrual',
        phaseLabel: 'Menstrual Phase',
        probability: 40,
        confidence: 'Low',
        recommendation: RECS.fatigue
      }
    ]
  }

  return forecasts.slice(0, 4) // Return top 4 predictions
}
