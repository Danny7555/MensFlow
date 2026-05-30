import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ChartLineUp, TrendDown, TrendUp, ShieldCheck } from '@phosphor-icons/react'
import { INSIGHT_TRENDS_DUMMY } from '../data/insightsData'
import { InteractiveAreaChart } from '../components/InteractiveAreaChart'
import { SymptomTrendsChart } from '../components/SymptomTrendsChart'
import { useAuth } from "@/context/useAuth"
import { cn } from '../lib/utils'
import { InsightsSkeleton } from '../components/skeletons/InsightsSkeleton'
import { HormoneWave } from '../components/dashboard/HormoneWave'
import { useStore } from '../store/useStore'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import { format } from 'date-fns'
import { toast } from 'sonner'

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

export function InsightsView() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const { logs, customSymptoms, user } = useStore()
  const [requestSent, setRequestSent] = useState(false)

  const handleRequestAccess = () => {
    setRequestSent(true)
    toast.success("Access request sent! Your partner will receive a notification to enable detailed sharing.")
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleExportCSV = () => {
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

  const handlePrintPDF = () => {
    window.print()
  }

  if (isLoading) {
    return <InsightsSkeleton />
  }

  return (
    <m.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="insights-page relative"
    >
      <m.div variants={itemVariants}>
        <HormoneWave />
      </m.div>

      {user?.role === 'partner' ? (
        <m.div variants={itemVariants} className="insights-section mt-8">
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl text-center w-full max-w-[500px] mx-auto flex flex-col items-center">
            <div className="size-16 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center mb-6">
              <ShieldCheck size={32} className="text-[var(--mf-accent)]" />
            </div>
            <h3 className="text-xl font-normal mb-3 text-[var(--mf-text-strong)]">Privacy & View-Only Mode</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-normal">
              Cycle analytics, trend charts, and exportable reports are private to your partner. As a supporting partner, you have view-only access to her current phase, calendar predictions, and daily symptoms, keeping her personal health data under her control.
            </p>
            <button
              type="button"
              onClick={handleRequestAccess}
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
      ) : (
        <>
          <m.section variants={itemVariants} className="insights-section" aria-labelledby="trends-title">
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

          <div className="relative">
            <m.section variants={itemVariants} className="insights-section" aria-labelledby="charts-title">
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

            <m.section variants={itemVariants} className="insights-section no-print" aria-labelledby="reports-title">
              <h2 id="reports-title" className="insights-section-title">
                Reports & Export
              </h2>
              <div className="bg-card border border-border p-6 rounded-3xl mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-md">
                  <h3 className="text-base font-normal mb-1">Export your cycle summary</h3>
                  <p className="text-xs text-muted-foreground font-normal">Download a complete CSV log of your cycle metrics or print/save a beautifully formatted PDF report for doctor consultations.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleExportCSV}
                    className="px-5 py-2.5 rounded-full border border-border text-xs font-normal hover:bg-muted transition-colors"
                  >
                    Download CSV
                  </button>
                  <button 
                    onClick={handlePrintPDF}
                    className="px-5 py-2.5 rounded-full bg-[var(--mf-accent)] text-white text-xs font-normal hover:brightness-105 transition-all"
                  >
                    Export PDF Report
                  </button>
                </div>
              </div>
            </m.section>

            {!isAuthenticated && (
              <m.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20 flex flex-col items-center justify-center pt-24"
              >
                <div className="w-full h-full backdrop-blur-[6px] opacity-100" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-auto">
                   <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto">
                    <h3 className="text-xl font-normal mb-2">Detailed AI Insights</h3>
                    <p className="text-muted-foreground text-sm mb-6">Unlock deeper patterns, AI-driven correlations, and symptom history by signing in.</p>
                    <button 
                      onClick={openAuthModal}
                      className="btn btn-primary px-8 py-3 rounded-full"
                    >
                      Log in to access
                    </button>
                  </div>
                </div>
              </m.div>
            )}
          </div>
        </>
      )}
    </m.div>
  )
}
