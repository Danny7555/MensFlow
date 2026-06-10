"use client"

import * as React from "react"
import { Plus, X, CaretLeft, CaretRight, Drop, PencilSimple, Check, CalendarBlank } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { cn } from "@/lib/utils"
import { useStore } from "@/store/useStore"
import { LogSymptomsModal } from "@/components/tracker/LogSymptomsModal"
import { RequestAccessModal } from "@/components/dashboard/RequestAccessModal"

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

type CalendarState = {
  viewDate: Date
  selectedDate: Date
  isEditingPeriods: boolean
  periodDates: Set<string>
  today: Date
}

type CalendarAction =
  | { type: "SET_VIEW_DATE"; payload: Date }
  | { type: "SET_SELECTED_DATE"; payload: Date }
  | { type: "SET_EDITING_PERIODS"; payload: boolean }
  | { type: "TOGGLE_PERIOD_DATE"; payload: string }
  | { type: "SET_PERIOD_DATES"; payload: Set<string> }
  | { type: "INIT_CLIENT_DATE"; payload: { today: Date; periodDates: Set<string>; viewDate: Date } }

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "SET_VIEW_DATE":
      return { ...state, viewDate: action.payload }
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload }
    case "SET_EDITING_PERIODS":
      return { ...state, isEditingPeriods: action.payload }
    case "SET_PERIOD_DATES":
      return { ...state, periodDates: action.payload }
    case "TOGGLE_PERIOD_DATE": {
      const next = new Set(state.periodDates)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, periodDates: next }
    }
    case "INIT_CLIENT_DATE":
      return {
        ...state,
        selectedDate: action.payload.today,
        viewDate: action.payload.viewDate,
        periodDates: action.payload.periodDates,
        today: action.payload.today,
      }
    default:
      return state
  }
}

import { useAuth } from "@/context/useAuth"


export function CalendarView() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const { user, logs, fetchLogs, addLog, dashboard: ownDashboard, settings, partnerStatus, fetchPartnerStatus, requestDetailedAccessAction, isSaving } = useStore()
  const [showAccessModal, setShowAccessModal] = React.useState(false)
  const [requestSent, setRequestSent] = React.useState(false)
  const isPartner = user?.role === 'partner'
  const data = (isPartner && partnerStatus?.paired && partnerStatus?.cycle) ? partnerStatus.cycle : ownDashboard
  const showRestrictedView = isPartner && partnerStatus?.paired && partnerStatus?.privacyShareCycleDetails === false

  const handleConfirmAccessRequest = async (selectedFields: string[]) => {
    setShowAccessModal(false)
    setRequestSent(true)
    await requestDetailedAccessAction(selectedFields)
    await fetchPartnerStatus()
  }



  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(['month', 'year'] as const)
      .withDefault('month')
      .withOptions({ shallow: false })
  )
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(true)
  
  const [state, dispatch] = React.useReducer(calendarReducer, {
    viewDate: new Date(2026, 4, 1),
    selectedDate: new Date(2026, 4, 20),
    isEditingPeriods: false,
    periodDates: new Set<string>(),
    today: new Date(2026, 4, 20)
  })
  const { viewDate, selectedDate, isEditingPeriods, periodDates } = state

  React.useEffect(() => {
    const clientToday = new Date()
    const y = clientToday.getFullYear()
    const m = clientToday.getMonth()
    
    dispatch({
      type: "INIT_CLIENT_DATE",
      payload: {
        today: clientToday,
        viewDate: new Date(y, m, 1),
        periodDates: new Set<string>()
      }
    })

    void fetchLogs()
    if (isPartner) {
      void fetchPartnerStatus()
    }
  }, [fetchLogs, fetchPartnerStatus, isPartner])

  React.useEffect(() => {
    const dates = new Set<string>()
    logs.forEach((log) => {
      if (log.symptoms.some((s) => s.startsWith("flow-"))) {
        dates.add(log.date)
      }
    })

    if (!isEditingPeriods) {
      const periodStart = getLatestLoggedPeriodStart(logs) || data.lastPeriodStart
      if (periodStart) {
        addPredictedPeriodDates({
          dates,
          periodStart,
          cycleLength: data.typicalCycleDays || settings.cycleAvgLengthDays,
          periodDuration: settings.cyclePeriodLengthDays,
          viewYear: viewDate.getFullYear(),
        })
      }
    }

    dispatch({ type: "SET_PERIOD_DATES", payload: dates })
  }, [data.lastPeriodStart, data.typicalCycleDays, logs, settings.cycleAvgLengthDays, settings.cyclePeriodLengthDays, viewDate, isEditingPeriods])

  const handleTogglePeriod = async (dateKey: string) => {
    dispatch({ type: "TOGGLE_PERIOD_DATE", payload: dateKey })

    const existingLog = logs.find((l) => l.date === dateKey)
    const existingSymptoms = existingLog?.symptoms ?? []
    const isPeriod = existingSymptoms.some((s) => s.startsWith("flow-"))

    let nextSymptoms: string[]
    if (isPeriod) {
      nextSymptoms = existingSymptoms.filter((s) => !s.startsWith("flow-"))
    } else {
      nextSymptoms = [...existingSymptoms, "flow-medium"]
    }

    await addLog(dateKey, nextSymptoms)
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const prevMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month - 1, 1) })
  const nextMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month + 1, 1) })
  const prevYear = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year - 1, month, 1) })
  const nextYear = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year + 1, month, 1) })



  if (showRestrictedView) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center space-y-5">
          <div className="size-16 rounded-2xl bg-[var(--mf-accent)]/10 text-[var(--mf-accent)] flex items-center justify-center mx-auto">
            <CalendarBlank size={32} weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-normal text-foreground mb-2">Calendar access is private</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ask your partner to approve calendar and tracker access so you can see forecasts and cycle timing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAccessModal(true)}
            disabled={requestSent || isSaving}
            className="btn btn-primary px-6 py-3 rounded-full disabled:opacity-60"
          >
            {requestSent ? 'Request sent' : 'Request access'}
          </button>
        </div>
        <RequestAccessModal
          open={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          onConfirm={handleConfirmAccessRequest}
          isLoading={isSaving}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-auto relative" suppressHydrationWarning>
      {/* Decorative background image - matching Symptoms (Tracker) view style */}
      <div className="absolute right-0 top-20 opacity-10 pointer-events-none z-0">
        <img src="/images/girl.png" alt="" className="size-[800px] object-contain" />
      </div>

      <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        
        {/* Top Control Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 px-6 mb-8 text-center">
          <div className="flex justify-center sm:justify-start order-2 sm:order-1">
            <div className="ios-segmented-control max-w-[200px] mx-auto sm:mx-0">
              <button type="button"
                onClick={() => setView("month")}
                className={cn(
                  "ios-segmented-control-item",
                  view === "month" && "active"
                )}
              >
                Month
              </button>
              <button type="button"
                onClick={() => setView("year")}
                className={cn(
                  "ios-segmented-control-item",
                  view === "year" && "active"
                )}
              >
                Year
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 order-1 sm:order-2">
            <Button variant="ghost" size="icon" onClick={view === "month" ? prevMonth : prevYear} className="rounded-full">
              <CaretLeft className="size-5" />
            </Button>
            <h2 className="text-xl sm:text-2xl font-normal text-foreground min-w-[140px] text-center">
              {view === "month" ? `${viewDate.toLocaleString("default", { month: "long" })} ${year}` : year}
            </h2>
            <Button variant="ghost" size="icon" onClick={view === "month" ? nextMonth : nextYear} className="rounded-full">
              <CaretRight className="size-5" />
            </Button>
          </div>

          <div className="flex justify-center sm:justify-end order-3">
            {!isPartner && (
              <Button 
                variant={isEditingPeriods ? "default" : "outline"}
                onClick={() => isAuthenticated ? dispatch({ type: "SET_EDITING_PERIODS", payload: !isEditingPeriods }) : openAuthModal()}
                className={cn(
                  "rounded-full text-xs font-normal gap-2",
                  isEditingPeriods ? "bg-[var(--mf-danger)]/10 text-[var(--mf-danger)] border-[var(--mf-danger)]/30 hover:bg-[var(--mf-danger)]/20" : ""
                )}
              >
                {isEditingPeriods ? (
                  <>
                    <Check size={14} weight="regular" />
                    <span>Finish Editing</span>
                  </>
                ) : (
                  <>
                    <PencilSimple size={14} weight="bold" />
                    <span>Edit Periods</span>
                  </>
                )}
              </Button>
            )}
            {isPartner && (
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted px-4 py-2 rounded-full border border-border/40">
                View-Only Mode
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          {view === "month" ? (
            <MonthView 
              viewDate={viewDate} 
              selectedDate={selectedDate}
              isEditingPeriods={isEditingPeriods}
              periodDates={periodDates}
              data={data}
              onSelectDate={(date) => {
                dispatch({ type: "SET_SELECTED_DATE", payload: date })
                setIsDetailSheetOpen(true)
              }}
              onTogglePeriod={handleTogglePeriod}
            />
          ) : (
            <YearView 
              viewDate={viewDate} 
              periodDates={periodDates}
              today={state.today}
              onMonthClick={(d) => {
                dispatch({ type: "SET_VIEW_DATE", payload: d })
                setView("month")
              }}
            />
          )}

          {!isAuthenticated && (
            <div className="absolute inset-x-[-24px] bottom-[-24px] top-[200px] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20 flex flex-col items-center justify-center pt-24">
              <div className="w-full h-full backdrop-blur-[6px] opacity-100" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-auto">
                 <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto">
                  <h3 className="text-xl font-normal mb-2">Track your patterns</h3>
                  <p className="text-muted-foreground text-sm mb-6">Unlock period editing, symptom logging, and historical calendar views by signing in.</p>
                  <button type="button" 
                    onClick={() => openAuthModal()}
                    className="btn btn-primary px-8 py-3 rounded-full"
                  >
                    Log in to access
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailSheet
        selectedDate={selectedDate}
        isAuthenticated={isAuthenticated}
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        onOpenAuth={openAuthModal}
      />
    </div>
  )
}

function MonthView({ 
  viewDate, 
  selectedDate, 
  isEditingPeriods, 
  periodDates, 
  data,
  onSelectDate,
  onTogglePeriod 
}: { 
  viewDate: Date
  selectedDate: Date
  isEditingPeriods: boolean
  periodDates: Set<string>
  data: { lastPeriodStart: string; typicalCycleDays: number }
  onSelectDate: (date: Date) => void
  onTogglePeriod: (dateKey: string) => void
}) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = new Date(year, month, 1).getDay()

  const dateToKey = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const handleDayClick = (d: number) => {
    if (isEditingPeriods) {
      onTogglePeriod(dateToKey(d))
    } else {
      onSelectDate(new Date(year, month, d))
    }
  }

  // Calculate ovulation day based on typical cycle length
  const cycleLen = data.typicalCycleDays || 28
  const safeCycleLen = Math.min(60, Math.max(15, Math.round(cycleLen)))
  const periodLength = safeCycleLen <= 24 ? 4 : safeCycleLen >= 36 ? 6 : 5
  const ovulationDay = Math.max(periodLength + 5, safeCycleLen - 14)

  return (
    <>
      <div className="grid grid-cols-7 px-4 mb-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-[10px] font-normal text-muted-foreground tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="px-4 flex-1">
        <div className="grid grid-cols-7 gap-y-4 sm:gap-y-12 h-full">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1
            const key = dateToKey(d)
            const isPeriod = periodDates.has(key)
            const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year
            
            const targetDate = new Date(year, month, d)
            const cycleDay = data.lastPeriodStart 
              ? computeCycleDayForDate(targetDate, data.lastPeriodStart, data.typicalCycleDays)
              : null
            const isOvulation = cycleDay === ovulationDay
            
            return (
              <button 
                key={d} 
                type="button"
                onClick={() => handleDayClick(d)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(d) }}
                className="relative flex flex-col items-center justify-center cursor-pointer group py-2 sm:py-0 w-full"
              >
                <span className="text-[10px] text-muted-foreground mb-1 font-normal group-hover:text-foreground transition-colors">
                  {cycleDay !== null ? cycleDay : "--"}
                </span>

                <div className="relative flex items-center justify-center size-10 sm:size-12 transition-transform group-active:scale-90">
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#e0e0e0] dark:bg-muted rounded-full animate-in zoom-in-75 duration-200" />
                  )}
                  {isOvulation && (
                    <div className="absolute inset-0 border-2 border-dotted border-muted-foreground rounded-full opacity-60" />
                  )}
                  {isPeriod && (
                    <div className="absolute top-1 right-1 bg-[#ff5a5f] text-white rounded-full size-4 flex items-center justify-center">
                      <Drop weight="fill" className="size-2.5" />
                    </div>
                  )}
                  <span className={cn(
                    "relative z-0 text-lg font-normal transition-colors",
                    isPeriod ? "text-[#ff5a5f]" : "text-foreground"
                  )}>
                    {d}
                  </span>
                </div>

                {isPeriod && (
                  <div className="absolute -bottom-1 sm:-bottom-2 w-full flex justify-center px-1">
                    <div className="w-full border-b-2 border-dotted border-[#ff5a5f]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

const YearView = ({ viewDate, periodDates, today, onMonthClick }: { viewDate: Date, periodDates: Set<string>, today: Date, onMonthClick: (d: Date) => void }) => {
  const year = viewDate.getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4" suppressHydrationWarning>
      {months.map((m, idx) => {
        const mName = m.toLocaleString("default", { month: "short" })
        const dInM = new Date(year, idx + 1, 0).getDate()
        const offset = m.getDay()

        return (
          <button 
            key={m.getTime()} 
            type="button"
            className="p-4 bg-white dark:bg-card rounded-2xl border border-border/50 hover:border-[var(--mf-accent)] transition-all cursor-pointer group flex flex-col text-left w-full"
            onClick={() => onMonthClick(m)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onMonthClick(m) }}
          >
            <div className="px-4 py-2 -mx-4 -mt-4 mb-4 border-b border-border/60">
              <h4 className="text-sm font-normal text-foreground group-hover:text-[var(--mf-accent)] transition-colors">
                {mName}
              </h4>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className="size-2" />
              ))}
              {Array.from({ length: dInM }).map((_, i) => {
                const d = i + 1
                const key = `${year}-${String(idx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const isPeriod = periodDates.has(key)
                const isToday = d === today.getDate() && idx === today.getMonth() && year === today.getFullYear()
                
                return (
                  <div 
                    key={d} 
                    className={cn(
                      "size-2 rounded-full",
                      isPeriod ? "bg-[#ff5a5f]" : isToday ? "bg-[var(--mf-accent)]" : "bg-muted/40"
                    )} 
                    suppressHydrationWarning
                  />
                )
              })}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function computeCycleDayForDate(targetDate: Date, startIso: string, cycleLen: number) {
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const target = new Date(targetDate)
  target.setHours(12, 0, 0, 0)
  const days = Math.floor((+target - +start) / 86400000)
  const m = ((days % cycleLen) + cycleLen) % cycleLen
  return m + 1
}

function getLatestLoggedPeriodStart(logs: Array<{ date: string; symptoms: string[] }>) {
  const flowDates = logs
    .filter((log) => log.symptoms.some((symptom) => symptom.startsWith('flow-')))
    .map((log) => log.date)
    .sort()

  let latestStart = ''
  let previousDate: Date | null = null

  flowDates.forEach((date) => {
    const current = new Date(`${date}T12:00:00`)
    const isNewPeriod = !previousDate || Math.round((+current - +previousDate) / 86400000) > 1
    if (isNewPeriod) latestStart = date
    previousDate = current
  })

  return latestStart
}

function addPredictedPeriodDates({
  dates,
  periodStart,
  cycleLength,
  periodDuration,
  viewYear,
}: {
  dates: Set<string>
  periodStart: string
  cycleLength: number
  periodDuration: number
  viewYear: number
}) {
  const safeCycleLength = Math.min(60, Math.max(15, Math.round(cycleLength || 28)))
  const safePeriodDuration = Math.min(14, Math.max(1, Math.round(periodDuration || 5)))
  const windowStart = new Date(viewYear - 1, 0, 1, 12)
  const windowEnd = new Date(viewYear + 1, 11, 31, 12)
  const start = new Date(`${periodStart}T12:00:00`)
  if (Number.isNaN(+start)) return

  while (start > windowStart) {
    start.setDate(start.getDate() - safeCycleLength)
  }

  while (start <= windowEnd) {
    for (let offset = 0; offset < safePeriodDuration; offset += 1) {
      const periodDate = new Date(start)
      periodDate.setDate(start.getDate() + offset)
      if (periodDate >= windowStart && periodDate <= windowEnd) {
        dates.add(toDateKey(periodDate))
      }
    }
    start.setDate(start.getDate() + safeCycleLength)
  }
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function DetailSheet({
  selectedDate,
  isAuthenticated,
  isOpen,
  onClose,
  onOpenAuth
}: {
  selectedDate: Date
  isAuthenticated: boolean
  isOpen: boolean
  onClose: () => void
  onOpenAuth: () => void
}) {
  const { dashboard: ownDashboard, user, partnerStatus } = useStore()
  const isPartner = user?.role === 'partner'
  const data = (isPartner && partnerStatus?.paired && partnerStatus?.cycle) ? partnerStatus.cycle : ownDashboard
  const [isLogOpen, setIsLogOpen] = React.useState(false)

  const displayCycleDay = React.useMemo(() => {
    return computeCycleDayForDate(selectedDate, data.lastPeriodStart, data.typicalCycleDays)
  }, [selectedDate, data.lastPeriodStart, data.typicalCycleDays])

  if (!isOpen) return null

  return (
    <div className="sticky bottom-0 z-20 w-full">
      <Card className="rounded-t-[32px] rounded-b-none border-t border-x-0 border-b-0 p-6 pb-8 relative bg-white dark:bg-card max-w-[1200px] mx-auto overflow-hidden">
        {/* iOS bottom sheet drag handle indicator on mobile view */}
        <div className="md:hidden mx-auto w-12 h-1 rounded-full bg-muted/40 mb-4" />
        
        {!isAuthenticated && (
          <div className="absolute inset-0 bg-white/60 dark:bg-card/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
            <button type="button" 
              onClick={() => onOpenAuth()}
              className="text-sm font-normal text-[var(--mf-accent)] hover:underline"
            >
              Login to log data
            </button>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-lg font-normal text-foreground">
              {isPartner 
                ? `Cycle Day Details for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : `Edit Period for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
              }
            </h3>
            <p className="text-[var(--mf-accent)] font-normal text-sm">
              Cycle Day {displayCycleDay}
            </p>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
            onClick={onClose}
            aria-label="Close day details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 bg-muted/30 dark:bg-muted/10 rounded-2xl p-4 border border-dashed border-muted">
            <p className="text-muted-foreground text-sm text-center italic">
              {isPartner 
                ? "Symptom and period data are managed by your partner." 
                : "Add weight, mood & symptoms for this day"
              }
            </p>
          </div>
          
          {!isPartner && (
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest">LOG DATA</span>
                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-muted-foreground opacity-30">
                  <path d="M2 18C10 18 30 18 38 2M38 2L32 2M38 2L38 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <Button 
                onClick={() => setIsLogOpen(true)}
                className="size-14 rounded-full bg-[var(--mf-accent)] hover:bg-[var(--mf-accent-hover)] text-white p-0 flex items-center justify-center border-none transition-transform hover:scale-105 active:scale-95"
              >
                <Plus size={32} strokeWidth={2.5} />
              </Button>
            </div>
          )}
        </div>
      </Card>

      <LogSymptomsModal 
        isOpen={isLogOpen}
        onOpenChange={setIsLogOpen}
        activeDay={displayCycleDay}
        activeDate={selectedDate}
      />
    </div>
  )
}
