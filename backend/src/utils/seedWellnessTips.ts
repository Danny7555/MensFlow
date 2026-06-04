import { WellnessTip } from '../models/WellnessTip';

const DEFAULT_TIPS = [
  {
    category: 'nutrition',
    title: 'Iron + vitamin C pairings',
    summary: 'Combine lentils or leafy greens with citrus or bell pepper to improve iron absorption during flow and early luteal.',
    phaseTag: 'Menstrual · Luteal',
  },
  {
    category: 'movement',
    title: 'Low-impact strength',
    summary: '20 minutes of bodyweight or light bands supports mood without spiking cortisol when energy dips.',
    phaseTag: 'Luteal',
  },
  {
    category: 'rest',
    title: 'Sleep window consistency',
    summary: 'Aim for the same wake time ±45 minutes — progesterone can lighten sleep quality in late luteal.',
    phaseTag: 'Luteal',
  },
  {
    category: 'mind',
    title: '5-4-3-2-1 grounding',
    summary: 'Quick anxiety reset: name 5 things you see, 4 hear, 3 feel, 2 smell, 1 taste — useful before ovulation stress spikes too.',
    phaseTag: 'Any phase',
  },
  {
    category: 'nutrition',
    title: 'Magnesium-rich snacks',
    summary: 'Pumpkin seeds, dark chocolate (70%+), and bananas may ease tension and sugar cravings mid-cycle.',
    phaseTag: 'Ovulatory · Luteal',
  },
  {
    category: 'movement',
    title: 'Walk after meals',
    summary: 'A 10-minute easy walk can flatten glucose swings that worsen bloating or mood for some people.',
    phaseTag: 'Any phase',
  },
];

export async function seedWellnessTips(): Promise<void> {
  try {
    const count = await WellnessTip.countDocuments();
    if (count === 0) {
      console.log('[DB] Seeding default wellness tips...');
      await WellnessTip.insertMany(DEFAULT_TIPS);
      console.log(`[DB] Successfully seeded ${DEFAULT_TIPS.length} wellness tips.`);
    } else {
      console.log(`[DB] Wellness tips already present (${count} items). Skipping seed.`);
    }
  } catch (err) {
    console.error('[DB] Error seeding wellness tips:', err);
  }
}
