import { useState, useEffect, useRef } from 'react'

const ESTROGEN_PATH = "M 0 170 C 150 170, 300 160, 480 60 C 580 145, 680 170, 800 150 C 900 135, 960 170, 1000 175"
const PROGESTERONE_PATH = "M 0 175 C 200 175, 400 175, 550 170 C 680 160, 760 60, 830 60 C 880 60, 910 220, 930 220 C 950 220, 970 80, 1000 175"

interface HormoneWaveChartProps {
  activeDay: number
  setActiveDay: (day: number) => void
  accentColor: string
}

export function HormoneWaveChart({ activeDay, setActiveDay, accentColor }: HormoneWaveChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const estrogenPathRef = useRef<SVGPathElement | null>(null)
  const progesteronePathRef = useRef<SVGPathElement | null>(null)

  const [intersections, setIntersections] = useState({ estY: 170, progY: 175 })
  const [isHovered, setIsHovered] = useState(false)
  const isDraggingRef = useRef(false)

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
        } catch (_) {
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

  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
      setActiveDay(Math.min(28, activeDay + 1))
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
      setActiveDay(Math.max(1, activeDay - 1))
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
    <div className="relative h-20 md:h-24 w-full border-b border-dashed border-[var(--mf-border)]/50 mb-2.5 z-10">
      {/* Helper overlay instruction on hover */}
      {isHovered && (
        <div className="absolute top-0 right-0 flex items-center gap-1 text-[9px] text-[var(--mf-muted)] bg-[var(--mf-card)]/80 backdrop-blur-sm border border-[var(--mf-border)] px-2 py-0.5 rounded-full pointer-events-none select-none transition-all duration-300 animate-pulse">
          <span>Drag or hover wave to explore</span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 1000 220"
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
          <rect x="0" y="0" width="148" height="195" fill="#f43f5e" />
          <rect x="148" y="0" width="148" height="195" fill="#0d9488" />
          <rect x="296" y="0" width="259" height="195" fill="#0ea5e9" />
          <rect x="555" y="0" width="222" height="195" fill="#d97706" />
          <rect x="777" y="0" width="223" height="195" fill="#6b7280" />
        </g>

        {/* Phase boundary dashed separator lines */}
        <g opacity="0.15" stroke="var(--mf-text)" strokeWidth="1" strokeDasharray="3,3" className="pointer-events-none">
          <line x1="148" y1="0" x2="148" y2="195" />
          <line x1="296" y1="0" x2="296" y2="195" />
          <line x1="555" y1="0" x2="555" y2="195" />
          <line x1="777" y1="0" x2="777" y2="195" />
        </g>

        {/* Grid lines (Subtle background horizontal guides) */}
        <g opacity="0.3" className="pointer-events-none">
          <line x1="0" y1="45" x2="1000" y2="45" stroke="var(--mf-border)" strokeWidth="1" strokeDasharray="6,6" />
          <line x1="0" y1="90" x2="1000" y2="90" stroke="var(--mf-border)" strokeWidth="1" strokeDasharray="6,6" />
          <line x1="0" y1="135" x2="1000" y2="135" stroke="var(--mf-border)" strokeWidth="1" strokeDasharray="6,6" />
        </g>

        {/* Phase label text at the bottom */}
        <g className="text-[9px] font-normal tracking-wide pointer-events-none select-none" fill="var(--mf-muted)" opacity="0.75">
          <text x="74" y="212" textAnchor="middle">Days 1-5: Menstrual</text>
          <text x="222" y="212" textAnchor="middle">Days 6-9: Follicular</text>
          <text x="425" y="212" textAnchor="middle">Days 10-16: Fertile Window</text>
          <text x="666" y="212" textAnchor="middle">Days 17-22: Mid-Luteal</text>
          <text x="888" y="212" textAnchor="middle">Days 23-28: PMS Phase</text>
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
            y2="195"
            stroke={accentColor}
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
              stroke={accentColor}
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.5"
            />
          )}
          {/* Ladder steps */}
          {Array.from({ length: 18 }).map((_, idx) => {
            const y = 30 + idx * 8
            return (
              <line
                key={idx}
                x1={activePercent - 8}
                y1={y}
                x2={activePercent + 8}
                y2={y}
                stroke={accentColor}
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
  )
}
