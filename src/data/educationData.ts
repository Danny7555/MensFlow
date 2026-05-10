import { Brain, Drop, Moon, Heartbeat, ShieldPlus, Sparkle } from '@phosphor-icons/react'

export type EduCategory = 'All' | 'Hormones' | 'Phases' | 'Care'

export type ArticleDef = {
  id: string
  title: string
  description: string
  category: EduCategory
  readTime: string
  icon: any
}

export const EDUCATION_CATEGORIES: EduCategory[] = ['All', 'Hormones', 'Phases', 'Care']

export const EDUCATION_ARTICLES: ArticleDef[] = [
  {
    id: 'art-1',
    title: 'Understanding Estrogen',
    description: 'Learn how estrogen fluctuates and affects your energy, mood, and skin throughout your cycle.',
    category: 'Hormones',
    readTime: '4 min read',
    icon: Sparkle,
  },
  {
    id: 'art-2',
    title: 'The Luteal Phase Deep Dive',
    description: 'Why you might feel more tired and introverted during the two weeks before your period.',
    category: 'Phases',
    readTime: '6 min read',
    icon: Moon,
  },
  {
    id: 'art-3',
    title: 'When to Seek Care for Cramps',
    description: 'Pain is common, but extreme pain isn’t normal. Learn the signs of endometriosis and when to see a doctor.',
    category: 'Care',
    readTime: '5 min read',
    icon: ShieldPlus,
  },
  {
    id: 'art-4',
    title: 'Progesterone & Sleep',
    description: 'How the calming hormone progesterone impacts your sleep architecture and resting heart rate.',
    category: 'Hormones',
    readTime: '3 min read',
    icon: Brain,
  },
  {
    id: 'art-5',
    title: 'Navigating the Follicular Phase',
    description: 'Capitalize on rising energy levels. Best exercises and nutrition for the days right after your period.',
    category: 'Phases',
    readTime: '7 min read',
    icon: Drop,
  },
  {
    id: 'art-6',
    title: 'Tracking Your Basal Body Temp',
    description: 'A beginner’s guide to using BBT for understanding ovulation and metabolic health.',
    category: 'Care',
    readTime: '4 min read',
    icon: Heartbeat,
  },
]
