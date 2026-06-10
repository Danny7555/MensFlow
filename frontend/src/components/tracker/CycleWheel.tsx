"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useEffectEvent } from 'react'

interface CycleWheelProps {
  cycleLength: number;
  currentDay: number;
  selectedDay: number;
  hoveredDay: number | null;
  periodLength: number;
  predictedPeriodLength: number;
  fertileStart: number;
  fertileEnd: number;
  upcomingStart: number;
  upcomingEnd: number;
  fertileColor?: string;
  /** When false, hides the fertile window arc on the wheel. Defaults to true. */
  showFertileWindow?: boolean;
  /** When true, renders the wheel as a dimmed, non-interactive placeholder (empty state) */
  dimmed?: boolean;
  onSelectDay: (day: number) => void;
  onHoverDay: (day: number | null) => void;
}

const radius = 44;
const center = 50;

function polarToCartesian(angleInDegrees: number, r = radius) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: center + r * Math.cos(angleInRadians),
    y: center + r * Math.sin(angleInRadians),
  };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(endAngle);
  const end = polarToCartesian(startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function CycleWheel({
  cycleLength,
  currentDay,
  selectedDay,
  hoveredDay,
  periodLength,
  predictedPeriodLength,
  fertileStart,
  fertileEnd,
  upcomingStart,
  upcomingEnd,
  fertileColor,
  showFertileWindow = true,
  dimmed = false,
  onSelectDay,
  onHoverDay,
}: CycleWheelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);

  const getAngle = useMemo(() => {
    return (day: number) => {
      return (day / cycleLength) * 360;
    };
  }, [cycleLength]);

  const periodPath = useMemo(() => describeArc(0, getAngle(periodLength)), [getAngle, periodLength]);
  
  const predictedPath = useMemo(() => {
    return describeArc(getAngle(periodLength), getAngle(periodLength + predictedPeriodLength));
  }, [getAngle, periodLength, predictedPeriodLength]);

  const fertilePath = useMemo(() => {
    return describeArc(getAngle(fertileStart - 1), getAngle(fertileEnd));
  }, [getAngle, fertileStart, fertileEnd]);

  const upcomingPath = useMemo(() => {
    return describeArc(getAngle(upcomingStart - 1), getAngle(upcomingEnd));
  }, [getAngle, upcomingStart, upcomingEnd]);

  const activeDay = hoveredDay ?? selectedDay;

  const getDayFromPointer = useCallback((event: PointerEvent | React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    const dx = local.x - center;
    const dy = local.y - center;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    const day = Math.floor((angle / 360) * cycleLength) + 1;
    return Math.min(cycleLength, Math.max(1, day));
  }, [cycleLength]);

  const selectDayFromPointer = useCallback((event: PointerEvent | React.PointerEvent) => {
    const day = getDayFromPointer(event);
    if (!day) return;
    onHoverDay(null);
    onSelectDay(day);
  }, [getDayFromPointer, onHoverDay, onSelectDay]);

  const onSelectDayEvent = useEffectEvent(selectDayFromPointer);

  useEffect(() => {
    if (!isDraggingMarker) return;

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      onSelectDayEvent(event);
    };
    const handlePointerUp = () => {
      setIsDraggingMarker(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingMarker]);

  const dots = useMemo(() => {
    return Array.from({ length: cycleLength }).map((_, i) => {
      const day = i + 1;
      const angle = getAngle(day - 0.5);
      const r = 37;
      const pos = polarToCartesian(angle, r);
      const isSelected = selectedDay === day;
      const isToday = currentDay === day;

      let color = 'transparent';
      if (day <= currentDay) {
        if (day <= periodLength) color = '#dc2626';
        else if (day === 7) color = '#2563eb';
        else if (day === 11) color = '#059669';
        else if (day === currentDay) color = '#1a4d57';
      }

      return (
        <g
          key={i}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => onHoverDay(day)}
          onMouseLeave={() => onHoverDay(null)}
          onClick={() => onSelectDay(day)}
        >
          <circle
            cx={pos.x}
            cy={pos.y}
            r={isSelected ? 3 : 2}
            fill={isSelected ? '#1a4d57' : color !== 'transparent' ? color : 'currentColor'}
            opacity={isSelected ? 1 : day <= periodLength ? 0.8 : 0.4}
          />
          {isToday && !isSelected && (
            <circle
              cx={pos.x}
              cy={pos.y}
              r="4"
              fill="none"
              stroke="#1a4d57"
              strokeWidth="0.5"
              opacity="0.5"
            />
          )}
        </g>
      );
    });
  }, [cycleLength, getAngle, selectedDay, currentDay, periodLength, onHoverDay, onSelectDay]);

  const currentPos = useMemo(() => {
    return polarToCartesian(getAngle(selectedDay - 0.5), 44);
  }, [getAngle, selectedDay]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className="viz-ring"
      style={{
        overflow: 'visible',
        ...(dimmed ? { opacity: 0.2, pointerEvents: 'none', filter: 'blur(0.5px)' } : {}),
      }}
    >
      {/* Background track (dashed) */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="opacity-10"
        strokeDasharray="0.1 2.5"
        strokeLinecap="round"
      />

      {/* Inner Dots */}
      {dots}

      {/* Segments */}
      <g className="viz-segments" style={{ pointerEvents: 'none' }}>
        <path d={periodPath} fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" opacity="1" />
        <path
          d={predictedPath}
          fill="none"
          stroke="#ffc7c8"
          strokeWidth="6"
          strokeLinecap="round"
          opacity={activeDay > periodLength && activeDay <= periodLength + predictedPeriodLength ? 1 : 0.8}
        />
        {showFertileWindow && (
          <path
            d={fertilePath}
            fill="none"
            stroke={fertileColor ?? "#26899e"}
            strokeWidth="6"
            strokeLinecap="round"
            opacity={activeDay >= fertileStart && activeDay <= fertileEnd ? 1 : 0.8}
          />
        )}
        <path d={upcomingPath} fill="none" stroke="currentColor" strokeWidth="6" className="opacity-20" strokeLinecap="round" />
      </g>

      {/* Selection Marker */}
      <circle
        cx={currentPos.x}
        cy={currentPos.y}
        r="9"
        fill="transparent"
        style={{ cursor: isDraggingMarker ? 'grabbing' : 'grab', pointerEvents: dimmed ? 'none' : 'auto' }}
        onPointerDown={(event) => {
          if (dimmed) return;
          event.preventDefault();
          event.stopPropagation();
          setIsDraggingMarker(true);
          selectDayFromPointer(event);
        }}
      />
      <circle
        cx={currentPos.x}
        cy={currentPos.y}
        r="4.5"
        fill="white"
        stroke="#1a4d57"
        strokeWidth="2"
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  );
}
