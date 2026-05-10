"use client"

import * as React from "react"
import { Plus, X, CaretLeft, CaretRight } from "@phosphor-icons/react"
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

export function CalendarView() {
  const [view, setView] = React.useState<"month" | "year">("month")
  const [viewDate, setViewDate] = React.useState(new Date(2024, 8, 1)) // September 2024
  const [selectedDate, setSelectedDate] = React.useState(new Date(2024, 8, 14))
  const [isEditingPeriods, setIsEditingPeriods] = React.useState(false)
  const [periodDates, setPeriodDates] = React.useState<Set<string>>(
    new Set(["2024-08-20", "2024-08-21", "2024-08-22", "2024-08-23", "2024-09-20", "2024-09-21", "2024-09-22", "2024-09-23"])
  )

  // Calendar logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const totalDays = daysInMonth(year, month)
  const offset = firstDayOfMonth(year, month)

  const monthName = viewDate.toLocaleString("default", { month: "long" })

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const dateToKey = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const togglePeriodDate = (d: number) => {
    const key = dateToKey(d)
    const next = new Set(periodDates)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setPeriodDates(next)
  }

  const handleDayClick = (d: number) => {
    if (isEditingPeriods) {
      togglePeriodDate(d)
    } else {
      setSelectedDate(new Date(year, month, d))
    }
  }

  // Mock cycle info
  const cycleDay = Math.floor((selectedDate.getTime() - new Date(year, month, 20).getTime()) / 86400000) % 28 + 1
  const displayCycleDay = cycleDay > 0 ? cycleDay : 28 + cycleDay

  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-background overflow-auto">
      {/* Container to handle desktop widening */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto flex flex-col pt-4 pb-12 transition-all">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 mb-8 gap-4">
           {/* View Switcher */}
          <div className="flex bg-[#ebebeb] dark:bg-muted p-1 rounded-lg order-2 sm:order-1">
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-6 sm:px-8 py-1.5 rounded-md text-[11px] font-bold transition-all",
                view === "month" 
                  ? "bg-[#2ebcc5] text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              MONTH
            </button>
            <button
              onClick={() => setView("year")}
              className={cn(
                "px-6 sm:px-8 py-1.5 rounded-md text-[11px] font-bold transition-all",
                view === "year" 
                  ? "bg-[#2ebcc5] text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              YEAR
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-6 order-1 sm:order-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full">
              <CaretLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground min-w-[140px] text-center">
              {monthName} {year}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full">
              <CaretRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Edit Toggle */}
          <Button 
            variant={isEditingPeriods ? "default" : "outline"}
            onClick={() => setIsEditingPeriods(!isEditingPeriods)}
            className={cn(
              "rounded-full text-xs font-bold order-3",
              isEditingPeriods ? "bg-[#ff5a5f] hover:bg-[#ff4b50] border-none text-white" : ""
            )}
          >
            {isEditingPeriods ? "Finish Editing" : "Edit Periods"}
          </Button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 px-4 mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-[10px] font-bold text-muted-foreground tracking-wider">
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
              
              // Calculate period day number for red badge
              let periodDayNum = 0
              if (isPeriod) {
                // simple mock: find how many consecutive period days before this one
                for (let j = d; j > 0; j--) {
                  if (periodDates.has(dateToKey(j))) periodDayNum++
                  else break
                }
              }

              return (
                <div 
                  key={d} 
                  onClick={() => handleDayClick(d)}
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
                      <div className="absolute -top-1 -left-1 bg-[#ff5a5f] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold z-10 shadow-sm">
                        {periodDayNum}
                      </div>
                    )}

                    <span className={cn(
                      "relative z-0 text-lg font-medium transition-colors",
                      isPeriod ? "text-[#ff5a5f]" : "text-foreground",
                      isSelected && "font-bold"
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
              <h3 className="text-xl font-bold text-foreground">
                {selectedDate.toLocaleDateString("default", { month: "long", day: "numeric" })}
              </h3>
              <p className="text-[#2ebcc5] font-bold text-sm">
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
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LOG DATA</span>
                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-muted-foreground opacity-30">
                  <path d="M2 18C10 18 30 18 38 2M38 2L32 2M38 2L38 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-14 h-14 rounded-full bg-[#2ebcc5] hover:bg-[#27a8b0] text-white p-0 flex items-center justify-center border-none transition-transform hover:scale-105 active:scale-95">
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
