"use client"

import * as React from "react"
import { Plus, X, CaretLeft, CaretRight,Drop } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

type CalendarState = {
  viewDate: Date
  selectedDate: Date
  isEditingPeriods: boolean
  periodDates: Set<string>
}

type CalendarAction =
  | { type: "SET_VIEW_DATE"; payload: Date }
  | { type: "SET_SELECTED_DATE"; payload: Date }
  | { type: "SET_EDITING_PERIODS"; payload: boolean }
  | { type: "TOGGLE_PERIOD_DATE"; payload: string }

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "SET_VIEW_DATE":
      return { ...state, viewDate: action.payload }
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload }
    case "SET_EDITING_PERIODS":
      return { ...state, isEditingPeriods: action.payload }
    case "TOGGLE_PERIOD_DATE": {
      const next = new Set(state.periodDates)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, periodDates: next }
    }
    default:
      return state
  }
}

import { useAuth } from "@/context/useAuth"

export function CalendarView() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(['month', 'year'] as const)
      .withDefault('month')
      .withOptions({ shallow: false })
  )
  
  const [state, dispatch] = React.useReducer(calendarReducer, {
    viewDate: new Date(currentYear, currentMonth, 1),
    selectedDate: today,
    isEditingPeriods: false,
    periodDates: new Set([
      `${currentYear}-${String(currentMonth).padStart(2, '0')}-20`,
      `${currentYear}-${String(currentMonth).padStart(2, '0')}-21`,
      `${currentYear}-${String(currentMonth).padStart(2, '0')}-22`,
      `${currentYear}-${String(currentMonth).padStart(2, '0')}-23`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-21`,
    ])
  })

  const { viewDate, selectedDate, isEditingPeriods, periodDates } = state

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const prevMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month - 1, 1) })
  const nextMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month + 1, 1) })
  const prevYear = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year - 1, month, 1) })
  const nextYear = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year + 1, month, 1) })

  return (
    <div className="flex flex-col h-full bg-background overflow-auto relative">
      {/* Decorative background image - matching Symptoms (Tracker) view style */}
      <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none z-0">
        <img src="/images/exp.jpg" alt="" className="size-96 object-contain rotate-[-15deg]" />
      </div>

      <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500 relative z-10">
        
        {/* Top Control Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 px-6 mb-8 text-center">
          <div className="flex justify-center sm:justify-start order-2 sm:order-1">
            <div className="flex bg-[#f3f4f6] dark:bg-muted p-1 rounded-lg border border-[#d1d5db]">
              <button
                onClick={() => setView("month")}
                className={cn(
                  "px-6 sm:px-8 py-1.5 rounded-md text-[11px] font-medium transition-all border",
                  view === "month" 
                    ? "bg-white dark:bg-muted-foreground/20 text-[var(--mf-accent)] border-border/40" 
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-border/20"
                )}
              >
                MONTH
              </button>
              <button
                onClick={() => setView("year")}
                className={cn(
                  "px-6 sm:px-8 py-1.5 rounded-md text-[11px] font-medium transition-all border",
                  view === "year" 
                    ? "bg-white dark:bg-muted-foreground/20 text-[var(--mf-accent)] border-border/40" 
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-border/20"
                )}
              >
                YEAR
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 order-1 sm:order-2">
            <Button variant="ghost" size="icon" onClick={view === "month" ? prevMonth : prevYear} className="rounded-full">
              <CaretLeft className="size-5" />
            </Button>
            <h2 className="text-xl sm:text-2xl font-medium text-foreground min-w-[140px] text-center">
              {view === "month" ? `${viewDate.toLocaleString("default", { month: "long" })} ${year}` : year}
            </h2>
            <Button variant="ghost" size="icon" onClick={view === "month" ? nextMonth : nextYear} className="rounded-full">
              <CaretRight className="size-5" />
            </Button>
          </div>

          <div className="flex justify-center sm:justify-end order-3">
            <Button 
              variant={isEditingPeriods ? "default" : "outline"}
              onClick={() => isAuthenticated ? dispatch({ type: "SET_EDITING_PERIODS", payload: !isEditingPeriods }) : openAuthModal()}
              className={cn(
                "rounded-full text-xs font-medium",
                isEditingPeriods ? "bg-[var(--mf-danger)]/10 text-[var(--mf-danger)] border-[var(--mf-danger)]/30 hover:bg-[var(--mf-danger)]/20" : ""
              )}
            >
              {isEditingPeriods ? "Finish Editing" : "Edit Periods"}
            </Button>
          </div>
        </div>

        <div className="relative">
          {view === "month" ? (
            <MonthView 
              viewDate={viewDate} 
              selectedDate={selectedDate}
              isEditingPeriods={isEditingPeriods}
              periodDates={periodDates}
              dispatch={dispatch}
            />
          ) : (
            <YearView 
              viewDate={viewDate} 
              periodDates={periodDates}
              onMonthClick={(d) => {
                dispatch({ type: "SET_VIEW_DATE", payload: d })
                setView("month")
              }}
            />
          )}

          {!isAuthenticated && (
            <div className="absolute inset-x-[-24px] bottom-[-24px] top-[200px] bg-gradient-to-t from-[#f5f5f7] dark:from-background via-[#f5f5f7]/90 dark:via-background/90 to-transparent pointer-events-none z-20 flex flex-col items-center justify-center pt-24">
              <div className="w-full h-full backdrop-blur-[6px] opacity-100" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-auto">
                 <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto">
                  <h3 className="text-xl font-medium mb-2">Track your patterns</h3>
                  <p className="text-muted-foreground text-sm mb-6">Unlock period editing, symptom logging, and historical calendar views by signing in.</p>
                  <button 
                    onClick={openAuthModal}
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

      <DetailSheet selectedDate={selectedDate} isAuthenticated={isAuthenticated} onOpenAuth={openAuthModal} />
    </div>
  )
}

function MonthView({ viewDate, selectedDate, isEditingPeriods, periodDates, dispatch }: { 
  viewDate: Date, 
  selectedDate: Date, 
  isEditingPeriods: boolean, 
  periodDates: Set<string>,
  dispatch: React.Dispatch<CalendarAction>
}) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = new Date(year, month, 1).getDay()

  const dateToKey = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const handleDayClick = (d: number) => {
    if (isEditingPeriods) {
      dispatch({ type: "TOGGLE_PERIOD_DATE", payload: dateToKey(d) })
    } else {
      dispatch({ type: "SET_SELECTED_DATE", payload: new Date(year, month, d) })
    }
  }

  return (
    <>
      <div className="grid grid-cols-7 px-4 mb-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground tracking-wider">
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
            const isOvulation = d === 5 && month === 8 
            
            return (
              <div 
                key={d} 
                role="button"
                tabIndex={0}
                onClick={() => handleDayClick(d)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(d) }}
                className="relative flex flex-col items-center justify-center cursor-pointer group py-2 sm:py-0"
              >
                <span className="text-[10px] text-muted-foreground mb-1 font-medium group-hover:text-foreground transition-colors">
                  {(d + 6) % 28 + 1}
                </span>

                <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 transition-transform group-active:scale-90">
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#e0e0e0] dark:bg-muted rounded-full animate-in zoom-in-75 duration-200" />
                  )}
                  {isOvulation && (
                    <div className="absolute inset-0 border-2 border-dotted border-muted-foreground rounded-full opacity-60" />
                  )}
                  {isPeriod && (
                    <div className="absolute top-1 right-1 bg-[#ff5a5f] text-white rounded-full size-4 flex items-center justify-center shadow-sm">
                      <Drop weight="fill" className="size-2.5" />
                    </div>
                  )}
                  <span className={cn(
                    "relative z-0 text-lg font-medium transition-colors",
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
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function YearView({ viewDate, periodDates, onMonthClick }: { 
  viewDate: Date, 
  periodDates: Set<string>,
  onMonthClick: (d: Date) => void
}) {
  const year = viewDate.getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4" suppressHydrationWarning>
      {months.map((m, idx) => {
        const mName = m.toLocaleString("default", { month: "short" })
        const dInM = new Date(year, idx + 1, 0).getDate()
        const offset = m.getDay()

        return (
          <div 
            key={m.getTime()} 
            role="button"
            tabIndex={0}
            className="p-4 bg-white dark:bg-card rounded-2xl border border-border/50 hover:border-[var(--mf-accent)] transition-all cursor-pointer group flex flex-col"
            onClick={() => onMonthClick(m)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onMonthClick(m) }}
          >
            <div className="px-4 py-2 -mx-4 -mt-4 mb-4 border-b border-border/60">
              <h4 className="text-sm font-medium text-foreground group-hover:text-[var(--mf-accent)] transition-colors">
                {mName}
              </h4>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className="size-2" />
              ))}
              {Array.from({ length: dInM }).map((_, i) => {
                const d = i + 1
                const key = `${year}-${String(idx).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const isPeriod = periodDates.has(key)
                const isToday = d === new Date().getDate() && idx === new Date().getMonth() && year === new Date().getFullYear()
                
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
          </div>
        )
      })}
    </div>
  )
}

function DetailSheet({ selectedDate, isAuthenticated, onOpenAuth }: { selectedDate: Date, isAuthenticated: boolean, onOpenAuth: () => void }) {
  // Mock cycle info
  const displayCycleDay = 12 // Simplified for component extraction

  return (
    <div className="sticky bottom-0 z-20 w-full">
      <Card className="rounded-t-[32px] rounded-b-none border-t border-x-0 border-b-0 p-6 pb-8 relative bg-white dark:bg-card max-w-[1200px] mx-auto overflow-hidden">
        {!isAuthenticated && (
          <div className="absolute inset-0 bg-white/60 dark:bg-card/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
            <button 
              onClick={onOpenAuth}
              className="text-sm font-medium text-[var(--mf-accent)] hover:underline"
            >
              Login to log data
            </button>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-lg font-medium text-foreground">
              Edit Period for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <p className="text-[var(--mf-accent)] font-medium text-sm">
              Cycle Day {displayCycleDay}
            </p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 bg-muted/30 dark:bg-muted/10 rounded-2xl p-4 border border-dashed border-muted">
            <p className="text-muted-foreground text-sm text-center italic">
              Add weight, mood & symptoms for this day
            </p>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">LOG DATA</span>
              <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-muted-foreground opacity-30">
                <path d="M2 18C10 18 30 18 38 2M38 2L32 2M38 2L38 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="size-14 rounded-full bg-[var(--mf-accent)] hover:bg-[var(--mf-accent-hover)] text-white p-0 flex items-center justify-center border-none transition-transform hover:scale-105 active:scale-95">
                  <Plus size={32} strokeWidth={2.5} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Log Daily Data</DialogTitle>
                  <DialogDescription>
                    This interface will allow you to track your daily weight, mood, and symptoms.
                    (Backend integration pending)
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 flex flex-col gap-4 items-center justify-center text-center text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/20">
                  <p className="italic text-sm">Form fields will appear here</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    </div>
  )
}
