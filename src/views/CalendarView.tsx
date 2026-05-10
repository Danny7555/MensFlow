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
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

type CalendarState = {
  view: "month" | "year"
  viewDate: Date
  selectedDate: Date
  isEditingPeriods: boolean
  periodDates: Set<string>
}

type CalendarAction =
  | { type: "SET_VIEW"; payload: "month" | "year" }
  | { type: "SET_VIEW_DATE"; payload: Date }
  | { type: "SET_SELECTED_DATE"; payload: Date }
  | { type: "SET_EDITING_PERIODS"; payload: boolean }
  | { type: "TOGGLE_PERIOD_DATE"; payload: string }

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.payload }
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


export function CalendarView() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  
  const [state, dispatch] = React.useReducer(calendarReducer, {
    view: "month",
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

  const { view, viewDate, selectedDate, isEditingPeriods, periodDates } = state

  // Calendar logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const totalDays = daysInMonth(year, month)
  const offset = firstDayOfMonth(year, month)

  const monthName = viewDate.toLocaleString("default", { month: "long" })

  const prevMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month - 1, 1) })
  const nextMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month + 1, 1) })

  const dateToKey = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const togglePeriodDate = (d: number) => {
    dispatch({ type: "TOGGLE_PERIOD_DATE", payload: dateToKey(d) })
  }

  const handleDayClick = (d: number) => {
    if (isEditingPeriods) {
      togglePeriodDate(d)
    } else {
      dispatch({ type: "SET_SELECTED_DATE", payload: new Date(year, month, d) })
    }
  }

  // Mock cycle info
  const cycleDay = Math.floor((selectedDate.getTime() - new Date(year, month, 20).getTime()) / 86400000) % 28 + 1
  const displayCycleDay = cycleDay > 0 ? cycleDay : 28 + cycleDay

  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-background overflow-auto">
      {/* Container to handle desktop widening */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
        
        {/* Top Control Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 px-6 mb-8 text-center">
           {/* View Switcher */}
          <div className="flex justify-center sm:justify-start order-2 sm:order-1">
            <div className="flex bg-[#ebebeb] dark:bg-muted p-1 rounded-lg">
              <button
                onClick={() => dispatch({ type: "SET_VIEW", payload: "month" })}
                className={cn(
                  "px-6 sm:px-8 py-1.5 rounded-md text-[11px] font-medium transition-all",
                  view === "month" 
                    ? "bg-white dark:bg-muted-foreground/20 text-[var(--mf-accent)] shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                MONTH
              </button>
              <button
                onClick={() => dispatch({ type: "SET_VIEW", payload: "year" })}
                className={cn(
                  "px-6 sm:px-8 py-1.5 rounded-md text-[11px] font-medium transition-all",
                  view === "year" 
                    ? "bg-white dark:bg-muted-foreground/20 text-[var(--mf-accent)] shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                YEAR
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-6 order-1 sm:order-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full">
              <CaretLeft className="size-5" />
            </Button>
            <h2 className="text-xl sm:text-2xl font-medium text-foreground min-w-[140px] text-center">
              {monthName} {year}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full">
              <CaretRight className="size-5" />
            </Button>
          </div>

          {/* Edit Toggle */}
          <div className="flex justify-center sm:justify-end order-3">
            <Button 
              variant={isEditingPeriods ? "default" : "outline"}
              onClick={() => dispatch({ type: "SET_EDITING_PERIODS", payload: !isEditingPeriods })}
              className={cn(
                "rounded-full text-xs font-medium",
                isEditingPeriods ? "bg-[var(--mf-danger)]/10 text-[var(--mf-danger)] border-[var(--mf-danger)]/30 hover:bg-[var(--mf-danger)]/20" : ""
              )}
            >
              {isEditingPeriods ? "Finish Editing" : "Edit Periods"}
            </Button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 px-4 mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-[10px] font-medium text-muted-foreground tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="px-4 flex-1">
          <div className="grid grid-cols-7 gap-y-4 sm:gap-y-12 h-full">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {Array.from({ length: totalDays }).map((_, i) => {
              const d = i + 1
              const key = dateToKey(d)
              const isPeriod = periodDates.has(key)
              const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year
              const isOvulation = d === 5 && month === 8 // Mock ovulation on Sep 5
              
              return (
                <div 
                  key={d} 
                  role="button"
                  tabIndex={0}
                  onClick={() => handleDayClick(d)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(d) }}
                  className="relative flex flex-col items-center justify-center cursor-pointer group py-2 sm:py-0"
                >
                  {/* Cycle Day Number */}
                  <span className="text-[10px] text-muted-foreground mb-1 font-medium group-hover:text-foreground transition-colors">
                    {/* Mock cycle day - just offset for demo */}
                    {(d + 6) % 28 + 1}
                  </span>

                  {/* Date with Markers */}
                  <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 transition-transform group-active:scale-90">
                    {/* Selected Marker */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#e0e0e0] dark:bg-muted rounded-full animate-in zoom-in-75 duration-200" />
                    )}
                    
                    {/* Ovulation Marker */}
                    {isOvulation && (
                      <div className="absolute inset-0 border-2 border-dotted border-muted-foreground rounded-full opacity-60" />
                    )}

                    {/* Period Marker (Red Dot Badge) */}
                    {isPeriod && (
                      <div className="absolute top-1 right-1 bg-[#ff5a5f] text-white rounded-full size-4 flex items-center justify-center shadow-sm">
                        <Drop weight="fill" className="size-2.5" />
                      </div>
                    )}

                    <span className={cn(
                      "relative z-0 text-lg font-medium transition-colors",
                      isPeriod ? "text-[#ff5a5f]" : "text-foreground",
                      isSelected && "font-medium"
                    )}>
                      {d}
                    </span>
                  </div>

                  {/* Period Underline */}
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
      </div>

      {/* Bottom Sheet Detail - Stays fixed at bottom */}
      <div className="sticky bottom-0 z-20 w-full">
        <Card className="rounded-t-[32px] rounded-b-none border-t border-x-0 border-b-0 p-6 pb-8 relative bg-white dark:bg-card max-w-[1200px] mx-auto overflow-hidden">
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
    </div>
  )
}
