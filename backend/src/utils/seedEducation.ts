import { EducationArticle } from '../models/EducationArticle';

const DEFAULT_ARTICLES = [
  {
    title: "Understanding Estrogen",
    description: "Learn how estrogen fluctuates and affects your energy, mood, and skin throughout your cycle.",
    category: "Hormones",
    readTime: "4 min read",
    iconName: "Sparkle",
    image: "/images/star.png",
    url: "https://www.healthline.com/health/high-estrogen",
  },
  {
    title: "The Luteal Phase Deep Dive",
    description: "Why you might feel more tired and introverted during the two weeks before your period.",
    category: "Phases",
    readTime: "6 min read",
    iconName: "Moon",
    image: "/images/moon.png",
    url: "https://helloclue.com/articles/cycle-a-z/the-luteal-phase-pms-progesterone-and-the-corpus-luteum",
  },
  {
    title: "When to Seek Care for Cramps",
    description: "Pain is common, but extreme pain isn’t normal. Learn the signs of endometriosis and when to see a doctor.",
    category: "Care",
    readTime: "5 min read",
    iconName: "ShieldPlus",
    image: "/images/medicine.png",
    url: "https://www.mayoclinic.org/diseases-conditions/menstrual-cramps/symptoms-causes/syc-20374919",
  },
  {
    title: "Progesterone & Sleep",
    description: "How the calming hormone progesterone impacts your sleep architecture and resting heart rate.",
    category: "Hormones",
    readTime: "3 min read",
    iconName: "Brain",
    image: "/images/brain.png",
    url: "https://www.sleepfoundation.org/how-sleep-works/hormones-and-sleep",
  },
  {
    title: "Navigating the Follicular Phase",
    description: "Capitalize on rising energy levels. Best exercises and nutrition for the days right after your period.",
    category: "Phases",
    readTime: "7 min read",
    iconName: "Drop",
    image: "/images/water.png",
    url: "https://helloclue.com/articles/cycle-a-z/the-follicular-phase-prolonged-short-and-average",
  },
  {
    title: "Tracking Your Basal Body Temp",
    description: "A beginner’s guide to using BBT for understanding ovulation and metabolic health.",
    category: "Care",
    readTime: "4 min read",
    iconName: "Heartbeat",
    image: "/images/heart.png",
    url: "https://www.mayoclinic.org/tests-procedures/basal-body-temperature/about/pac-20393026",
  },
];

export async function seedEducation(): Promise<void> {
  try {
    const count = await EducationArticle.countDocuments();
    if (count === 0) {
      console.log('[DB] Seeding default educational articles...');
      await EducationArticle.insertMany(DEFAULT_ARTICLES);
      console.log(`[DB] Successfully seeded ${DEFAULT_ARTICLES.length} educational articles.`);
    } else {
      console.log(`[DB] Educational articles already present (${count} items). Skipping seed.`);
    }
  } catch (err) {
    console.error('[DB] Error seeding educational articles:', err);
  }
}
