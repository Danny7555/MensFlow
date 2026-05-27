export type WellnessTip = {
  id: string
  category: 'nutrition' | 'movement' | 'rest' | 'mind'
  title: string
  summary: string
  phaseTag: string
}

export const TIPS_DUMMY: WellnessTip[] = [
  {
    id: '1',
    category: 'nutrition',
    title: 'Iron + vitamin C pairings',
    summary:
      'Combine lentils or leafy greens with citrus or bell pepper to improve iron absorption during flow and early luteal.',
    phaseTag: 'Menstrual · Luteal',
  },
  {
    id: '2',
    category: 'movement',
    title: 'Low-impact strength',
    summary:
      '20 minutes of bodyweight or light bands supports mood without spiking cortisol when energy dips.',
    phaseTag: 'Luteal',
  },
  {
    id: '3',
    category: 'rest',
    title: 'Sleep window consistency',
    summary:
      'Aim for the same wake time ±45 minutes — progesterone can lighten sleep quality in late luteal.',
    phaseTag: 'Luteal',
  },
  {
    id: '4',
    category: 'mind',
    title: '5-4-3-2-1 grounding',
    summary:
      'Quick anxiety reset: name 5 things you see, 4 hear, 3 feel, 2 smell, 1 taste — useful before ovulation stress spikes too.',
    phaseTag: 'Any phase',
  },
  {
    id: '5',
    category: 'nutrition',
    title: 'Magnesium-rich snacks',
    summary:
      'Pumpkin seeds, dark chocolate (70%+), and bananas may ease tension and sugar cravings mid-cycle.',
    phaseTag: 'Ovulatory · Luteal',
  },
  {
    id: '6',
    category: 'movement',
    title: 'Walk after meals',
    summary:
      'A 10-minute easy walk can flatten glucose swings that worsen bloating or mood for some people.',
    phaseTag: 'Any phase',
  },
]
