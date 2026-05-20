import { useState, useEffect, useRef, useMemo } from 'react'
import { Sparkle, Info } from '@phosphor-icons/react'

const ESTROGEN_PATH = "M 0 170 C 150 170, 300 160, 480 60 C 580 145, 680 170, 800 150 C 900 135, 960 170, 1000 175"
const PROGESTERONE_PATH = "M 0 175 C 200 175, 400 175, 550 170 C 680 160, 760 60, 830 60 C 880 60, 910 220, 930 220 C 950 220, 970 80, 1000 175"

const getLevelStrength = (levelStr: string) => {
  const str = levelStr.toLowerCase()
  if (str.includes('low') || str.includes('crashing')) return 1
  if (str.includes('rising') || str.includes('moderate') || str.includes('starting')) return 2
  if (str.includes('peaking') || str.includes('high')) return 3
  return 1
}

export function HormoneWave() {
  const [activeDay, setActiveDay] = useState(14)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const estrogenPathRef = useRef<SVGPathElement | null>(null)
  const progesteronePathRef = useRef<SVGPathElement | null>(null)

  // Intersection coordinates for active day on estrogen and progesterone curves
  const [intersections, setIntersections] = useState({ estY: 170, progY: 175 })
  const [isHovered, setIsHovered] = useState(false)
  const isDraggingRef = useRef(false)

  // Phase & Insight information
  const dayInsight = useMemo(() => {
    if (activeDay <= 5) {
      return {
        phase: 'Menstrual Phase (Days 1-5)',
        estrogen: 'Low',
        progesterone: 'Low',
        accentColor: '#f43f5e',
        description: 'Her body is shedding the uterine lining. Energy is naturally at its lowest.',
        supportTip: 'Offer a heating pad, prepare warm meals (soups/tea), and prioritize low-key nights in. Do not expect high physical activity.',
      }
    }
    if (activeDay <= 9) {
      return {
        phase: 'Early Follicular Phase (Days 6-9)',
        estrogen: 'Rising steadily',
        progesterone: 'Low',
        accentColor: '#0d9488',
        description: 'Estrogen is climbing, boosting her energy, mood, and cognitive sharpness.',
        supportTip: 'Great time to plan social activities, try new dates, or tackle collaborative projects. She is feeling more outgoing!',
      }
    }
    if (activeDay <= 16) {
      return {
        phase: 'Ovulatory Phase / Fertile Window (Days 10-16)',
        estrogen: 'Peaking high',
        progesterone: 'Low but starting to rise',
        accentColor: '#0ea5e9',
        description: 'Estrogen reaches its highest peak. She is in her fertile window and likely feels high confidence.',
        supportTip: 'Compliment her, schedule special romantic date nights, and enjoy her peak social and physical energy window.',
      }
    }
    if (activeDay <= 22) {
      return {
        phase: 'Mid-Luteal Phase (Days 17-22)',
        estrogen: 'Moderate second peak',
        progesterone: 'Peaking high',
        accentColor: '#d97706',
        description: 'Progesterone is peaking, which can make her feel calm, nesty, or slightly sleepy.',
        supportTip: 'Keep things cozy at home. Cook a comfort meal together. Understand if she prefers a quiet night over going out.',
      }
    }
    return {
      phase: 'Late Luteal / PMS Phase (Days 23-28)',
      estrogen: 'Crashing low',
      progesterone: 'Crashing low',
      accentColor: '#6b7280',
      description: 'Hormones drop sharply. This sudden shift often triggers fatigue, cravings, and mood fluctuations.',
      supportTip: 'Be extra patient. Bring her favorite snacks (like dark chocolate), handle chores without asking, and avoid starting heavy arguments.',
    }
  }, [activeDay])

  // Calculate curve intersection points based on active day
  useEffect(() => {
    const computeIntersectionPoints = () => {
      const getPointY = (pathEl: SVGPathElement | null, targetX: number): number => {
        if (!pathEl) return 0
        try {
          const length = pathEl.getTotalLength()
          let start = 0
          let end = length
          // Binary search coordinates
          for (let i = 0; i < 15; i++) {
            const mid = (start + end) / 2
            const pt = pathEl.getPointAtLength(mid)
            if (pt.x < targetX) {
              start = mid
            } else {
              end = mid
            }
          }
          return pathEl.getPointAtLength((start + end) / 2).y
        } catch (e) {
          return 0
        }
      }

      const targetX = ((activeDay - 1) / 27) * 1000
      const newEstY = getPointY(estrogenPathRef.current, targetX)
      const newProgY = getPointY(progesteronePathRef.current, targetX)

      setIntersections({
        estY: newEstY !== 0 ? newEstY : 170,
        progY: newProgY !== 0 ? newProgY : 175
      })
    }

    // Delay briefly to allow SVG to fully mount and lengths to load
    const timer = setTimeout(computeIntersectionPoints, 30)
    return () => clearTimeout(timer)
  }, [activeDay])



  // Scrub handler triggered on hover move / click drag
  const handleSvgScrub = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width))
    const day = Math.round(percentage * 27) + 1
    setActiveDay(day)
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return // Only left click
    isDraggingRef.current = true
    handleSvgScrub(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingRef.current || isHovered) {
      handleSvgScrub(e.clientX)
    }
  }

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    isDraggingRef.current = true
    if (e.touches.length > 0) {
      handleSvgScrub(e.touches[0].clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      handleSvgScrub(e.touches[0].clientX)
    }
  }

  // Keyboard accessibility arrow controls
  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
      setActiveDay((prev) => Math.min(28, prev + 1))
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
      setActiveDay((prev) => Math.max(1, prev - 1))
      e.preventDefault()
    }
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('touchend', handleGlobalMouseUp, { passive: true })
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('touchend', handleGlobalMouseUp)
    }
  }, [])


  const activePercent = ((activeDay - 1) / 27) * 1000

  return (
    <div className="flo-card flo-card--prominent p-6 relative overflow-hidden group transition-all duration-500 mb-8" ref={containerRef}>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-fit text-[9px] font-normal uppercase tracking-[0.12em] bg-pink-500 text-white px-3 py-1.5 rounded-full">
              HORMONE MATRIX
            </span>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 font-normal">
              <Sparkle size={12} weight="fill" />
              <span>Interactive Wave</span>
            </div>
          </div>
          <h3 className="text-xl font-normal text-[var(--mf-text-strong)] tracking-tight">
            Estrogen & Progesterone Trends
          </h3>
          <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 max-w-xl leading-relaxed">
            Hormone Guide: Estrogen drives physical energy, positive mood, and social confidence. Progesterone promotes physical relaxation and calm, but its drop can trigger premenstrual sensitivity.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-normal">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-2 rounded-full bg-pink-500" />
            <span className="text-[var(--mf-text)] font-normal">Estrogen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-2 rounded-full bg-violet-600" />
            <span className="text-[var(--mf-text)] font-normal">Progesterone</span>
          </div>
        </div>
      </div>

      {/* SVG Waves Container */}
      <div className="relative h-44 w-full border-b border-dashed border-[var(--mf-border)]/50 mb-6 z-10">
        {/* Helper overlay instruction on hover */}
        {isHovered && (
          <div className="absolute top-0 right-0 flex items-center gap-1 text-[9px] text-[var(--mf-muted)] bg-[var(--mf-card)]/80 backdrop-blur-sm border border-[var(--mf-border)] px-2 py-0.5 rounded-full pointer-events-none select-none transition-all duration-300 animate-pulse">
            <span>Drag or hover wave to explore</span>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox="0 0 1000 248"
          className="w-full h-full overflow-visible cursor-ew-resize select-none focus:outline-none focus:ring-1 focus:ring-[var(--mf-accent)] rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false)
            isDraggingRef.current = false
          }}
          onKeyDown={handleKeyDown}
          role="application"
          aria-label="Interactive hormone wave chart"
          tabIndex={0}
        >
          <defs>
            <linearGradient id="estrogenGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff6b8b" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <linearGradient id="progesteroneGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="estrogenAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b8b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ff6b8b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="progesteroneAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Phase Columns */}
          <g opacity="0.03" className="transition-all duration-300 pointer-events-none">
            <rect x="0" y="0" width="148" height="225" fill="#f43f5e" />
            <rect x="148" y="0" width="148" height="225" fill="#0d9488" />
            <rect x="296" y="0" width="259" height="225" fill="#0ea5e9" />
            <rect x="555" y="0" width="222" height="225" fill="#d97706" />
            <rect x="777" y="0" width="223" height="225" fill="#6b7280" />
          </g>

          {/* Phase boundary dashed separator lines */}
          <g opacity="0.15" stroke="var(--mf-text)" strokeWidth="1" strokeDasharray="3,3" className="pointer-events-none">
            <line x1="148" y1="0" x2="148" y2="225" />
            <line x1="296" y1="0" x2="296" y2="225" />
            <line x1="555" y1="0" x2="555" y2="225" />
            <line x1="777" y1="0" x2="777" y2="225" />
          </g>

          {/* Grid lines (Subtle background horizontal guides) */}
          <g opacity="0.3" className="pointer-events-none">
            <line x1="0" y1="60" x2="1000" y2="60" stroke="var(--mf-border)" strokeWidth="1" strokeDasharray="6,6" />
            <line x1="0" y1="120" x2="1000" y2="120" stroke="var(--mf-border)" strokeWidth="1" strokeDasharray="6,6" />
            <line x1="0" y1="180" x2="1000" y2="180" stroke="var(--mf-border)" strokeWidth="1" strokeDasharray="6,6" />
          </g>

          {/* Phase label text at the bottom */}
          <g className="text-[9.5px] font-normal tracking-wide pointer-events-none select-none" fill="var(--mf-muted)" opacity="0.75">
            <text x="74" y="240" textAnchor="middle">Days 1-5: Menstrual</text>
            <text x="222" y="240" textAnchor="middle">Days 6-9: Follicular</text>
            <text x="425" y="240" textAnchor="middle">Days 10-16: Fertile Window</text>
            <text x="666" y="240" textAnchor="middle">Days 17-22: Mid-Luteal</text>
            <text x="888" y="240" textAnchor="middle">Days 23-28: PMS Phase</text>
          </g>

          {/* Translucent Area Fills */}
          <path
            d={`${ESTROGEN_PATH} L 1000 225 L 0 225 Z`}
            fill="url(#estrogenAreaGrad)"
            className="pointer-events-none"
          />
          <path
            d={`${PROGESTERONE_PATH} L 1000 225 L 0 225 Z`}
            fill="url(#progesteroneAreaGrad)"
            className="pointer-events-none"
          />

          {/* Estrogen Ribbon */}
          <path
            ref={estrogenPathRef}
            d={ESTROGEN_PATH}
            fill="none"
            stroke="url(#estrogenGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Progesterone Ribbon */}
          <path
            ref={progesteronePathRef}
            d={PROGESTERONE_PATH}
            fill="none"
            stroke="url(#progesteroneGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Day Vertical Scrub Line (Ladder ticks) */}
          <g className="transition-all duration-300 pointer-events-none">
            {/* Main vertical line */}
            <line
              x1={activePercent}
              y1="15"
              x2={activePercent}
              y2="225"
              stroke={dayInsight.accentColor}
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.85"
            />
            {/* Vertical connection line between Estrogen & Progesterone level intersections */}
            {intersections.estY !== 0 && intersections.progY !== 0 && (
              <line
                x1={activePercent}
                y1={intersections.estY}
                x2={activePercent}
                y2={intersections.progY}
                stroke={dayInsight.accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.5"
              />
            )}
            {/* Ladder steps */}
            {Array.from({ length: 24 }).map((_, idx) => {
              const y = 30 + idx * 7.5
              return (
                <line
                  key={idx}
                  x1={activePercent - 8}
                  y1={y}
                  x2={activePercent + 8}
                  y2={y}
                  stroke={dayInsight.accentColor}
                  strokeWidth="1.5"
                  opacity="0.65"
                />
              )
            })}

            {/* Estrogen intersection glowing marker */}
            {intersections.estY !== 0 && (
              <g>
                <circle cx={activePercent} cy={intersections.estY} r={5} fill="white" stroke="#ec4899" strokeWidth={2.5} />
                <circle cx={activePercent} cy={intersections.estY} r={1.5} fill="#ec4899" />
              </g>
            )}

            {/* Progesterone intersection glowing marker */}
            {intersections.progY !== 0 && (
              <g>
                <circle cx={activePercent} cy={intersections.progY} r={5} fill="white" stroke="#8b5cf6" strokeWidth={2.5} />
                <circle cx={activePercent} cy={intersections.progY} r={1.5} fill="#8b5cf6" />
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Scrub Slider */}
      <div className="relative z-10 flex flex-col gap-2 mb-6">
        <style>{`
          .hormone-range-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid ${dayInsight.accentColor};
            cursor: pointer;
            transition: transform 0.1s ease, border-color 0.2s ease;
          }
          .hormone-range-input::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
          .hormone-range-input::-webkit-slider-thumb:active {
            transform: scale(0.95);
          }
          .hormone-range-input::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid ${dayInsight.accentColor};
            cursor: pointer;
            transition: transform 0.1s ease, border-color 0.2s ease;
          }
          .hormone-range-input::-moz-range-thumb:hover {
            transform: scale(1.15);
          }
          .hormone-range-input::-moz-range-thumb:active {
            transform: scale(0.95);
          }
        `}</style>
        <div className="flex justify-between items-center text-xs text-[var(--mf-muted)] mb-1">
          <span className="font-normal text-[var(--mf-text-strong)] flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: dayInsight.accentColor }} />
            Day {activeDay} of 28
          </span>
          <span
            className="text-[11px] font-normal px-2.5 py-0.5 rounded-full border transition-all duration-300"
            style={{
              color: dayInsight.accentColor,
              borderColor: `${dayInsight.accentColor}30`,
              backgroundColor: `${dayInsight.accentColor}10`
            }}
          >
            {dayInsight.phase}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="28"
            value={activeDay}
            onChange={(e) => setActiveDay(parseInt(e.target.value))}
            className="hormone-range-input w-full h-1.5 bg-[var(--mf-border)] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--mf-accent)]"
          />
        </div>
        <div className="flex justify-between text-[9px] text-[var(--mf-muted)] px-1 mt-0.5 font-normal select-none pointer-events-none opacity-80">
          <span>Day 1</span>
          <span>Day 7</span>
          <span>Day 14 (Ovulation)</span>
          <span>Day 21</span>
          <span>Day 28</span>
        </div>
      </div>

      {/* Info Output Dashboard */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-3xl bg-[var(--mf-composer-bg)]/90 border border-[var(--mf-border)]">
        <div>
          <h4 className="text-xs font-normal text-[var(--mf-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info size={14} className="text-[var(--mf-muted)]" />
            Biological Snapshot
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--mf-border)]/50 pb-2">
              <span className="text-[var(--mf-text)] font-normal">Estrogen Level:</span>
              <div className="flex items-center gap-2">
                <span className="font-normal text-pink-500">{dayInsight.estrogen}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 3 }).map((_, idx) => {
                    const estStrength = getLevelStrength(dayInsight.estrogen)
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${idx < estStrength ? 'bg-pink-500' : 'bg-[var(--mf-border)]'
                          }`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-[var(--mf-border)]/50 pb-2">
              <span className="text-[var(--mf-text)] font-normal">Progesterone Level:</span>
              <div className="flex items-center gap-2">
                <span className="font-normal text-violet-500">{dayInsight.progesterone}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 3 }).map((_, idx) => {
                    const progStrength = getLevelStrength(dayInsight.progesterone)
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${idx < progStrength ? 'bg-violet-500' : 'bg-[var(--mf-border)]'
                          }`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            <p className="text-[var(--mf-text)] leading-relaxed pt-1 text-[11.5px] font-normal">
              {dayInsight.description}
            </p>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-[var(--mf-border)]/50 pt-4 md:pt-0 md:pl-6 flex flex-col">
          <h4 className="text-xs font-normal text-[var(--mf-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkle size={14} className="text-amber-500" />
            Empathy Support Guide
          </h4>
          <p className="text-[11.5px] text-[var(--mf-text)] leading-relaxed font-normal bg-[var(--mf-hover)]/30 p-3.5 rounded-2xl border border-[var(--mf-border)]/40 flex-grow">
            {dayInsight.supportTip}
          </p>
        </div>
      </div>
    </div>
  )
}
