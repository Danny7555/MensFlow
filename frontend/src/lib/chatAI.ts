export function generateAIResponse(
  userPrompt: string,
  targetName: string,
  currentDay: number,
  phase: string,
  todaySymptoms: string[],
  userRole?: 'lady' | 'partner'
): string {
  const prompt = userPrompt.toLowerCase()
  const hasSymptom = (keyword: string) => prompt.includes(keyword)
  const isPartnerView = userRole === 'partner'
  const subject = isPartnerView ? (targetName || 'your partner') : 'you'
  const possessive = isPartnerView ? 'her' : 'your'
  const loggedText = isPartnerView ? 'she has' : 'you have'

  const phaseNormalized = (phase || '').toLowerCase()
  const isLuteal = phaseNormalized.includes('luteal')
  const isMenstrual = phaseNormalized.includes('menstrual')
  const isFertile = phaseNormalized.includes('ovulatory') || phaseNormalized.includes('fertile')

  let response = ""

  if (hasSymptom('cramp') || hasSymptom('pain') || hasSymptom('hurt')) {
    response += `Physical discomfort and cramps on Day ${currentDay} of the cycle are very common, especially during the Menstrual phase when uterine contractions occur to shed the lining. `
    if (isMenstrual) {
      response += isPartnerView
        ? `Since ${subject} is currently in her **Menstrual Phase**, her body is working hard. Prepare a warm water bottle or heating pad, offer ginger or chamomile tea, and keep the evening low-pressure. `
        : `Since you are currently in your **Menstrual Phase**, your body is working hard. Try a heating pad, warm fluids like ginger or chamomile tea, and lower-pressure plans today. `
    } else if (isLuteal) {
      response += isPartnerView
        ? `As ${subject} is in her **Luteal Phase**, premenstrual cramping can begin as prostaglandins rise. Warmth, light stretching, magnesium-rich foods, and quiet rest can help. `
        : `As you are in your **Luteal Phase**, premenstrual cramping can begin as prostaglandins rise. Warmth, light stretching, magnesium-rich foods, and quiet rest can help. `
    } else {
      response += isPartnerView
        ? `Since she is not in her period, this could be minor ovulation pain if she is near mid-cycle, or mild tension. Gentle warmth and hydration are good first steps. `
        : `Since you are not in your period, this could be minor ovulation pain if you are near mid-cycle, or mild tension. Gentle warmth and hydration are good first steps. `
    }
    response += isPartnerView
      ? `Taking over a practical task so she can rest without asking may help a lot.`
      : `If pain is severe, unusual, or worsening, consider checking in with a clinician.`
  } else if (hasSymptom('food') || hasSymptom('eat') || hasSymptom('cook') || hasSymptom('dinner') || hasSymptom('crave') || hasSymptom('chocolate')) {
    response += `Nutrition plays a major role in hormone balance! `
    if (isMenstrual) {
      response += `For the **Menstrual Phase**, ${possessive} body may benefit from warm, nutrient-dense foods, iron-rich meals, hydration, and magnesium-rich snacks. `
    } else if (isLuteal) {
      response += `During the **Luteal Phase**, cravings and appetite can rise. Slow-burning carbs, protein, healthy fats, and steady meals can reduce blood-sugar dips. `
    } else if (isFertile) {
      response += `In the **Ovulatory Phase**, fresh meals with fiber, lean protein, and colorful vegetables can support energy and estrogen metabolism. `
    } else {
      response += `For the **Follicular Phase**, lighter meals, bright produce, protein, and hydration can match rising energy. `
    }
  } else if (hasSymptom('tired') || hasSymptom('exhaust') || hasSymptom('energy') || hasSymptom('sleep') || hasSymptom('lazy')) {
    response += `Low energy and fatigue are highly correlated with hormonal shifts. `
    if (isLuteal) {
      response += `In the **Luteal Phase**, progesterone can feel sedating and may raise body temperature, which can affect sleep. A cooler room, earlier wind-down, and gentler expectations can help. `
    } else if (isMenstrual) {
      response += isPartnerView
        ? `During the **Menstrual Phase**, low hormone levels and active bleeding can drain energy. Help by reducing demands and taking over practical tasks.`
        : `During the **Menstrual Phase**, low hormone levels and active bleeding can drain energy. Give yourself permission to reduce demands and rest more.`
    } else {
      response += `If fatigue shows up outside the lower-energy phases, it may point to sleep debt, stress, hydration, food timing, or illness. Gentle movement and consistent rest are good first checks. `
    }
  } else if (hasSymptom('mood') || hasSymptom('sad') || hasSymptom('angry') || hasSymptom('cry') || hasSymptom('irritable') || hasSymptom('pms') || hasSymptom('space')) {
    response += `Emotions are deeply tied to neuro-chemical sensitivities. `
    if (isLuteal) {
      response += isPartnerView
        ? `This is the **Luteal Phase** (Day ${currentDay}), a common window for premenstrual mood shifts. Respond gently, avoid taking irritability personally, and offer space or reassurance based on what she prefers. `
        : `You are in the **Luteal Phase** (Day ${currentDay}), a common window for premenstrual mood shifts. Try lowering stimulation, naming what you need, and giving yourself extra margin. `
    } else if (isMenstrual) {
      response += `In the **Menstrual Phase**, pain and low hormones can make emotions feel closer to the surface. Validation, warmth, and less pressure are useful. `
    } else {
      response += `Hormones may be more stable or rising now, so sudden emotional dips can also come from stress, sleep, food timing, or overwhelm. `
    }
  } else if (hasSymptom('support') || hasSymptom('help') || hasSymptom('do') || hasSymptom('care')) {
    response += isPartnerView
      ? `The best way to support ${subject} depends on her active phase (currently **${phase}**, Day ${currentDay}):\n\n`
      : `The best self-care plan depends on your active phase (currently **${phase}**, Day ${currentDay}):\n\n`
    if (isMenstrual) {
      response += `1. **Warm Comfort:** Use heat, warm drinks, and comfortable clothing.\n`
      response += `2. **Lower the Load:** Reduce demanding plans where possible.\n`
      response += `3. **Track Signals:** Log flow, cramps, fatigue, and mood for better predictions.`
    } else if (isLuteal) {
      response += `1. **Sensory Comfort:** Dim lights, keep evenings calmer, and cool the bedroom.\n`
      response += `2. **Steady Food:** Add protein, complex carbs, and magnesium-rich snacks.\n`
      response += `3. **Protect Energy:** Avoid overcommitting and track PMS patterns.`
    } else if (isFertile) {
      response += `1. **Use Momentum:** Plan social, creative, or active tasks if energy feels high.\n`
      response += `2. **Confirm Ovulation Cues:** Track LH or cervical mucus if relevant.\n`
      response += `3. **Stay Grounded:** Hydrate and avoid overloading the schedule.`
    } else {
      response += `1. **Build Rhythm:** Use rising energy for planning, errands, or light movement.\n`
      response += `2. **Try New Things:** This can be a good time for fresh routines.\n`
      response += `3. **Keep Logging:** Record mood and energy as the baseline improves.`
    }
  } else if (hasSymptom('phase') || hasSymptom('cycle') || hasSymptom('current')) {
    response += isPartnerView
      ? `Based on the latest logs, ${subject} is on **Day ${currentDay}** of her cycle, which places her in the **${phase}**. `
      : `Based on your latest logs, you are on **Day ${currentDay}** of your cycle, which places you in the **${phase}**. `
    if (isMenstrual) {
      response += `The Menstrual Phase is characterized by the shedding of the uterine lining, low hormone baselines, and a clear need for physical restoration and warmth.`
    } else if (isLuteal) {
      response += `The Luteal Phase is the nesting phase. High progesterone prepares the body for potential pregnancy, naturally slowing her digestive system and reducing serotonin, leading to nesting behaviors, sleepiness, and cravings.`
    } else if (isFertile) {
      response += `The Ovulatory Phase is the high-energy peak of the cycle. Peak estrogen and testosterone drive high confidence, communication skills, and social openness.`
    } else {
      response += `The Follicular Phase is the renewal phase. Estrogen is rising, which starts to lift her fatigue and steadily increases mental focus and physical energy.`
    }
  } else {
    response += isPartnerView
      ? `Hi! I'm MensFlow, your empathetic relationship translator. Currently, ${subject} is on **Day ${currentDay}** of her cycle (**${phase}**). `
      : `Hi! I'm MensFlow, your cycle support companion. You are currently on **Day ${currentDay}** of your cycle (**${phase}**). `
    if (todaySymptoms.length > 0) {
      response += `Today, ${loggedText} logged: **${todaySymptoms.join(', ')}**. `
      response += isPartnerView
        ? `These logs are useful clues. Focus on comfort, practical support, and asking what would help most. `
        : `These logs are useful clues. Focus on comfort, realistic plans, hydration, and tracking what changes. `
    } else {
      response += isPartnerView
        ? `She has not logged symptoms yet today. A gentle check-in can help. `
        : `You have not logged symptoms yet today. A quick check-in can make today's guidance more accurate. `
    }
    response += isPartnerView
      ? `Ask me about cramps, food cravings, fatigue, or how to support her today.`
      : `Ask me about cramps, food cravings, fatigue, cycle phase, or what to log today.`
  }

  return makeFriendlyShortResponse(response)
}

function makeFriendlyShortResponse(response: string): string {
  const cleaned = response.replace(/\s+/g, ' ').trim()
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned]
  const short = sentences.slice(0, 3).join(' ').trim()
  const withEmoji = /[\u{1F300}-\u{1FAFF}]/u.test(short) ? short : `🌸 ${short}`
  return withEmoji.length > 520 ? `${withEmoji.slice(0, 500).trim()}...` : withEmoji
}
