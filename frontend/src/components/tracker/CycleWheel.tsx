"use client"

import { useMemo } from 'react'

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
  onSelectDay: (day: number) => void;
  onHoverDay: (day: number | null) => void;
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
  onSelectDay,
  onHoverDay,
}: CycleWheelProps) {
  const radius = 44;
  const center = 50;

  const polarToCartesian = useMemo(() => {
    return (angleInDegrees: number, r = radius) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: center + r * Math.cos(angleInRadians),
        y: center + r * Math.sin(angleInRadians),
      };
    };
  }, [radius, center]);

  const describeArc = useMemo(() => {
    return (startAngle: number, endAngle: number) => {
      const start = polarToCartesian(endAngle);
      const end = polarToCartesian(startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };
  }, [polarToCartesian, radius]);

  const getAngle = useMemo(() => {
    return (day: number) => {
      return (day / cycleLength) * 360;
    };
  }, [cycleLength]);

  const periodPath = useMemo(() => describeArc(0, getAngle(periodLength)), [describeArc, getAngle, periodLength]);
  
  const predictedPath = useMemo(() => {
    return describeArc(getAngle(periodLength), getAngle(periodLength + predictedPeriodLength));
  }, [describeArc, getAngle, periodLength, predictedPeriodLength]);

  const fertilePath = useMemo(() => {
    return describeArc(getAngle(fertileStart - 1), getAngle(fertileEnd));
  }, [describeArc, getAngle, fertileStart, fertileEnd]);

  const upcomingPath = useMemo(() => {
    return describeArc(getAngle(upcomingStart - 1), getAngle(upcomingEnd));
  }, [describeArc, getAngle, upcomingStart, upcomingEnd]);

  const activeDay = hoveredDay ?? selectedDay;

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
  }, [cycleLength, getAngle, polarToCartesian, selectedDay, currentDay, periodLength, onHoverDay, onSelectDay]);

  const currentPos = useMemo(() => {
    return polarToCartesian(getAngle(selectedDay - 0.5), 44);
  }, [polarToCartesian, getAngle, selectedDay]);

  return (
    <svg viewBox="0 0 100 100" className="viz-ring" style={{ overflow: 'visible' }}>
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
        <path
          d={fertilePath}
          fill="none"
          stroke="#26899e"
          strokeWidth="6"
          strokeLinecap="round"
          opacity={activeDay >= fertileStart && activeDay <= fertileEnd ? 1 : 0.8}
        />
        <path d={upcomingPath} fill="none" stroke="currentColor" strokeWidth="6" className="opacity-20" strokeLinecap="round" />
      </g>

      {/* Selection Marker */}
      <circle
        cx={currentPos.x}
        cy={currentPos.y}
        r="4.5"
        fill="white"
        stroke="#1a4d57"
        strokeWidth="2"
      />
    </svg>
  );
}
