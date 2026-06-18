import { EducationArticle } from '../models/EducationArticle';

const DEFAULT_ARTICLES = [
  {
    title: "PCOS",
    description: "Learn about the symptoms of polycystic ovary syndrome and how it affects your menstrual cycle.",
    category: "Care",
    readTime: "5 min read",
    iconName: "Sparkle",
    image: "/images/star.png",
    url: "https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/symptoms/",
  },
  {
    title: "Stress",
    description: "How stress can affect your period and what you can do to manage it.",
    category: "Hormones",
    readTime: "4 min read",
    iconName: "Moon",
    image: "/images/moon.png",
    url: "https://homehealth-uk.com/how-stress-can-affect-your-period/",
  },
  {
    title: "Diet and Nutrition",
    description: "How your diet and nutrition habits influence your menstrual cycle and hormonal balance.",
    category: "Care",
    readTime: "6 min read",
    iconName: "ShieldPlus",
    image: "/images/medicine.png",
    url: "https://www.medparkhospital.com/en-US/lifestyles/diet-and-menstruation",
  },
  {
    title: "Irregular Sleep",
    description: "The connection between sleep quality and your menstrual cycle, and tips for better rest.",
    category: "Hormones",
    readTime: "4 min read",
    iconName: "Brain",
    image: "/images/brain.png",
    url: "https://www.samphireneuro.com/en-us/blog/sleep-and-menstrual-cycle",
  },
  {
    title: "Hormonal Imbalance",
    description: "Understanding the connection between hormonal imbalances and irregular periods.",
    category: "Hormones",
    readTime: "5 min read",
    iconName: "Drop",
    image: "/images/water.png",
    url: "https://unifiedpremierwomenscare.com/the-connection-between-hormonal-imbalances-and-irregular-periods/",
  },
  {
    title: "Weight Changes",
    description: "How changes in your weight can affect your menstrual cycle and what to watch for.",
    category: "Care",
    readTime: "4 min read",
    iconName: "Heartbeat",
    image: "/images/heart.png",
    url: "https://www.verywellhealth.com/changes-in-your-weight-and-missing-your-period-4105209",
  },
  {
    title: "Medication",
    description: "Learn about medications that can affect your period and why you should pay attention.",
    category: "Care",
    readTime: "5 min read",
    iconName: "Heartbeat",
    image: "/images/heart.png",
    url: "https://nuawoman.com/blog/meds-that-can-affect-your-period-and-why-you-should-pay-attention/",
  },
];

export async function seedEducation(): Promise<void> {
  try {
    const count = await EducationArticle.countDocuments();
    if (count > 0) {
      console.log(`[DB] Removing ${count} existing educational articles...`);
      await EducationArticle.deleteMany({});
    }
    console.log('[DB] Seeding default educational articles...');
    await EducationArticle.insertMany(DEFAULT_ARTICLES);
    console.log(`[DB] Successfully seeded ${DEFAULT_ARTICLES.length} educational articles.`);
  } catch (err) {
    console.error('[DB] Error seeding educational articles:', err);
  }
}
