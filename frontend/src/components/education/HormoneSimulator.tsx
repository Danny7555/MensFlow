import { useState, useEffect, useRef } from 'react'
import { m } from 'framer-motion'
import { getPhaseFromDay } from '../../lib/cycleUtils'

function HormoneParticles({ day }: { day: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = canvas.width = canvas.offsetWidth || 400
    let height = canvas.height = canvas.offsetHeight || 300

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    const phaseKey = getPhaseFromDay(day, 28)
    
    let color = '#ff4d6d' // Menstrual (red)
    let speedMult = 0.4
    let density = 25

    if (phaseKey === 'follicular') {
      color = '#a855f7' // Follicular (purple)
      speedMult = 0.85
      density = 40
    } else if (phaseKey === 'fertile') {
      color = '#3b82f6' // Ovulatory/Fertile (blue)
      speedMult = 1.4
      density = 60
    } else if (phaseKey === 'luteal') {
      color = '#f59e0b' // Luteal (amber)
      speedMult = 0.6
      density = 30
    }

    interface Particle {
      x: number
      y: number
      size: number
      vx: number
      vy: number
      alpha: number
    }

    const particles: Particle[] = []
    for (let i = 0; i < density; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1.2,
        vx: (Math.random() - 0.5) * speedMult,
        vy: (Math.random() - 0.5) * speedMult - (Math.random() * 0.2 + 0.1) * speedMult,
        alpha: Math.random() * 0.4 + 0.1
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = color

      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.globalAlpha = p.alpha
        ctx.fill()

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
      })

      ctx.globalAlpha = 1.0
      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [day])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-45 mix-blend-screen rounded-3xl"
      style={{ zIndex: 0 }}
    />
  )
}

interface HormoneData {
  day: number
  estrogen: number
  progesterone: number
  lh: number
  fsh: number
}

// Generate coordinates for smooth curves (scaled 0 to 100 for SVG viewport height of 150)
const generateHormoneLevels = (): HormoneData[] => {
  const data: HormoneData[] = []
  for (let day = 1; day <= 28; day++) {
    // Estrogen: Big peak at day 12, secondary hump at day 21
    let estrogen = 10
    if (day <= 13) {
      estrogen = 10 + 75 * Math.pow(Math.sin(((day - 1) / 12) * Math.PI), 2.5)
    } else {
      estrogen = 15 + 40 * Math.pow(Math.sin(((day - 14) / 13) * Math.PI), 2)
    }

    // Progesterone: High in Luteal phase, peaking around day 21
    let progesterone = 5
    if (day > 14) {
      progesterone = 5 + 70 * Math.pow(Math.sin(((day - 14) / 13) * Math.PI), 2)
    }

    // LH: Massive spike at day 13-14
    let lh = 5
    if (day >= 11 && day <= 15) {
      lh = 5 + 85 * Math.pow(Math.sin(((day - 11) / 4) * Math.PI), 4)
    }

    // FSH: Small hump on day 3, medium spike at day 13-14
    let fsh = 15
    if (day <= 6) {
      fsh = 15 + 10 * Math.pow(Math.sin(((day - 1) / 5) * Math.PI), 2)
    } else if (day >= 11 && day <= 15) {
      fsh = 15 + 45 * Math.pow(Math.sin(((day - 11) / 4) * Math.PI), 3)
    }

    data.push({ day, estrogen, progesterone, lh, fsh })
  }
  return data
}

const HORMONE_LEVELS = generateHormoneLevels()

const PHASE_DETAILS: Record<string, {
  name: string
  color: string
  bg: string
  desc: string
  symptoms: string[]
  partnerTips: string[]
}> = {
  menstrual: {
    name: 'Menstrual Phase',
    color: '#ff4d6d',
    bg: 'rgba(255, 77, 109, 0.08)',
    desc: 'Day 1 of bleeding. Progesterone and estrogen plunge to their lowest, signaling the shedding of the uterine lining. Rest and comfort are paramount.',
    symptoms: ['Cramps', 'Low Energy', 'Backache', 'Tenderness'],
    partnerTips: [
      'Offer a warm heating pad or run a hot bath.',
      'Prepare nourishing meals, especially iron-rich foods.',
      'Suggest relaxing activities like watching a movie together.',
    ]
  },
  follicular: {
    name: 'Follicular Phase',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.08)',
    desc: 'FSH stimulates follicles to develop. Estrogen begins its climb, building back the uterine lining and boosting your brain chemicals.',
    symptoms: ['Rising Energy', 'Clearer Skin', 'Optimistic Mood', 'Increased Focus'],
    partnerTips: [
      'Great phase to plan fun dates, try new things, or go on outdoor walks.',
      'Support her creativity and projects—her focus is at its peak!',
      'Plan socializing, as she is likely feeling communicative.'
    ]
  },
  fertile: {
    name: 'Ovulatory Phase',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    desc: 'LH surges, triggering the release of the egg. Estrogen peaks. You are at your most fertile, and energy and social drive are at their highest.',
    symptoms: ['Peak Energy', 'High Libido', 'Social Outgoingness', 'Mild Ovulation Pain'],
    partnerTips: [
      'She is feeling confident and magnetic—compliment her and show affection.',
      'Ideal time for active dates like hiking, dancing, or dining out.',
      'If conceiving, this is the fertile window.'
    ]
  },
  luteal: {
    name: 'Luteal Phase',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    desc: 'The ruptured follicle becomes the corpus luteum, pumping out progesterone to support a potential pregnancy. If no fertilization occurs, hormones fall, triggering PMS.',
    symptoms: ['Bloating', 'Mood swings/irritability', 'Food cravings', 'Fatigue'],
    partnerTips: [
      'Be extra patient; PMS is driven by rapid hormone withdrawal.',
      'Help around the house without being asked to reduce her stress.',
      'Keep healthy snacks and her favorite comfort foods stocked.'
    ]
  }
}

export function HormoneSimulator() {
  const [day, setDay] = useState(14)
  const [visibleHormones, setVisibleHormones] = useState({
    estrogen: true,
    progesterone: true,
    lh: true,
    fsh: true
  })

  const currentData = HORMONE_LEVELS[day - 1]
  const phaseKey = getPhaseFromDay(day, 28)
  const phase = PHASE_DETAILS[phaseKey] || PHASE_DETAILS.menstrual

  const toggleHormone = (key: 'estrogen' | 'progesterone' | 'lh' | 'fsh') => {
    setVisibleHormones(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="dash-panel p-6 space-y-8 animate-in fade-in duration-300 relative overflow-hidden">
      <HormoneParticles day={day} />
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h2 className="text-lg font-normal text-[var(--mf-text-strong)]">Interactive Hormone Wave</h2>
            <p className="text-xs text-muted-foreground">Scrub through the 28-day cycle to watch FSH, LH, Estrogen, and Progesterone interact.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold px-4 py-1.5 rounded-full" style={{ backgroundColor: phase.bg, color: phase.color }}>
              {phase.name} (Day {day})
            </span>
          </div>
        </div>

        {/* Control Panel: Hormone legends toggling & Day scrub slider */}
        <div className="space-y-6">
          {/* Legends / Toggles */}
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <button
              type="button"
              onClick={() => toggleHormone('estrogen')}
              className={`px-4 py-2 rounded-full border text-xs font-normal transition-all cursor-pointer flex items-center gap-2 ${
                visibleHormones.estrogen
                  ? 'bg-pink-500/10 text-pink-500 border-pink-500/30'
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className="size-2 rounded-full bg-[#ff6b8b]" />
              Estrogen (Peak: {Math.round(currentData.estrogen)}%)
            </button>
            <button
              type="button"
              onClick={() => toggleHormone('progesterone')}
              className={`px-4 py-2 rounded-full border text-xs font-normal transition-all cursor-pointer flex items-center gap-2 ${
                visibleHormones.progesterone
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className="size-2 rounded-full bg-[#f59e0b]" />
              Progesterone (Peak: {Math.round(currentData.progesterone)}%)
            </button>
            <button
              type="button"
              onClick={() => toggleHormone('lh')}
              className={`px-4 py-2 rounded-full border text-xs font-normal transition-all cursor-pointer flex items-center gap-2 ${
                visibleHormones.lh
                  ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className="size-2 rounded-full bg-[#8b5cf6]" />
              LH (Peak: {Math.round(currentData.lh)}%)
            </button>
            <button
              type="button"
              onClick={() => toggleHormone('fsh')}
              className={`px-4 py-2 rounded-full border text-xs font-normal transition-all cursor-pointer flex items-center gap-2 ${
                visibleHormones.fsh
                  ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className="size-2 rounded-full bg-[#06b6d4]" />
              FSH (Peak: {Math.round(currentData.fsh)}%)
            </button>
          </div>

          {/* Custom Slider Track */}
          <div className="flex flex-col gap-2 max-w-xl mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Day 1 (Start)</span>
              <span className="font-semibold text-[var(--mf-text-strong)]">Day {day} selected</span>
              <span>Day 28 (End)</span>
            </div>
            <input
              type="range"
              min="1"
              max="28"
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value))}
              className="w-full accent-[var(--mf-accent)] cursor-pointer h-2 bg-muted rounded-lg outline-none"
              aria-label="Cycle day scrubber"
            />
          </div>
        </div>

        {/* Information Cards Displaying dynamic tips/symptoms based on the day */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <m.div
            key={`symptom-${phaseKey}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-border p-5 rounded-3xl bg-card space-y-4"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--mf-muted)] block">Biological State</span>
              <h3 className="text-base font-normal text-[var(--mf-text-strong)]">{phase.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{phase.desc}</p>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--mf-muted)] block">Common Symptoms</span>
              <div className="flex flex-wrap gap-2">
                {phase.symptoms.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full bg-muted text-xs border border-border/50 text-[var(--mf-text-strong)]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </m.div>

          <m.div
            key={`tips-${phaseKey}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="border border-border p-5 rounded-3xl bg-card space-y-4"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--mf-accent)] block">Partner Support</span>
              <h3 className="text-base font-normal text-[var(--mf-text-strong)]">Actionable Care Advice</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground pl-1">
              {phase.partnerTips.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="size-1.5 rounded-full bg-[var(--mf-accent)] mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </m.div>
        </div>
      </div>
    </div>
  )
}
