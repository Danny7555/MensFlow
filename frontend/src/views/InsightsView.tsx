import { useState, useEffect, lazy, Suspense } from 'react'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ChartLineUp, TrendDown, TrendUp, ShieldCheck, Sparkle } from '@phosphor-icons/react'
import { forecastSymptoms } from '../lib/forecasting'
import { INSIGHT_TRENDS_DUMMY } from '../data/insightsData'
import { InteractiveAreaChart } from '../components/InteractiveAreaChart'
import { SymptomTrendsChart } from '../components/SymptomTrendsChart'
import { useAuth } from "@/context/useAuth"
import { cn } from '../lib/utils'
import { HormoneWave } from '../components/dashboard/HormoneWave'
import { RequestAccessModal } from '../components/dashboard/RequestAccessModal'
import { useStore } from '../store/useStore'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { hapticSelection } from '@/lib/haptics'
import { useSEO } from '../hooks/useSEO'
import { useMedications } from '../services/medicationService'
import { DoctorPrintReport } from '../components/dashboard/DoctorPrintReport'

import type { SymptomLog } from '../store/types'
import type { DashboardSnapshot } from '../lib/dashboardStorage'

const SymptomCorrelationChart = lazy(() => import('../components/dashboard/SymptomCorrelationChart').then(m => ({ default: m.SymptomCorrelationChart })))

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
}

const handlePrintPDF = () => {
  hapticSelection()
  window.print()
}

interface SectionProps {
  itemVariants: Variants
}

function TrendSummarySection({ itemVariants }: SectionProps) {
  return (
    <m.section variants={itemVariants} className="insights-section no-print" aria-labelledby="trends-title">
      <h2 id="trends-title" className="insights-section-title">
        Trend summary
      </h2>
      <div className="insight-trends">
        {INSIGHT_TRENDS_DUMMY.map((t) => (
          <m.div
            key={t.id}
            variants={itemVariants}
            className="insight-trend-card"
          >
            <div className="flex flex-col h-full">
              <span className="insight-trend-label">{t.label}</span>
              <span className="insight-trend-value">{t.value}</span>
              <div className="mt-auto pt-1">
                <div className={cn(
                  "flex items-center gap-1.5 text-[11px] font-normal w-fit",
                  t.id === '1' && "text-[var(--mf-warning)]",
                  t.id === '2' && "text-[var(--mf-success)]",
                  t.id === '3' && "text-[var(--mf-info)]"
                )}>
                  {t.id === '1' && <TrendUp size={14} weight="bold" />}
                  {t.id === '2' && <TrendDown size={14} weight="bold" />}
                  {t.id === '3' && <ChartLineUp size={14} weight="bold" />}
                  {t.change}
                </div>
              </div>
            </div>
          </m.div>
        ))}
      </div>
    </m.section>
  )
}

function PatternsOverTimeSection({ itemVariants }: SectionProps) {
  return (
    <m.section variants={itemVariants} className="insights-section no-print" aria-labelledby="charts-title">
      <h2 id="charts-title" className="insights-section-title">
        Patterns over time
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="border rounded-3xl overflow-hidden bg-card">
          <SymptomTrendsChart />
        </div>
        <div className="border rounded-3xl overflow-hidden bg-card">
          <InteractiveAreaChart />
        </div>
      </div>
    </m.section>
  )
}

interface SymptomFrequencySectionProps extends SectionProps {
  logs: SymptomLog[]
  dashboard: DashboardSnapshot
}

function SymptomFrequencySection({ itemVariants, logs, dashboard }: SymptomFrequencySectionProps) {
  return (
    <m.section variants={itemVariants} className="insights-section no-print" aria-labelledby="correlation-title">
      <h2 id="correlation-title" className="insights-section-title">
        Symptom Frequency by Cycle Phase
      </h2>
      <div className="border rounded-3xl overflow-hidden bg-card mt-4 p-4 sm:p-6">
        <p className="text-xs text-muted-foreground mb-4">
          Understand how often your primary symptoms occur across the different phases of your cycle. This helps identify correlations and plan self-care.
        </p>
        <Suspense fallback={<div className="h-[300px] w-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>}>
          <SymptomCorrelationChart 
            logs={logs}
            lastPeriodStart={dashboard.lastPeriodStart}
            typicalCycleDays={dashboard.typicalCycleDays}
          />
        </Suspense>
      </div>
    </m.section>
  )
}

interface ExportSectionProps extends SectionProps {
  handleExportCSV: () => void
  handlePrintPDF: () => void
}

function ExportSection({ itemVariants, handleExportCSV, handlePrintPDF }: ExportSectionProps) {
  return (
    <m.section variants={itemVariants} className="insights-section no-print" aria-labelledby="reports-title">
      <h2 id="reports-title" className="insights-section-title">
        Reports &amp; Export
      </h2>
      <div className="bg-card border border-border p-6 rounded-3xl mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-md">
          <h3 className="text-base font-normal mb-1">Export your cycle summary</h3>
          <p className="text-xs text-muted-foreground font-normal">
            Download a complete CSV log of your cycle metrics or print/save a beautifully formatted PDF report for doctor consultations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-full border border-border text-xs font-normal hover:bg-muted transition-colors"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-5 py-2.5 rounded-full bg-[var(--mf-accent)] text-white text-xs font-normal hover:brightness-105 transition-all"
          >
            Export PDF Report
          </button>
        </div>
      </div>
    </m.section>
  )
}

interface ForecastingSectionProps extends SectionProps {
  logs: SymptomLog[]
  dashboard: DashboardSnapshot
}

function ForecastingSection({ itemVariants, logs, dashboard }: ForecastingSectionProps) {
  const forecasts = forecastSymptoms(logs, dashboard.lastPeriodStart, dashboard.typicalCycleDays)
  const isBootstrapped = !logs || logs.length === 0 || logs.every(l => l.symptoms.length === 0)

  return (
    <m.section variants={itemVariants} className="insights-section no-print animate-in fade-in duration-300" aria-labelledby="forecast-title">
      <div className="flex items-center justify-between mb-4">
        <h2 id="forecast-title" className="insights-section-title flex items-center gap-2">
          <Sparkle size={20} className="text-[var(--mf-accent)]" /> AI Symptom Forecasting
        </h2>
        {isBootstrapped && (
          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-medium">
            Bootstrapped from Cycle Averages
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {forecasts.map((f) => (
          <div key={`${f.symptomId}-${f.phase}`} className="bg-card border border-border p-5 rounded-3xl flex flex-col justify-between gap-3 hover:border-border/80 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {f.phaseLabel} Projections
                </span>
                <h3 className="text-base font-normal text-[var(--mf-text-strong)] mt-0.5">
                  {f.label}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-medium text-[var(--mf-accent)]">
                  {f.probability}%
                </span>
                <span className="block text-[9px] text-muted-foreground font-semibold uppercase">
                  Probability
                </span>
              </div>
            </div>

            <div className="space-y-1 bg-muted/40 p-3 rounded-2xl border border-border/20 text-xs">
              <span className="font-medium text-[var(--mf-text-strong)] block">Recommended Self-Care</span>
              <p className="text-muted-foreground leading-normal">{f.recommendation}</p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
              <span>Confidence: <strong>{f.confidence}</strong></span>
              {f.confidence === 'Low' && (
                <span className="text-[9px] text-amber-500 flex items-center gap-1">
                  Log more days to refine
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </m.section>
  )
}

export function InsightsView() {
  useSEO({
    title: 'Cycle Insights',
    description: 'Analyze your symptom trends, hormone fluctuations, and download reports for your healthcare provider.',
    keywords: 'cycle insights, cycle analytics, hormone trends, symptoms charts, export cycle report'
  })
  const { isAuthenticated, openAuthModal } = useAuth()

  const { logs, customSymptoms, user, partnerStatus, fetchPartnerStatus, requestDetailedAccessAction, dashboard, isSaving } = useStore()
  const { data: meds } = useMedications()
  const activeMeds = meds?.filter(m => m.active) ?? []

  const [showModal, setShowModal] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const isPartner = user?.role === 'partner'
  const showRestrictedView = isPartner && partnerStatus?.paired && partnerStatus?.privacyShareHealthCharts === false

  const handleOpenModal = () => setShowModal(true)

  const handleConfirmRequest = async (selectedFields: string[]) => {
    setShowModal(false)
    setRequestSent(true)
    await requestDetailedAccessAction(selectedFields)
    await fetchPartnerStatus()
  }

  useEffect(() => {
    if (isPartner && partnerStatus === null) {
      void fetchPartnerStatus()
    }
  }, [isPartner, partnerStatus, fetchPartnerStatus])

  const handleExportCSV = () => {
    hapticSelection()
    if (!logs || logs.length === 0) {
      toast.error("No logs available to export.")
      return
    }
    
    const allSymptoms = [...SYMPTOM_DEFS, ...customSymptoms]
    const sorted = logs.toSorted((a, b) => a.date.localeCompare(b.date))
    
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Date,Logged Symptoms\n"
    
    sorted.forEach((log) => {
      const labels = log.symptoms
        .map((sId) => allSymptoms.find((s) => s.id === sId)?.label || sId)
        .join("; ")
      csvContent += `${log.date},"${labels}"\n`
    })
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `mensflow_cycle_report_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV report downloaded!")
  }

  // ── Gate 1: not logged in ────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="insights-page flex items-center justify-center min-h-[60vh]"
      >
        <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[420px] mx-auto">
          <div className="size-16 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center mb-6 mx-auto">
            <ChartLineUp size={32} className="text-[var(--mf-accent)]" />
          </div>
          <h3 className="text-xl font-normal mb-3 text-[var(--mf-text-strong)]">Detailed AI Insights</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-normal">
            Unlock deeper patterns, AI-driven correlations, and your full symptom history by signing in.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal()}
            className="btn btn-primary px-8 py-3 rounded-full"
          >
            Log in to access
          </button>
        </div>
      </m.div>
    )
  }

  // ── Gate 2: partner not yet connected to a lady ──────────────────────────
  if (isPartner && !partnerStatus?.paired) {
    return (
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="insights-page flex items-center justify-center min-h-[60vh]"
      >
        <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[420px] mx-auto">
          <div className="size-16 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center mb-6 mx-auto">
            <ShieldCheck size={32} className="text-[var(--mf-accent)]" />
          </div>
          <h3 className="text-xl font-normal mb-3 text-[var(--mf-text-strong)]">Not Connected Yet</h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed font-normal">
            Health insights are shared with you once you connect with your partner. Head to <strong>Partner Sync</strong> to pair up first.
          </p>
        </div>
      </m.div>
    )
  }

  // ── Gate 3: partner connected but privacy mode on ────────────────────────
  if (showRestrictedView) {
    return (
      <m.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="insights-page"
      >
        <m.div variants={itemVariants}>
          <HormoneWave />
        </m.div>
        <m.div variants={itemVariants} className="insights-section mt-8">
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl text-center w-full max-w-[500px] mx-auto flex flex-col items-center">
            <div className="size-16 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center mb-6">
              <ShieldCheck size={32} className="text-[var(--mf-accent)]" />
            </div>
            <h3 className="text-xl font-normal mb-3 text-[var(--mf-text-strong)]">Privacy &amp; View-Only Mode</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-normal">
              Cycle analytics, trend charts, and exportable reports are private to your partner. As a supporting partner, you have view-only access to her current phase, calendar predictions, and daily symptoms, keeping her personal health data under her control.
            </p>
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={requestSent}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-normal transition-all mb-6",
                requestSent
                  ? "bg-emerald-500 text-white cursor-default animate-in fade-in"
                  : "bg-[var(--mf-accent)] text-white hover:brightness-110 active-squish cursor-pointer border-0 outline-none"
              )}
            >
              {requestSent ? "Access Request Sent ✔" : "Request Detailed Access"}
            </button>
            <div className="w-full border-t border-border pt-6 flex flex-col gap-2 text-xs text-muted-foreground text-left">
              <div className="flex items-start gap-2.5">
                <div className="size-1.5 rounded-full bg-[var(--mf-accent)] mt-1.5 shrink-0" />
                <span>You can view cycle updates and supportive tips on the Dashboard and Calendar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="size-1.5 rounded-full bg-[var(--mf-accent)] mt-1.5 shrink-0" />
                <span>Detailed logs and charts remain confidential to her.</span>
              </div>
            </div>
          </div>
        </m.div>
        <RequestAccessModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmRequest}
          isLoading={isSaving}
        />
      </m.div>
    )
  }

  // ── Full content: authenticated lady or approved partner ─────────────────
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="insights-page relative"
    >

      <div className="flex flex-col gap-1.5 text-left mb-6 px-4 sm:px-0 no-print">
        <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--mf-text-strong)]" id="insights-title">Cycle Insights</h1>
        <p className="text-xs text-muted-foreground">Detailed trends, analytics, and medical-friendly export options.</p>
      </div>

      <m.div variants={itemVariants} className="no-print">
        <HormoneWave />
      </m.div>

      <TrendSummarySection itemVariants={itemVariants} />

      <PatternsOverTimeSection itemVariants={itemVariants} />

      <SymptomFrequencySection 
        itemVariants={itemVariants} 
        logs={logs} 
        dashboard={dashboard} 
      />

      <ForecastingSection 
        itemVariants={itemVariants} 
        logs={logs} 
        dashboard={dashboard} 
      />

      <ExportSection 
        itemVariants={itemVariants} 
        handleExportCSV={handleExportCSV} 
        handlePrintPDF={handlePrintPDF} 
      />

      <DoctorPrintReport 
        user={user}
        dashboard={dashboard}
        logs={logs}
        customSymptoms={customSymptoms}
        activeMeds={activeMeds}
      />
    </m.div>
  )
}
