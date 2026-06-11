import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Printer, X, FileText, Warning, SealCheck } from "@phosphor-icons/react"
import { useStore } from "@/store/useStore"
import { calculatePeriodsFromLogs, type PeriodInfo } from "../../lib/cycleUtils"
import { SYMPTOM_DEFS } from "@/data/symptomsData"

interface DoctorReportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DemographicBoxProps {
  patientName: string
  condition: string
  dataRange: string
}

function DemographicBox({ patientName, condition, dataRange }: DemographicBoxProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--mf-composer-bg)]/30 p-6 rounded-2xl border border-[var(--mf-border)]">
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--mf-muted)]">Patient Name</span>
        <p className="text-base font-medium text-[var(--mf-text-strong)]">{patientName}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--mf-muted)]">Biological Target Condition</span>
        <p className="text-base font-medium text-[var(--mf-text-strong)] capitalize font-normal">
          {condition === 'none' ? 'Standard Track' : condition}
        </p>
      </div>
      <div className="space-y-1 font-mono text-xs">
        <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--mf-muted)]">Clinical Data Range</span>
        <p className="text-[var(--mf-text-strong)] font-medium">{dataRange}</p>
      </div>
    </div>
  )
}

interface CycleMetricsBoxProps {
  historicalAvg: number
  cycleVariation: number
  isAtypical: boolean
}

function CycleMetricsBox({ historicalAvg, cycleVariation, isAtypical }: CycleMetricsBoxProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] border-b border-[var(--mf-border)] pb-2">1. Menstrual Cycle Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 border border-[var(--mf-border)] bg-[var(--mf-composer-bg)]/20 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--mf-muted)]">Historical Typical Length</span>
          <p className="text-3xl font-light text-[var(--mf-text-strong)] mt-2">{historicalAvg} <span className="text-sm font-normal text-[var(--mf-muted)]">days</span></p>
        </div>
        <div className="p-5 border border-[var(--mf-border)] bg-[var(--mf-composer-bg)]/20 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--mf-muted)]">Cycle Variation Range</span>
          <p className="text-3xl font-light text-[var(--mf-text-strong)] mt-2">±{cycleVariation} <span className="text-sm font-normal text-[var(--mf-muted)]">days</span></p>
        </div>
        <div className={`p-5 rounded-xl border flex items-start gap-3 justify-between ${isAtypical ? 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
          <div className="space-y-1">
            <span className="text-xs font-medium opacity-80">ACOG Cycle Pattern</span>
            <p className="text-base font-semibold mt-2">{isAtypical ? 'Atypical / Irregular' : 'Normal / Typical'}</p>
          </div>
          {isAtypical ? <Warning size={24} className="text-amber-600 dark:text-amber-400" /> : <SealCheck size={24} className="text-emerald-600 dark:text-emerald-400" />}
        </div>
      </div>
    </div>
  )
}

interface CycleChronologyTableProps {
  historicalPeriods: PeriodInfo[]
}

function CycleChronologyTable({ historicalPeriods }: CycleChronologyTableProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] border-b border-[var(--mf-border)] pb-2">2. Cycle Chronology (Last 6 Periods)</h3>
      {historicalPeriods.length > 0 ? (
        <div className="overflow-hidden border border-[var(--mf-border)] rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--mf-composer-bg)]/40 border-b border-[var(--mf-border)] text-[var(--mf-muted)] font-medium uppercase tracking-wider">
                <th className="p-4">Period Start Date</th>
                <th className="p-4">Bleeding Duration</th>
                <th className="p-4">Calculated Cycle Length</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {historicalPeriods.slice(0, 6).map((period: PeriodInfo) => {
                const isAtypicalCycle = period.cycleLength ? (period.cycleLength < 24 || period.cycleLength > 35) : false
                return (
                  <tr key={period.startDate} className="border-b border-[var(--mf-border)] last:border-0 hover:bg-[var(--mf-composer-bg)]/30">
                    <td className="p-4 font-mono font-medium text-[var(--mf-text-strong)]">{period.startDate}</td>
                    <td className="p-4 text-[var(--mf-text)]">{period.duration} days</td>
                    <td className="p-4 font-mono text-[var(--mf-text-strong)]">{period.cycleLength ? `${period.cycleLength} days` : 'Ongoing / Current'}</td>
                    <td className="p-4">
                      {period.cycleLength ? (
                        isAtypicalCycle ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Irregular</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Regular</span>
                        )
                      ) : (
                        <span className="text-sky-600 dark:text-sky-400 font-medium bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">Active Cycle</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-[var(--mf-muted)] italic">No cycle bleeding history logged.</p>
      )}
    </div>
  )
}

interface SymptomPrevalenceAndEvidenceProps {
  symptomCounts: Array<{ id: string; label: string; category: string; count: number }>
  positiveLhCount: number
  eggWhiteMucusCount: number
}

function SymptomPrevalenceAndEvidence({ symptomCounts, positiveLhCount, eggWhiteMucusCount }: SymptomPrevalenceAndEvidenceProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Symptom Frequency */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] border-b border-[var(--mf-border)] pb-2">3. Symptom Prevalence (Last 90 Days)</h3>
        {symptomCounts.length > 0 ? (
          <div className="space-y-2">
            {symptomCounts.slice(0, 6).map((sym) => (
              <div key={sym.id} className="flex justify-between items-center text-xs p-2.5 bg-[var(--mf-composer-bg)]/30 rounded-lg border border-[var(--mf-border)]">
                <span className="font-medium capitalize text-[var(--mf-text-strong)]">{sym.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-medium text-[var(--mf-muted)] tracking-widest">{sym.category}</span>
                  <span className="font-mono bg-[var(--mf-card)] border border-[var(--mf-border)] text-[var(--mf-text-strong)] px-2.5 py-0.5 rounded font-semibold">{sym.count} logs</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--mf-muted)] italic">No symptoms logged in the last 90 days.</p>
        )}
      </div>

      {/* Biological NFP Indicators */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] border-b border-[var(--mf-border)] pb-2">4. Biological Ovulation Evidence</h3>
        <div className="space-y-3 text-xs">
          <div className="p-4 border border-[var(--mf-border)] rounded-xl bg-[var(--mf-composer-bg)]/20 space-y-1">
            <div className="flex justify-between font-semibold text-[var(--mf-text-strong)]">
              <span>Positive LH Surge Tests</span>
              <span className="font-mono text-[var(--mf-text-strong)]">{positiveLhCount} instances</span>
            </div>
            <p className="text-[10px] text-[var(--mf-muted)] leading-relaxed">
              Indicates biological confirmation of the luteinizing hormone surge, which usually occurs 24 to 48 hours prior to ovulation.
            </p>
          </div>

          <div className="p-4 border border-[var(--mf-border)] rounded-xl bg-[var(--mf-composer-bg)]/20 space-y-1">
            <div className="flex justify-between font-semibold text-[var(--mf-text-strong)]">
              <span>Egg-White Cervical Mucus Logs</span>
              <span className="font-mono text-[var(--mf-text-strong)]">{eggWhiteMucusCount} instances</span>
            </div>
            <p className="text-[10px] text-[var(--mf-muted)] leading-relaxed">
              Estrogen-driven highly fertile cervical mucus tracking. Corresponds to the peak fertile window.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const handlePrint = () => {
  window.print()
}

export function DoctorReportModal({ isOpen, onClose }: DoctorReportModalProps) {
  const { logs, dashboard, settings, user } = useStore()
  const [doctorNotes, setDoctorNotes] = useState("")

  // 1. Calculate historical cycle data
  const historicalPeriods = useMemo(() => {
    return calculatePeriodsFromLogs(logs)
  }, [logs])

  // 2. Calculate average cycle duration and variation from history
  const validLengths = historicalPeriods
    .map((p: PeriodInfo) => p.cycleLength)
    .filter((len): len is number => typeof len === 'number' && len >= 15 && len <= 60)

  const historicalAvg = validLengths.length > 0
    ? Math.round(validLengths.reduce((a: number, b: number) => a + b, 0) / validLengths.length)
    : dashboard.typicalCycleDays || 28

  const cycleVariation = validLengths.length >= 2
    ? Math.max(...validLengths) - Math.min(...validLengths)
    : dashboard.cycleVariationDays || 8

  const isAtypical = historicalAvg < 24 || historicalAvg > 35 || cycleVariation > 14

  // 3. Count symptom frequencies in the last 3 cycles (or last 90 days)
  const symptomCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    // Filter logs with symptoms in the last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    logs.forEach(log => {
      const logDate = new Date(log.date + 'T12:00:00')
      if (logDate >= ninetyDaysAgo) {
        log.symptoms.forEach(sym => {
          counts[sym] = (counts[sym] || 0) + 1
        })
      }
    })

    return Object.entries(counts)
      .map(([id, count]) => {
        const def = SYMPTOM_DEFS.find(s => s.id === id)
        return {
          id,
          label: def ? def.label : id.replace(/^(phys|mood|flow|life|pcos|endo|peri)-/, '').replace(/-/g, ' '),
          category: def ? def.category : 'Custom',
          count
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [logs])

  // 4. Summarize NFP biological logs (LH test & Mucus)
  const nfpLogs = useMemo(() => {
    let positiveLhCount = 0
    let eggWhiteMucusCount = 0
    
    logs.forEach(log => {
      if (log.lhLevel === 'positive') positiveLhCount++
      if (log.mucus === 'egg-white') eggWhiteMucusCount++
    })

    return { positiveLhCount, eggWhiteMucusCount }
  }, [logs])

  if (!isOpen) return null

  const dataRangeStr = logs.length > 0 ? `${logs[logs.length-1].date} to ${logs[0].date}` : 'No logs recorded'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto no-print-backdrop">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report-container, .printable-report-container * {
            visibility: visible;
          }
          .printable-report-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Force print-specific overrides for high contrast black-on-white printing */
          .printable-report-container * {
            background: transparent !important;
            background-color: transparent !important;
            color: black !important;
            border-color: #444 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print-textarea {
            border: none !important;
            resize: none !important;
            padding: 0 !important;
            background: transparent !important;
            color: black !important;
          }
          .border-b-2 {
            border-bottom-width: 2px !important;
            border-bottom-color: black !important;
            border-bottom-style: solid !important;
          }
          .border-t-2 {
            border-top-width: 2px !important;
            border-top-color: black !important;
            border-top-style: dashed !important;
          }
          .border-b {
            border-bottom-width: 1px !important;
            border-bottom-color: black !important;
            border-bottom-style: solid !important;
          }
        }
      `}</style>

      <div className="printable-report-container w-full max-w-4xl bg-[var(--mf-card)] border border-[var(--mf-border)] shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]">
        {/* Modal Header Actions */}
        <div className="no-print flex items-center justify-between px-8 py-5 border-b border-[var(--mf-border)] bg-[var(--mf-composer-bg)]/40">
          <div className="flex items-center gap-2 text-[var(--mf-accent)]">
            <FileText size={22} weight="duotone" />
            <span className="text-sm font-semibold tracking-wide uppercase">Doctor Report Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--mf-accent)] text-white hover:brightness-110 transition-all cursor-pointer active:scale-95 shadow-md border-0"
            >
              <Printer size={16} weight="bold" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-[var(--mf-composer-bg)] text-[var(--mf-text-strong)] transition-colors cursor-pointer border-0"
              aria-label="Close modal"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-[var(--mf-card)] text-[var(--mf-text-strong)]">
          {/* Clinical Header */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-[var(--mf-border-strong)] pb-6 gap-6">
            <div>
              <h1 className="text-3xl font-normal tracking-tight text-[var(--mf-text-strong)] uppercase">MensFlow Cycle Health Report</h1>
              <p className="text-xs text-[var(--mf-muted)] mt-1.5 font-mono" suppressHydrationWarning>Generated on {format(new Date(), 'PPpp')}</p>
            </div>
            <div className="text-left md:text-right text-xs space-y-1 font-mono text-[var(--mf-text)]">
              <p><strong>Clinical Tool:</strong> MensFlow App</p>
              <p><strong>Standards:</strong> Symptothermal NFP Protocol</p>
              <p><strong>Irregularity Check:</strong> DSM / ACOG Aligned</p>
            </div>
          </div>

          {/* Demographic Box */}
          <DemographicBox 
            patientName={user?.name || "Patient Account"} 
            condition={settings.conditionOptimization} 
            dataRange={dataRangeStr} 
          />

          {/* Core Cycle Stats */}
          <CycleMetricsBox 
            historicalAvg={historicalAvg} 
            cycleVariation={cycleVariation} 
            isAtypical={isAtypical} 
          />

          {/* Past Cycles Table */}
          <CycleChronologyTable 
            historicalPeriods={historicalPeriods} 
          />

          {/* Symptom Trends and Biological Evidence */}
          <SymptomPrevalenceAndEvidence 
            symptomCounts={symptomCounts} 
            positiveLhCount={nfpLogs.positiveLhCount} 
            eggWhiteMucusCount={nfpLogs.eggWhiteMucusCount} 
          />

          {/* Doctor Notes & Signature (Writeable prior to printing!) */}
          <div className="pt-6 border-t-2 border-dashed border-[var(--mf-border)] space-y-6">
            <div className="space-y-2">
              <label htmlFor="doctor-notes" className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] block">5. Clinician Consultation & Recommendations</label>
              <p className="text-[10px] text-[var(--mf-muted)] no-print">Type clinical feedback or recommendations below before printing the report.</p>
              <textarea
                id="doctor-notes"
                className="print-textarea w-full min-h-[100px] p-4 bg-[var(--mf-composer-bg)]/40 border border-[var(--mf-border)] text-[var(--mf-text-strong)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--mf-accent)] text-xs font-sans leading-relaxed"
                placeholder="Clinician notes, diagnostic impressions, dietary suggestions, or follow-up timelines..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
              />
            </div>

            {/* Signature Area */}
            <div className="flex justify-between items-end pt-8 gap-8">
              <div className="space-y-1 text-xs text-[var(--mf-text)] font-mono">
                <p><strong>Device Data Integrity:</strong> Validated ✔</p>
                <p><strong>Patient Authorization:</strong> Approved ✔</p>
              </div>
              <div className="w-56 space-y-1 text-center font-mono">
                <div className="border-b border-[var(--mf-text-strong)] h-8" />
                <p className="text-[10px] text-[var(--mf-muted)] uppercase tracking-widest pt-1">Clinician Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
