"use client"

import * as React from "react"
import { Plus, X, CaretLeft, CaretRight, Drop, PencilSimple, CalendarBlank } from "@phosphor-icons/react"
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
  editDraft: Set<string>
  isSavingPeriods: boolean
  editMode: 'single' | 'range'
  rangeStart: string | null
  hoveredDateKey: string | null
  lastClickedDateKey: string | null
}

type CalendarAction =
  | { type: "SET_VIEW_DATE"; payload: Date }
  | { type: "SET_SELECTED_DATE"; payload: Date }
  | { type: "SET_PERIOD_DATES"; payload: Set<string> }
  | { type: "INIT_CLIENT_DATE"; payload: { today: Date; periodDates: Set<string>; viewDate: Date } }
  | { type: "ENTER_EDIT_MODE"; payload: { loggedDates: Set<string> } }
  | { type: "CANCEL_EDITING" }
  | { type: "SET_EDIT_DRAFT"; payload: Set<string> }
  | { type: "SET_EDIT_MODE"; payload: 'single' | 'range' }
  | { type: "SET_RANGE_START"; payload: string | null }
  | { type: "SET_HOVERED_DATE_KEY"; payload: string | null }
  | { type: "SET_LAST_CLICKED_DATE_KEY"; payload: string | null }
  | { type: "SET_IS_SAVING_PERIODS"; payload: boolean }

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "SET_VIEW_DATE":
      return { ...state, viewDate: action.payload }
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload }
    case "SET_PERIOD_DATES":
      return { ...state, periodDates: action.payload }
    case "INIT_CLIENT_DATE":
      return {
        ...state,
        selectedDate: action.payload.today,
        viewDate: action.payload.viewDate,
        periodDates: action.payload.periodDates,
        today: action.payload.today,
      }
    case "ENTER_EDIT_MODE":
      return {
        ...state,
        isEditingPeriods: true,
        editDraft: action.payload.loggedDates,
        editMode: 'single',
        rangeStart: null,
        hoveredDateKey: null,
        lastClickedDateKey: null
      }
    case "CANCEL_EDITING":
      return {
        ...state,
        isEditingPeriods: false,
        editMode: 'single',
        rangeStart: null,
        hoveredDateKey: null,
        lastClickedDateKey: null
      }
    case "SET_EDIT_DRAFT":
      return { ...state, editDraft: action.payload }
    case "SET_EDIT_MODE":
      return { ...state, editMode: action.payload }
    case "SET_RANGE_START":
      return { ...state, rangeStart: action.payload }
    case "SET_HOVERED_DATE_KEY":
      return { ...state, hoveredDateKey: action.payload }
    case "SET_LAST_CLICKED_DATE_KEY":
      return { ...state, lastClickedDateKey: action.payload }
    case "SET_IS_SAVING_PERIODS":
      return { ...state, isSavingPeriods: action.payload }
    default:
      return state
  }
}

import { useAuth } from "@/context/useAuth"

function RestrictedAccessView({
  requestSent,
  isSaving,
  showAccessModal,
  setShowAccessModal,
  handleConfirmAccessRequest,
}: {
  requestSent: boolean
  isSaving: boolean
  showAccessModal: boolean
  setShowAccessModal: (val: boolean) => void
  handleConfirmAccessRequest: (selectedFields: string[]) => Promise<void>
}) {
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

function CalendarHeader({
  view,
  setView,
  viewDate,
  isEditingPeriods,
  isPartner,
  enterEditMode,
  prevMonth,
  nextMonth,
  prevYear,
  nextYear,
}: {
  view: 'month' | 'year'
  setView: (view: 'month' | 'year') => void
  viewDate: Date
  isEditingPeriods: boolean
  isPartner: boolean
  enterEditMode: () => void
  prevMonth: () => void
  nextMonth: () => void
  prevYear: () => void
  nextYear: () => void
}) {
  const year = viewDate.getFullYear()
  return (
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
          isEditingPeriods ? (
            <span className="text-xs text-muted-foreground italic animate-in fade-in duration-300">
              Tap days below to toggle
            </span>
          ) : (
            <button
              type="button"
              onClick={enterEditMode}
              className="flex items-center gap-2 text-xs font-medium text-[#ff5a5f] bg-[#ff5a5f]/8 hover:bg-[#ff5a5f]/15 border border-[#ff5a5f]/25 px-4 py-2 rounded-full transition-all active:scale-95"
            >
              <PencilSimple size={13} weight="bold" />
              <span>Edit periods</span>
            </button>
          )
        )}
        {isPartner && (
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted px-4 py-2 rounded-full border border-border/40">
            View-Only Mode
          </div>
        )}
      </div>
    </div>
  )
}

function EditActionBar({
  editDraftSize,
  editMode,
  rangeStart,
  isSavingPeriods,
  setEditMode,
  handleCancelEditing,
  handleSavePeriods,
}: {
  editDraftSize: number
  editMode: 'single' | 'range'
  rangeStart: string | null
  isSavingPeriods: boolean
  setEditMode: (mode: 'single' | 'range') => void
  handleCancelEditing: () => void
  handleSavePeriods: () => void
}) {
  return (
    <div className="animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white/95 dark:bg-[#1e1e1e]/95 border border-[#ff5a5f]/25 shadow-[0_4px_20px_rgba(255,90,95,0.08)] p-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="size-9 rounded-full bg-[#ff5a5f]/10 flex items-center justify-center shrink-0">
            <Drop size={16} weight="fill" className="text-[#ff5a5f]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground leading-tight">
              {editDraftSize} {editDraftSize === 1 ? 'day' : 'days'} selected
            </p>
            <p className="text-[10px] text-rose-500 font-medium leading-tight mt-0.5 animate-pulse">
              {editMode === 'single' 
                ? 'Tap days to toggle • Shift-click for range'
                : !rangeStart 
                  ? 'Tap start date of period flow'
                  : 'Tap end date of period flow'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-muted dark:bg-muted/40 p-0.5 rounded-lg border border-border/40">
            <button
              type="button"
              onClick={() => setEditMode('single')}
              className={cn(
                "text-[10px] font-medium px-3 py-1 rounded-md transition-all",
                editMode === 'single' ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setEditMode('range')}
              className={cn(
                "text-[10px] font-medium px-3 py-1 rounded-md transition-all",
                editMode === 'range' ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Range
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEditing}
              disabled={isSavingPeriods}
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl hover:bg-muted transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePeriods}
              disabled={isSavingPeriods}
              className="text-xs font-semibold text-white bg-[#ff5a5f] hover:brightness-105 px-4 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSavingPeriods ? (
                <><span className="animate-spin inline-block">⟳</span><span>Saving…</span></>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function useCalendarState() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const { user, logs, fetchLogs, addLog, dashboard: ownDashboard, settings, partnerStatus, fetchPartnerStatus, requestDetailedAccessAction, isSaving, hydrate } = useStore()
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
    today: new Date(2026, 4, 20),
    editDraft: new Set<string>(),
    isSavingPeriods: false,
    editMode: 'single',
    rangeStart: null,
    hoveredDateKey: null,
    lastClickedDateKey: null
  })
  
  const editBaseRef = React.useRef<Set<string>>(null as unknown as Set<string>)
  if (editBaseRef.current === null) {
    editBaseRef.current = new Set()
  }
  const userRemovedRef = React.useRef<Set<string>>(null as unknown as Set<string>)
  if (userRemovedRef.current === null) {
    userRemovedRef.current = new Set()
  }

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
    if (state.isEditingPeriods) return

    const dates = new Set<string>()
    logs.forEach((log) => {
      if (log.symptoms.some((s) => s.startsWith("flow-"))) {
        dates.add(log.date)
      }
    })

    const periodStart = getLatestLoggedPeriodStart(logs, state.today) || data.lastPeriodStart
    if (periodStart) {
      const predictedOnly = new Set<string>()
      addPredictedPeriodDates({
        dates: predictedOnly,
        periodStart,
        cycleLength: data.typicalCycleDays || settings.cycleAvgLengthDays,
        periodDuration: settings.cyclePeriodLengthDays,
        viewYear: state.viewDate.getFullYear(),
      })
      predictedOnly.forEach((d) => {
        if (!userRemovedRef.current.has(d)) {
          dates.add(d)
        }
      })
    }

    dispatch({ type: "SET_PERIOD_DATES", payload: dates })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.lastPeriodStart, data.typicalCycleDays, logs, settings.cycleAvgLengthDays, settings.cyclePeriodLengthDays, state.viewDate, state.isEditingPeriods, state.today])

  const predictedDates = React.useMemo(() => {
    const dates = new Set<string>()
    if (state.isEditingPeriods) return dates

    const periodStart = getLatestLoggedPeriodStart(logs, state.today) || data.lastPeriodStart
    if (periodStart) {
      const predictedOnly = new Set<string>()
      addPredictedPeriodDates({
        dates: predictedOnly,
        periodStart,
        cycleLength: data.typicalCycleDays || settings.cycleAvgLengthDays,
        periodDuration: settings.cyclePeriodLengthDays,
        viewYear: state.viewDate.getFullYear(),
      })
      // eslint-disable-next-line react-hooks/refs
      predictedOnly.forEach((d) => {
        if (!userRemovedRef.current.has(d)) {
          dates.add(d)
        }
      })
      return dates
    }
    return dates
  }, [data.lastPeriodStart, data.typicalCycleDays, logs, settings.cycleAvgLengthDays, settings.cyclePeriodLengthDays, state.viewDate, state.isEditingPeriods, state.today])

  const enterEditMode = () => {
    if (!isAuthenticated) { openAuthModal(); return }
    const loggedDates = new Set<string>()
    logs.forEach((log) => {
      if (log.symptoms.some((s) => s.startsWith("flow-"))) {
        loggedDates.add(log.date)
      }
    })
    editBaseRef.current = new Set(loggedDates)
    dispatch({ type: "ENTER_EDIT_MODE", payload: { loggedDates } })
  }

  const handleTogglePeriod = (dateKey: string, isShiftKey: boolean = false) => {
    const parseDateKey = (k: string) => {
      const [y, m, d] = k.split('-').map(Number)
      return new Date(y, m - 1, d)
    }

    if (state.editMode === 'range') {
      if (!state.rangeStart) {
        dispatch({ type: "SET_RANGE_START", payload: dateKey })
      } else {
        const start = parseDateKey(state.rangeStart)
        const end = parseDateKey(dateKey)
        const dStart = start < end ? start : end
        const dEnd = start < end ? end : start
        
        const next = new Set(state.editDraft)
        const temp = new Date(dStart)
        while (temp <= dEnd) {
          const key = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}-${String(temp.getDate()).padStart(2, '0')}`
          next.add(key)
          temp.setDate(temp.getDate() + 1)
        }
        dispatch({ type: "SET_EDIT_DRAFT", payload: next })
        dispatch({ type: "SET_RANGE_START", payload: null })
        dispatch({ type: "SET_HOVERED_DATE_KEY", payload: null })
      }
    } else {
      const next = new Set(state.editDraft)
      if (isShiftKey && state.lastClickedDateKey) {
        const start = parseDateKey(state.lastClickedDateKey)
        const end = parseDateKey(dateKey)
        const dStart = start < end ? start : end
        const dEnd = start < end ? end : start
        const toAdd = !state.editDraft.has(dateKey)
        
        const temp = new Date(dStart)
        while (temp <= dEnd) {
          const key = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}-${String(temp.getDate()).padStart(2, '0')}`
          if (toAdd) {
            next.add(key)
          } else {
            next.delete(key)
          }
          temp.setDate(temp.getDate() + 1)
        }
      } else {
        if (next.has(dateKey)) {
          next.delete(dateKey)
        } else {
          next.add(dateKey)
        }
      }
      dispatch({ type: "SET_EDIT_DRAFT", payload: next })
      dispatch({ type: "SET_LAST_CLICKED_DATE_KEY", payload: dateKey })
    }
  }

  const handleSavePeriods = async () => {
    dispatch({ type: "SET_IS_SAVING_PERIODS", payload: true })
    const base = editBaseRef.current
    const draft = state.editDraft

    const added = [...draft].filter((d) => !base.has(d))
    const removed = [...base].filter((d) => !draft.has(d))

    removed.forEach((d) => userRemovedRef.current.add(d))
    added.forEach((d) => userRemovedRef.current.delete(d))

    try {
      const addedPromises = added.map((dateKey) => {
        const existing = logs.find((l) => l.date === dateKey)
        const symptoms = existing?.symptoms.filter((s) => !s.startsWith('flow-')) ?? []
        return addLog(dateKey, [...symptoms, 'flow-medium'])
      })
      const removedPromises = removed.map((dateKey) => {
        const existing = logs.find((l) => l.date === dateKey)
        const symptoms = (existing?.symptoms ?? []).filter((s) => !s.startsWith('flow-'))
        return addLog(dateKey, symptoms)
      })
      await Promise.all([...addedPromises, ...removedPromises])
      await fetchLogs()
      try {
        const { userApi } = await import('../services/userService')
        const profile = await userApi.getProfile()
        hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })
      } catch {
        // non-critical
      }
    } catch {
      // toast shown by addLog
    } finally {
      dispatch({ type: "SET_IS_SAVING_PERIODS", payload: false })
      dispatch({ type: "CANCEL_EDITING" })
    }
  }

  const handleCancelEditing = () => {
    dispatch({ type: "CANCEL_EDITING" })
  }

  const year = state.viewDate.getFullYear()
  const month = state.viewDate.getMonth()

  const prevMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month - 1, 1) })
  const nextMonth = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year, month + 1, 1) })
  const prevYear = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year - 1, month, 1) })
  const nextYear = () => dispatch({ type: "SET_VIEW_DATE", payload: new Date(year + 1, month, 1) })

  return {
    isAuthenticated,
    openAuthModal,
    user,
    isSaving,
    isPartner,
    data,
    showRestrictedView,
    view,
    setView,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    state,
    dispatch,
    predictedDates,
    enterEditMode,
    handleTogglePeriod,
    handleSavePeriods,
    handleCancelEditing,
    prevMonth,
    nextMonth,
    prevYear,
    nextYear,
    showAccessModal,
    setShowAccessModal,
    requestSent,
    handleConfirmAccessRequest,
  }
}

export function CalendarView() {
  const {
    isAuthenticated,
    openAuthModal,
    isSaving,
    isPartner,
    data,
    showRestrictedView,
    view,
    setView,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    state,
    dispatch,
    predictedDates,
    enterEditMode,
    handleTogglePeriod,
    handleSavePeriods,
    handleCancelEditing,
    prevMonth,
    nextMonth,
    prevYear,
    nextYear,
    showAccessModal,
    setShowAccessModal,
    requestSent,
    handleConfirmAccessRequest,
  } = useCalendarState()

  const {
    viewDate,
    selectedDate,
    isEditingPeriods,
    periodDates,
    editDraft,
    isSavingPeriods,
    editMode,
    rangeStart,
    hoveredDateKey,
  } = state

  if (showRestrictedView) {
    return (
      <RestrictedAccessView
        requestSent={requestSent}
        isSaving={isSaving}
        showAccessModal={showAccessModal}
        setShowAccessModal={setShowAccessModal}
        handleConfirmAccessRequest={handleConfirmAccessRequest}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-auto relative" suppressHydrationWarning>
      <div className="absolute right-0 top-20 opacity-10 pointer-events-none z-0">
        <img src="/images/girl.png" alt="" className="size-[800px] object-contain" />
      </div>

      <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        
        <CalendarHeader
          view={view}
          setView={setView}
          viewDate={viewDate}
          isEditingPeriods={isEditingPeriods}
          isPartner={isPartner}
          enterEditMode={enterEditMode}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          prevYear={prevYear}
          nextYear={nextYear}
        />

        {isEditingPeriods && (
          <EditActionBar
            editDraftSize={editDraft.size}
            editMode={editMode}
            rangeStart={rangeStart}
            isSavingPeriods={isSavingPeriods}
            setEditMode={(mode) => dispatch({ type: "SET_EDIT_MODE", payload: mode })}
            handleCancelEditing={handleCancelEditing}
            handleSavePeriods={handleSavePeriods}
          />
        )}

        <div className="relative">
          {view === "month" ? (
            <MonthView 
              viewDate={viewDate} 
              selectedDate={selectedDate}
              isEditingPeriods={isEditingPeriods}
              periodDates={isEditingPeriods ? editDraft : periodDates}
              predictedDates={predictedDates}
              editMode={editMode}
              rangeStart={rangeStart}
              hoveredDateKey={hoveredDateKey}
              onHoverDate={(hovered) => dispatch({ type: "SET_HOVERED_DATE_KEY", payload: hovered })}
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
              predictedDates={predictedDates}
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

        {view === "month" && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-6 border-t border-border/40 text-xs text-muted-foreground animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-900/60 flex items-center justify-center text-[10px] text-violet-700 dark:text-violet-300 font-bold">
                1
              </div>
              <span className="font-medium text-foreground/80">Logged Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-dashed border-rose-400 dark:border-rose-700/80 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-center text-[10px] text-rose-500 font-semibold">
                1
              </div>
              <span className="font-medium text-foreground/80">Predicted Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-teal-500/85 dark:border-teal-400/80 bg-teal-50/20 dark:bg-teal-950/15 flex items-center justify-center text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                1
              </div>
              <span className="font-medium text-foreground/80">Fertile Window</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#e0e0e0] dark:bg-muted flex items-center justify-center text-[10px] text-foreground font-semibold">
                1
              </div>
              <span className="font-medium text-foreground/80">Selected Day</span>
            </div>
          </div>
        )}
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
  predictedDates,
  editMode,
  rangeStart,
  hoveredDateKey,
  onHoverDate,
  data,
  onSelectDate,
  onTogglePeriod,
}: { 
  viewDate: Date
  selectedDate: Date
  isEditingPeriods: boolean
  periodDates: Set<string>
  predictedDates: Set<string>
  editMode: 'single' | 'range'
  rangeStart: string | null
  hoveredDateKey: string | null
  onHoverDate: (key: string | null) => void
  data: { lastPeriodStart: string; typicalCycleDays: number }
  onSelectDate: (date: Date) => void
  onTogglePeriod: (dateKey: string, isShiftKey?: boolean) => void
}) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = new Date(year, month, 1).getDay()

  const dateToKey = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // Calculate tentative range for range-selection preview
  const tentativeRange = React.useMemo(() => {
    const set = new Set<string>()
    if (!isEditingPeriods || editMode !== 'range' || !rangeStart || !hoveredDateKey) return set

    const parseDateKey = (k: string) => {
      const [y, m, dt] = k.split('-').map(Number)
      return new Date(y, m - 1, dt)
    }

    const start = parseDateKey(rangeStart)
    const end = parseDateKey(hoveredDateKey)
    const dStart = start < end ? start : end
    const dEnd = start < end ? end : start
    
    const temp = new Date(dStart)
    while (temp <= dEnd) {
      const key = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}-${String(temp.getDate()).padStart(2, '0')}`
      set.add(key)
      temp.setDate(temp.getDate() + 1)
    }
    return set
  }, [isEditingPeriods, editMode, rangeStart, hoveredDateKey])

  // Calculate fertile window based on typical cycle length
  const cycleLen = data.typicalCycleDays || 28
  const safeCycleLen = Math.min(60, Math.max(15, Math.round(cycleLen)))
  const periodLength = safeCycleLen <= 24 ? 4 : safeCycleLen >= 36 ? 6 : 5
  const ovulationDay = Math.max(periodLength + 5, safeCycleLen - 14)
  const fertileStart = Math.max(periodLength + 1, ovulationDay - 4)
  const fertileEnd = Math.min(safeCycleLen, ovulationDay + 2)

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
            const isPredicted = !isEditingPeriods && predictedDates.has(key)
            const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year
            
            const targetDate = new Date(year, month, d)
            const cycleDay = data.lastPeriodStart 
              ? computeCycleDayForDate(targetDate, data.lastPeriodStart, data.typicalCycleDays)
              : null
            const isFertile = cycleDay !== null && cycleDay >= fertileStart && cycleDay <= fertileEnd

            // Capsule connection checks
            const getDateKeyOffset = (dayOffset: number) => {
              const target = new Date(year, month, d + dayOffset)
              const y = target.getFullYear()
              const m = target.getMonth() + 1
              const dt = target.getDate()
              return `${y}-${String(m).padStart(2, '0')}-${String(dt).padStart(2, '0')}`
            }

            const prevKey = getDateKeyOffset(-1)
            const nextKey = getDateKeyOffset(1)

            const isPrevPeriod = periodDates.has(prevKey)
            const isPrevPredicted = !isEditingPeriods && predictedDates.has(prevKey)
            const isPrevLogged = isPrevPeriod && !isPrevPredicted

            const isNextPeriod = periodDates.has(nextKey)
            const isNextPredicted = !isEditingPeriods && predictedDates.has(nextKey)
            const isNextLogged = isNextPeriod && !isNextPredicted

            const isWeekStart = (offset + d - 1) % 7 === 0
            const isWeekEnd = (offset + d - 1) % 7 === 6

            const connectsLeft = isPeriod && (isPredicted ? isPrevPredicted : isPrevLogged) && !isWeekStart
            const connectsRight = isPeriod && (isPredicted ? isNextPredicted : isNextLogged) && !isWeekEnd

            // Tentative connection checks
            const isTentative = tentativeRange.has(key)
            const isTentativePrev = tentativeRange.has(prevKey)
            const isTentativeNext = tentativeRange.has(nextKey)
            const connectsTentativeLeft = isTentative && isTentativePrev && !isWeekStart
            const connectsTentativeRight = isTentative && isTentativeNext && !isWeekEnd

            const isRangeStartDay = isEditingPeriods && rangeStart === key

            return (
              <button 
                key={d} 
                type="button"
                onClick={(e) => {
                  if (isEditingPeriods) {
                    onTogglePeriod(key, e.shiftKey)
                  } else {
                    onSelectDate(new Date(year, month, d))
                  }
                }}
                onMouseEnter={() => {
                  if (isEditingPeriods && editMode === 'range' && rangeStart) {
                    onHoverDate(key)
                  }
                }}
                onMouseLeave={() => {
                  if (isEditingPeriods && editMode === 'range' && rangeStart) {
                    onHoverDate(null)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (isEditingPeriods) {
                      onTogglePeriod(key, e.shiftKey)
                    } else {
                      onSelectDate(new Date(year, month, d))
                    }
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center cursor-pointer group py-2 sm:py-0 w-full transition-all",
                )}
              >
                {/* Cycle day label */}
                {!isEditingPeriods && (
                  <span className="text-[10px] text-muted-foreground mb-1 font-normal group-hover:text-foreground transition-colors">
                    {cycleDay !== null ? cycleDay : "--"}
                  </span>
                )}
                {isEditingPeriods && (
                  <span className="text-[10px] text-transparent mb-1 select-none">·</span>
                )}

                <div className="relative w-full flex items-center justify-center">
                  {/* Period Capsule Background */}
                  {isPeriod && (
                    <div className={cn(
                      "absolute h-10 sm:h-11 z-0",
                      isPredicted 
                        ? [
                            "border-y border-dashed border-rose-400/80 dark:border-rose-700/80 bg-rose-50/50 dark:bg-rose-950/20",
                            connectsLeft ? "left-0" : "left-[calc(50%-20px)] sm:left-[calc(50%-22px)] border-l rounded-l-full",
                            connectsRight ? "right-0" : "right-[calc(50%-20px)] sm:right-[calc(50%-22px)] border-r rounded-r-full",
                          ]
                        : [
                            "bg-violet-100/95 dark:bg-violet-950/65 border-y border-violet-200 dark:border-violet-900/60",
                            connectsLeft ? "left-0" : "left-[calc(50%-20px)] sm:left-[calc(50%-22px)] border-l rounded-l-full",
                            connectsRight ? "right-0" : "right-[calc(50%-20px)] sm:right-[calc(50%-22px)] border-r rounded-r-full",
                          ]
                    )} />
                  )}

                  {/* Tentative Range Capsule Background (Edit mode range preview) */}
                  {isTentative && (
                    <div className={cn(
                      "absolute h-10 sm:h-11 bg-violet-200/50 dark:bg-violet-900/30 border-y border-dashed border-violet-400/50 z-0",
                      connectsTentativeLeft ? "left-0" : "left-[calc(50%-20px)] sm:left-[calc(50%-22px)] border-l rounded-l-full",
                      connectsTentativeRight ? "right-0" : "right-[calc(50%-20px)] sm:right-[calc(50%-22px)] border-r rounded-r-full",
                    )} />
                  )}

                  {/* Pulsing selection border for range start day */}
                  {isRangeStartDay && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="size-10 sm:size-11 rounded-full border-2 border-violet-500 animate-pulse" />
                    </div>
                  )}

                  {/* Fertile window ring (non-edit mode only) */}
                  {isFertile && !isEditingPeriods && (
                    <div className="absolute inset-0 border-2 border-dashed border-teal-500/80 dark:border-teal-400/80 rounded-full bg-teal-50/20 dark:bg-teal-950/10 z-20 pointer-events-none" />
                  )}

                  <div className={cn(
                    "relative z-10 flex items-center justify-center size-10 sm:size-11 rounded-full transition-all duration-150",
                    isEditingPeriods && [
                      isPeriod
                        ? "bg-violet-600 text-white shadow-[0_2px_12px_rgba(124,58,237,0.35)] scale-105 font-semibold"
                        : "bg-transparent text-foreground/80 hover:bg-violet-500/8 active:scale-90",
                    ],
                    !isEditingPeriods && [
                      isSelected && "bg-[#e0e0e0] dark:bg-muted text-foreground",
                      isPeriod && !isSelected && (isPredicted ? "text-rose-500 dark:text-rose-400/80" : "text-violet-700 dark:text-violet-300 font-bold"),
                      isFertile && !isPeriod && !isSelected && "text-teal-600 dark:text-teal-400 font-semibold",
                      !isPeriod && !isFertile && !isSelected && "text-foreground"
                    ]
                  )}>
                    <span className="relative z-0 text-base font-normal">
                      {d}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

const YearView = ({ 
  viewDate, 
  periodDates, 
  predictedDates,
  today, 
  onMonthClick 
}: { 
  viewDate: Date
  periodDates: Set<string>
  predictedDates: Set<string>
  today: Date
  onMonthClick: (d: Date) => void 
}) => {
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
                const isPredicted = predictedDates.has(key)
                const isToday = d === today.getDate() && idx === today.getMonth() && year === today.getFullYear()
                
                return (
                  <div 
                    key={d} 
                    className={cn(
                      "size-2 rounded-full",
                      isPeriod 
                        ? (isPredicted ? "bg-rose-400" : "bg-violet-500")
                        : isToday 
                          ? "bg-[var(--mf-accent)]" 
                          : "bg-muted/40"
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

function getLatestLoggedPeriodStart(logs: Array<{ date: string; symptoms: string[] }>, today: Date) {
  const todayStr = toDateKey(today)
  const flowDates = logs
    .reduce<string[]>((acc, log) => {
      if (log.date <= todayStr && log.symptoms.some((symptom) => symptom.startsWith('flow-'))) {
        acc.push(log.date)
      }
      return acc
    }, [])
    .sort()

  let latestStart = ''
  let previousDate: Date | null = null

  flowDates.forEach((date) => {
    const current = new Date(`${date}T12:00:00`)
    const isNewPeriod = !previousDate || Math.round((+current - +previousDate) / 86400000) > 4
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
