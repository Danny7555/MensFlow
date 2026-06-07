import type { DashboardSnapshot } from './dashboardStorage'

export type OnboardingAnswers = Record<string, unknown>

export type PersonalizationProfile = {
  role: 'lady' | 'partner'
  name?: string
  accessLevel: 'full' | 'educational'
  typicalCycleDays: number
  cycleVariationDays: number
  isAtypical: boolean
  flowLabel: string
  flowIntensity: 'light' | 'moderate' | 'heavy' | 'variable' | 'unknown'
  periodImpact: 'low' | 'medium' | 'high'
  trackingGoal: string
  educationTopic: string
}

export function buildPersonalizationProfile(answers: OnboardingAnswers): PersonalizationProfile {
  const cycleLength = String(answers.cycle_length ?? '')
  const flow = String(answers.flow_description ?? '')
  const impact = String(answers.period_impact ?? '')
  const regularity = String(answers.cycle_regularity ?? '')

  const typicalCycleDays =
    cycleLength === 'less_24' ? 23 :
    cycleLength === '29_35' ? 32 :
    cycleLength === 'more_35' ? 38 :
    28

  const cycleVariationDays =
    regularity === 'very_regular' ? 4 :
    regularity === 'mostly_regular' ? 8 :
    regularity === 'just_started' ? 21 :
    regularity === 'irregular' ? 18 :
    10

  const flowIntensity =
    flow === 'light' ? 'light' :
    flow === 'moderate' ? 'moderate' :
    flow === 'heavy' ? 'heavy' :
    flow === 'varies' ? 'variable' :
    'unknown'

  return {
    role: answers.role === 'partner' ? 'partner' : 'lady',
    name: typeof answers.name === 'string' ? answers.name.trim() : undefined,
    accessLevel: answers.purpose === 'education' ? 'educational' : 'full',
    typicalCycleDays,
    cycleVariationDays,
    isAtypical: cycleVariationDays > 14 || typicalCycleDays < 24 || typicalCycleDays > 35,
    flowLabel:
      flowIntensity === 'heavy' ? 'Heavy flow pattern' :
      flowIntensity === 'light' ? 'Light flow pattern' :
      flowIntensity === 'variable' ? 'Variable flow pattern' :
      flowIntensity === 'moderate' ? 'Moderate flow pattern' :
      'Flow pattern not set',
    flowIntensity,
    periodImpact:
      impact === 'significantly' ? 'high' :
      impact === 'moderately' ? 'medium' :
      'low',
    trackingGoal: String(answers.tracking_goal ?? 'predict_period'),
    educationTopic: String(answers.recommendation_topics ?? 'cycle_basics'),
  }
}

export function buildPersonalizedDashboard(answers: OnboardingAnswers): Partial<DashboardSnapshot> {
  const profile = buildPersonalizationProfile(answers)
  const lastPeriodStart = ''

  return {
    lastPeriodStart,
    typicalCycleDays: profile.typicalCycleDays,
    phaseLabel: '',
    hormoneTrend: 'No cycle data set',
    bodySignals: 'No symptoms logged today',
    cycleVariationDays: profile.cycleVariationDays,
    isAtypical: profile.isAtypical,
    cycleNotes: buildCycleNotes(profile),
    guidanceLines: buildGuidanceLines(profile),
    scientificInsight: buildScientificInsight(profile),
    dailyTip: buildDailyTip(profile),
  }
}

function buildCycleNotes(profile: PersonalizationProfile): string {
  const notes = [
    `Typical cycle: ${profile.typicalCycleDays} days`,
    `Regularity variation: about ${profile.cycleVariationDays} days`,
    `Flow: ${profile.flowIntensity}`,
    `Daily impact: ${profile.periodImpact}`,
  ]
  return notes.join(' · ')
}

function buildGuidanceLines(profile: PersonalizationProfile): string[] {
  const lines = [
    profile.periodImpact === 'high'
      ? 'Prioritize pain relief, lighter workloads, and earlier rest during flow days.'
      : 'Use daily check-ins to confirm how the body is actually feeling today.',
    profile.isAtypical
      ? 'Predictions may be less exact until several logged cycles confirm the pattern.'
      : 'Cycle predictions can start from this baseline and improve with each log.',
  ]

  if (profile.flowIntensity === 'heavy') {
    lines.push('Heavy-flow days need extra hydration, iron-rich meals, and symptom tracking.')
  } else if (profile.flowIntensity === 'variable') {
    lines.push('Variable flow makes daily logging especially useful for trend accuracy.')
  }

  return lines
}

function buildScientificInsight(profile: PersonalizationProfile): string {
  if (profile.isAtypical) {
    return 'Did you know? Cycle predictions are most reliable when the app combines cycle length, flow pattern, symptoms, and recent logs instead of using a single 28-day default.'
  }
  return 'Did you know? Even regular cycles can shift by a few days, so daily symptoms and flow logs help keep predictions realistic.'
}

function buildDailyTip(profile: PersonalizationProfile): { title: string; desc: string } {
  if (profile.flowIntensity === 'heavy') {
    return {
      title: 'Support heavy-flow days',
      desc: 'Keep water nearby, plan iron-rich food, and log cramps or fatigue so today’s guidance adapts.',
    }
  }

  if (profile.periodImpact === 'high') {
    return {
      title: 'Lower the load',
      desc: 'Schedule demanding tasks away from period days when possible and use symptom logs to spot patterns.',
    }
  }

  return {
    title: 'Start with one clean log',
    desc: 'Log today’s flow, mood, and physical signals so future predictions can move beyond onboarding estimates.',
  }
}
