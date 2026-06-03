import { useState, useEffect, useMemo } from 'react'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { CloudSun } from '@phosphor-icons/react'
import { useStore } from '../../store/useStore'
import { computeCycleDay, getPhaseFromDay } from '../../lib/cycleUtils'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

interface WeatherData {
  temp: number
  humidity: number
  code: number
}

interface AlertInfo {
  title: string
  alert: string
  recommended: string[]
}

const INSIGHTS: Record<string, Record<string, AlertInfo>> = {
  menstrual: {
    hot: {
      title: "Weather & Cycle Alert",
      alert: "Hot temperatures and high humidity today may increase fatigue and dehydration during your menstrual phase.",
      recommended: [
        "Drink more water",
        "Take breaks if outdoors",
        "Consider lighter exercise"
      ]
    },
    cold: {
      title: "Weather & Cycle Alert",
      alert: "Cold temperatures today may worsen uterine cramping and muscle tension during your menstrual phase.",
      recommended: [
        "Use a warm heating pad",
        "Sip hot ginger tea",
        "Wear warm, thermal layers"
      ]
    },
    rainy: {
      title: "Weather & Cycle Alert",
      alert: "Rainy weather and low atmospheric pressure can exacerbate low energy and fatigue during your period.",
      recommended: [
        "Prioritize warm comfort and rest",
        "Do gentle indoor stretching",
        "Keep your feet warm and dry"
      ]
    },
    humid: {
      title: "Weather & Cycle Alert",
      alert: "High humidity today might make you feel more sluggish and bloated during your menstrual phase.",
      recommended: [
        "Drink electrolyte-rich water",
        "Wear loose, breathable fabrics",
        "Opt for lighter indoor relaxation"
      ]
    },
    moderate: {
      title: "Weather & Cycle Advice",
      alert: "Mild, comfortable weather today is perfect for gentle movement to help relieve menstrual cramps.",
      recommended: [
        "Take a gentle 15-minute walk",
        "Stay hydrated",
        "Focus on restorative rest"
      ]
    }
  },
  follicular: {
    hot: {
      title: "Weather & Cycle Alert",
      alert: "Rising estrogen boosts physical stamina, but high heat can still drain you quickly during your follicular phase.",
      recommended: [
        "Schedule outdoor activities in the cool morning",
        "Carry an electrolyte drink with you",
        "Wear breathable, lightweight fabrics"
      ]
    },
    cold: {
      title: "Weather & Cycle Advice",
      alert: "Your energy is rising! Don't let the cold stop you — warm up quickly with dynamic movements.",
      recommended: [
        "Do a brisk outdoor walk or warm-up",
        "Dress in layers to adjust to rising exertion",
        "Channel your focus into a new creative project"
      ]
    },
    rainy: {
      title: "Weather & Cycle Advice",
      alert: "Rainy days are perfect for directing your rising follicular focus into indoor planning and mental workouts.",
      recommended: [
        "Brainstorm new projects or goals",
        "Try an indoor yoga or Pilates flow",
        "Cook a fresh, nutrient-dense meal"
      ]
    },
    humid: {
      title: "Weather & Cycle Advice",
      alert: "High humidity today may feel heavier, but your rising energy will help you push through.",
      recommended: [
        "Stay hydrated to counter sweat loss",
        "Keep workouts light and well-ventilated",
        "Focus on indoor stretching and recovery"
      ]
    },
    moderate: {
      title: "Weather & Cycle Advice",
      alert: "Perfect, mild weather matches your rising follicular energy and cognitive clarity today!",
      recommended: [
        "Plan a refreshing outdoor workout",
        "Start a new project or outdoor adventure",
        "Socialize and connect in the fresh air"
      ]
    }
  },
  fertile: {
    hot: {
      title: "Weather & Cycle Alert",
      alert: "You are at peak physical energy, but hot weather increases your core temperature faster during ovulation.",
      recommended: [
        "Drink cold water to cool your core",
        "Avoid intense outdoor workouts during peak sun hours",
        "Enjoy cool, hydrating fruits"
      ]
    },
    cold: {
      title: "Weather & Cycle Advice",
      alert: "Your body temperature rises slightly after ovulation. Perfect weather for a refreshing, brisk run!",
      recommended: [
        "Try a high-intensity workout or outdoor run",
        "Stay warm post-exercise to prevent muscle tightness",
        "Embrace your peak social energy with friends"
      ]
    },
    rainy: {
      title: "Weather & Cycle Advice",
      alert: "Rain outside won't dampen your high ovulatory energy. Perfect time for indoor dynamic exercise or socializing.",
      recommended: [
        "Host a cozy indoor gathering",
        "Try an indoor cycling or dance class",
        "Channel your high focus into creative tasks"
      ]
    },
    humid: {
      title: "Weather & Cycle Alert",
      alert: "High humidity can increase sweat rate, especially when your core body temp is naturally higher during ovulation.",
      recommended: [
        "Increase electrolyte intake",
        "Choose an air-conditioned space for heavy workouts",
        "Take cool showers to refresh"
      ]
    },
    moderate: {
      title: "Weather & Cycle Advice",
      alert: "Peak confidence and stamina match today's beautiful, moderate weather perfectly!",
      recommended: [
        "Schedule a special outdoor date night",
        "Try a challenging outdoor run or hike",
        "Soak in some healthy morning sunlight"
      ]
    }
  },
  luteal: {
    hot: {
      title: "Weather & Cycle Alert",
      alert: "Progesterone raises your resting body temperature, making you more sensitive to high heat and bloating today.",
      recommended: [
        "Drink cold water and reduce sodium intake",
        "Opt for cool, air-conditioned spaces to rest",
        "Prioritize gentle, low-intensity movement"
      ]
    },
    cold: {
      title: "Weather & Cycle Advice",
      alert: "Cold weather today can amplify luteal fatigue and nesting instincts. Time to snuggle up!",
      recommended: [
        "Enjoy warm, magnesium-rich comforting meals",
        "Prioritize a cozy evening of restorative rest",
        "Do a relaxing indoor stretch routine"
      ]
    },
    rainy: {
      title: "Weather & Cycle Advice",
      alert: "A rainy day is the perfect excuse to honor your body's natural nesting instincts and unwind.",
      recommended: [
        "Take a warm, relaxing bath",
        "Read a book or listen to calming music",
        "Go to bed early for deep recovery"
      ]
    },
    humid: {
      title: "Weather & Cycle Alert",
      alert: "Humidity today can compound pre-period bloating and discomfort. Keep cool and take it easy.",
      recommended: [
        "Sip peppermint or dandelion tea",
        "Wear loose, non-restrictive clothing",
        "Avoid heavy or high-sodium foods"
      ]
    },
    moderate: {
      title: "Weather & Cycle Advice",
      alert: "A calm, pleasant day to match your nesting phase. Ideal for self-care and light activities.",
      recommended: [
        "Enjoy a peaceful stroll in nature",
        "Prepare healthy comfort foods",
        "Prioritize deep, early sleep well"
      ]
    }
  }
}

const WEATHER_STYLES: Record<string, {
  color: string;
  glow: string;
  badge: string;
  img: string;
  label: string;
}> = {
  hot: {
    color: 'text-amber-500',
    glow: 'bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_50%)]',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    img: '/images/weather/sunny.png',
    label: 'Sunny'
  },
  cold: {
    color: 'text-blue-500',
    glow: 'bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)]',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    img: '/images/weather/chilly.png',
    label: 'Chilly'
  },
  rainy: {
    color: 'text-indigo-500',
    glow: 'bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%)]',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    img: '/images/weather/rainy.png',
    label: 'Rainy'
  },
  humid: {
    color: 'text-teal-500',
    glow: 'bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.08),transparent_50%)]',
    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
    img: '/images/weather/humid.png',
    label: 'Humid'
  },
  moderate: {
    color: 'text-rose-400',
    glow: 'bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.06),transparent_50%)]',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    img: '/images/weather/mild.png',
    label: 'Mild'
  }
}

export function WeatherAlertCard() {
  const { dashboard, user, partnerStatus } = useStore()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  const data = user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle
    ? partnerStatus.cycle
    : dashboard

  const phase = useMemo(() => {
    if (data.phaseLabel) {
      const normalized = data.phaseLabel.toLowerCase()
      if (normalized.includes('menstrual')) return 'menstrual'
      if (normalized.includes('follicular')) return 'follicular'
      if (normalized.includes('fertile') || normalized.includes('ovulat')) return 'fertile'
      if (normalized.includes('luteal')) return 'luteal'
    }
    const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
    return getPhaseFromDay(cycleDay, data.typicalCycleDays)
  }, [data.lastPeriodStart, data.typicalCycleDays, data.phaseLabel])

  useEffect(() => {
    let active = true

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`
        )
        if (!response.ok) throw new Error('Weather API error')
        const json = await response.json()
        if (active && json.current) {
          setWeather({
            temp: json.current.temperature_2m,
            humidity: json.current.relative_humidity_2m,
            code: json.current.weather_code
          })
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err)
        if (active) {
          // Fallback moderate default
          setWeather({ temp: 23.3, humidity: 55, code: 0 })
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          // Default location: New York City
          fetchWeather(40.7128, -74.006)
        }
      )
    } else {
      // Default location: New York City
      fetchWeather(40.7128, -74.006)
    }

    return () => {
      active = false
    }
  }, [])

  const weatherInfo = useMemo(() => {
    if (!weather) return null

    // Determine category
    let cond = 'moderate'
    if (weather.temp >= 28) {
      cond = 'hot'
    } else if (weather.temp <= 10) {
      cond = 'cold'
    } else if (weather.code >= 51) {
      cond = 'rainy'
    } else if (weather.humidity >= 70) {
      cond = 'humid'
    }

    const currentPhaseInsights = INSIGHTS[phase] || INSIGHTS.luteal
    return {
      alertData: currentPhaseInsights[cond] || currentPhaseInsights.moderate,
      condition: cond
    }
  }, [weather, phase])

  if (loading) {
    return (
      <div className="flo-card p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left flex items-center justify-center min-h-[160px]">
        <div className="flex flex-col items-center gap-3">
          <m.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="text-[var(--mf-accent)]"
          >
            <CloudSun size={28} />
          </m.div>
          <span className="text-xs text-[var(--mf-muted)] tracking-wider">Syncing local atmospheric alerts...</span>
        </div>
      </div>
    )
  }

  if (!weather || !weatherInfo) return null

  const style = WEATHER_STYLES[weatherInfo.condition] || WEATHER_STYLES.moderate

  return (
    <m.div
      variants={cardVariants}
      className="flo-card flo-card--prominent p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className={`absolute inset-0 pointer-events-none ${style.glow}`} />

      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="space-y-0.5">
            <span className="text-[9px] font-normal text-[var(--mf-accent)] uppercase tracking-[0.2em] block">
              {weatherInfo.alertData.title}
            </span>
            <h3 className="text-base font-semibold text-[var(--mf-text-strong)] capitalize">
              {weather.temp}°C, {style.label}
            </h3>
          </div>
          
          {/* 3D weather illustration (rounded) */}
          <div className="w-11 h-11 shrink-0 -mt-1 -mr-1 rounded-full overflow-hidden filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.05)]">
            <img 
              src={style.img} 
              alt={style.label} 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* Info Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[var(--mf-elevated)] text-[var(--mf-text-strong)] border border-[var(--mf-border)]">
            {weather.humidity}% Humidity
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border border-[var(--mf-accent-border)] capitalize">
            {phase} Phase
          </span>
        </div>

        {/* Condition Alert Description */}
        <p className="text-xs text-[var(--mf-text-strong)] leading-relaxed mb-4 font-normal">
          {weatherInfo.alertData.alert}
        </p>
      </div>

      {/* Recommended Tips */}
      <div className="relative z-10 pt-3 border-t border-[var(--mf-border)]">
        <span className="text-[9px] font-semibold text-[var(--mf-muted)] uppercase tracking-wider block mb-2.5">
          Recommended
        </span>
        <div className="space-y-2">
          {weatherInfo.alertData.recommended.map((tip, idx) => (
            <div
              key={tip}
              className="flex items-start gap-2 text-xs text-[var(--mf-text-strong)]"
            >
              <span className="flex size-4.5 items-center justify-center rounded bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] text-[9px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-snug opacity-90">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </m.div>
  )
}
