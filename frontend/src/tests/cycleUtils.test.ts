import { describe, it, expect } from 'vitest'
import {
  computeCycleDay,
  getPhaseFromDay,
  getPhaseInfo,
  calculatePeriodsFromLogs,
  getPhaseTasks,
  getGreeting,
} from '../lib/cycleUtils'

describe('computeCycleDay', () => {
  it('returns 1 for a start date of today', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(computeCycleDay(today, 28)).toBe(1)
  })

  it('returns correct day for a known offset', () => {
    const start = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10)
    expect(computeCycleDay(start, 28)).toBe(14)
  })

  it('wraps around cycle length', () => {
    const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const day = computeCycleDay(start, 28)
    expect(day).toBeGreaterThanOrEqual(1)
    expect(day).toBeLessThanOrEqual(28)
  })

  it('clamps cycle length to 15-60 range', () => {
    const start = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10)
    expect(computeCycleDay(start, 5)).toBeLessThanOrEqual(15)
    expect(computeCycleDay(start, 100)).toBeLessThanOrEqual(60)
  })

  it('returns 1 for invalid start date', () => {
    expect(computeCycleDay('invalid-date', 28)).toBe(1)
  })
})

describe('getPhaseFromDay', () => {
  it('returns menstrual for days 1-5', () => {
    expect(getPhaseFromDay(1, 28)).toBe('menstrual')
    expect(getPhaseFromDay(3, 28)).toBe('menstrual')
    expect(getPhaseFromDay(5, 28)).toBe('menstrual')
  })

  it('returns follicular after period before fertile window', () => {
    expect(getPhaseFromDay(8, 28)).toBe('follicular')
  })

  it('returns fertile in the fertile window', () => {
    const ovulationDay = 14 // 28 - 14
    const fertileStart = ovulationDay - 4 // day 10
    const fertileEnd = ovulationDay + 2  // day 16
    expect(getPhaseFromDay(fertileStart, 28)).toBe('fertile')
    expect(getPhaseFromDay(fertileEnd, 28)).toBe('fertile')
  })

  it('returns luteal after fertile window', () => {
    expect(getPhaseFromDay(20, 28)).toBe('luteal')
    expect(getPhaseFromDay(28, 28)).toBe('luteal')
  })

  it('shifts ovulation based on LH peak', () => {
    expect(getPhaseFromDay(15, 28, 14)).toBe('fertile')
  })

  it('shifts ovulation based on egg white mucus', () => {
    expect(getPhaseFromDay(15, 28, undefined, 15)).toBe('fertile')
  })

  it('ignores invalid LH peak outside bounds', () => {
    expect(getPhaseFromDay(14, 28, 1)).toBe('fertile')
    expect(getPhaseFromDay(14, 28, 30)).toBe('fertile')
  })

  it('handles short cycles correctly', () => {
    const periodLen = 4
    for (let d = 1; d <= periodLen; d++) {
      expect(getPhaseFromDay(d, 21)).toBe('menstrual')
    }
    // Day 5 is already fertile window for a 21-day cycle (ovulation ~day 7)
    expect(getPhaseFromDay(5, 21)).toBe('fertile')
    expect(getPhaseFromDay(15, 21)).toBe('luteal')
  })

  it('handles long cycles correctly', () => {
    const periodLen = 6
    for (let d = 1; d <= periodLen; d++) {
      expect(getPhaseFromDay(d, 40)).toBe('menstrual')
    }
  })
})

describe('getPhaseInfo', () => {
  it('returns correct info for menstrual phase', () => {
    const info = getPhaseInfo('menstrual')
    expect(info.label).toBe('Menstrual')
    expect(info.color).toBe('#f43f5e')
  })

  it('returns correct info for all phases', () => {
    const phases = ['menstrual', 'follicular', 'fertile', 'luteal'] as const
    for (const phase of phases) {
      const info = getPhaseInfo(phase)
      expect(info.label).toBeTruthy()
      expect(info.color).toBeTruthy()
      expect(info.description).toBeTruthy()
    }
  })

  it('returns unknown for invalid phase', () => {
    const info = getPhaseInfo('invalid' as never)
    expect(info.label).toBe('Unknown')
  })
})

describe('calculatePeriodsFromLogs', () => {
  it('returns empty array for no flow logs', () => {
    const logs = [
      { date: '2026-06-18', symptoms: ['cramps'] },
    ]
    expect(calculatePeriodsFromLogs(logs)).toEqual([])
  })

  it('detects a single period', () => {
    const logs = [
      { date: '2026-06-01', symptoms: ['flow-heavy'] },
      { date: '2026-06-02', symptoms: ['flow-medium'] },
      { date: '2026-06-03', symptoms: ['flow-light'] },
    ]
    const result = calculatePeriodsFromLogs(logs)
    expect(result).toHaveLength(1)
    expect(result[0].startDate).toBe('2026-06-01')
    expect(result[0].duration).toBe(3)
  })

  it('detects two separate periods with gap > 4 days', () => {
    const logs = [
      { date: '2026-06-01', symptoms: ['flow-heavy'] },
      { date: '2026-06-02', symptoms: ['flow-medium'] },
      { date: '2026-06-20', symptoms: ['flow-light'] },
      { date: '2026-06-21', symptoms: ['flow-medium'] },
    ]
    const result = calculatePeriodsFromLogs(logs)
    expect(result).toHaveLength(2)
    expect(result[1].startDate).toBe('2026-06-01')
    expect(result[1].duration).toBe(2)
    expect(result[0].startDate).toBe('2026-06-20')
    expect(result[0].duration).toBe(2)
  })

  it('calculates cycle length between periods', () => {
    const logs = [
      { date: '2026-06-01', symptoms: ['flow-heavy'] },
      { date: '2026-06-02', symptoms: ['flow-medium'] },
      { date: '2026-07-01', symptoms: ['flow-light'] },
    ]
    const result = calculatePeriodsFromLogs(logs)
    expect(result[1].cycleLength).toBe(30)
  })

  it('returns most recent period first (reversed)', () => {
    const logs = [
      { date: '2026-06-01', symptoms: ['flow-heavy'] },
      { date: '2026-07-01', symptoms: ['flow-heavy'] },
      { date: '2026-08-01', symptoms: ['flow-heavy'] },
    ]
    const result = calculatePeriodsFromLogs(logs)
    expect(result[0].startDate).toBe('2026-08-01')
    expect(result[1].startDate).toBe('2026-07-01')
    expect(result[2].startDate).toBe('2026-06-01')
  })
})

describe('getPhaseTasks', () => {
  it('returns menstrual tasks for menstrual phase', () => {
    const tasks = getPhaseTasks('menstrual')
    expect(tasks.some(t => t.id.startsWith('m-'))).toBe(true)
  })

  it('returns follicular tasks for follicular phase', () => {
    const tasks = getPhaseTasks('follicular')
    expect(tasks.some(t => t.id.startsWith('f-'))).toBe(true)
  })

  it('returns ovulatory tasks for fertile/ovulatory phase', () => {
    const tasks = getPhaseTasks('ovulatory')
    expect(tasks.some(t => t.id.startsWith('o-'))).toBe(true)
    const tasks2 = getPhaseTasks('fertile window')
    expect(tasks2.some(t => t.id.startsWith('o-'))).toBe(true)
  })

  it('returns luteal tasks by default', () => {
    const tasks = getPhaseTasks('unknown')
    expect(tasks.some(t => t.id.startsWith('l-'))).toBe(true)
  })
})

describe('getGreeting', () => {
  it('returns a greeting string', () => {
    const greeting = getGreeting()
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting)
  })
})
