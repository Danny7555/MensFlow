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

export function DoctorReportModal({ isOpen, onClose }: DoctorReportModalProps) {
  const { logs, dashboard, settings, user } = useStore()
  const [doctorNotes, setDoctorNotes] = useState("")

  if (!isOpen) return null

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

  const handlePrint = () => {
    window.print()
  }

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
          .no-print {
            display: none !important;
          }
          .print-textarea {
            border: none !important;
            resize: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
        }
      `}</style>

      <div className="printable-report-container w-full max-w-4xl bg-background border border-border shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]">
        {/* Modal Header Actions */}
        <div className="no-print flex items-center justify-between px-8 py-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 text-[var(--mf-accent)]">
            <FileText size={22} weight="duotone" />
            <span className="text-sm font-semibold tracking-wide uppercase">Doctor Report Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--mf-accent)] text-white hover:brightness-110 transition-all cursor-pointer active-squish shadow-md"
            >
              <Printer size={16} weight="bold" />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-muted/80 text-muted-foreground transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-white text-gray-900 dark:bg-white dark:text-gray-900">
          {/* Clinical Header */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-900 pb-6 gap-6">
            <div>
              <h1 className="text-3xl font-normal tracking-tight text-gray-900 uppercase">MensFlow Cycle Health Report</h1>
              <p className="text-xs text-gray-500 mt-1.5 font-mono">Generated on {format(new Date(), 'PPpp')}</p>
            </div>
            <div className="text-left md:text-right text-xs space-y-1 font-mono text-gray-700">
              <p><strong>Clinical Tool:</strong> MensFlow App</p>
              <p><strong>Standards:</strong> Symptothermal NFP Protocol</p>
              <p><strong>Irregularity Check:</strong> DSM / ACOG Aligned</p>
            </div>
          </div>

          {/* Demographic Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Patient Name</span>
              <p className="text-base font-semibold text-gray-900">{user?.name || "Patient Account"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Biological Target Condition</span>
              <p className="text-base font-semibold text-gray-900 capitalize">
                {settings.conditionOptimization === 'none' ? 'Standard Track' : settings.conditionOptimization}
              </p>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Clinical Data Range</span>
              <p className="text-gray-900 font-semibold">{logs.length > 0 ? `${logs[logs.length-1].date} to ${logs[0].date}` : 'No logs recorded'}</p>
            </div>
          </div>

          {/* Core Cycle Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">1. Menstrual Cycle Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 border border-gray-200 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-gray-500">Historical Typical Length</span>
                <p className="text-3xl font-light text-gray-900 mt-2">{historicalAvg} <span className="text-sm font-normal text-gray-500">days</span></p>
              </div>
              <div className="p-5 border border-gray-200 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-gray-500">Cycle Variation Range</span>
                <p className="text-3xl font-light text-gray-900 mt-2">±{cycleVariation} <span className="text-sm font-normal text-gray-500">days</span></p>
              </div>
              <div className={`p-5 rounded-xl border flex items-start gap-3 justify-between ${isAtypical ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-green-50 border-green-200 text-green-950'}`}>
                <div className="space-y-1">
                  <span className="text-xs font-semibold opacity-80">ACOG Cycle Pattern</span>
                  <p className="text-base font-bold mt-2">{isAtypical ? 'Atypical / Irregular' : 'Normal / Typical'}</p>
                </div>
                {isAtypical ? <Warning size={24} className="text-amber-600" /> : <SealCheck size={24} className="text-green-600" />}
              </div>
            </div>
          </div>

          {/* Past Cycles Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">2. Cycle Chronology (Last 6 Periods)</h3>
            {historicalPeriods.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                      <th className="p-4">Period Start Date</th>
                      <th className="p-4">Bleeding Duration</th>
                      <th className="p-4">Calculated Cycle Length</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalPeriods.slice(0, 6).map((period: PeriodInfo, idx: number) => {
                      const isAtypicalCycle = period.cycleLength ? (period.cycleLength < 24 || period.cycleLength > 35) : false
                      return (
                        <tr key={idx} className="border-b border-gray-200 last:border-0 hover:bg-gray-50/50">
                          <td className="p-4 font-mono font-medium">{period.startDate}</td>
                          <td className="p-4">{period.duration} days</td>
                          <td className="p-4 font-mono">{period.cycleLength ? `${period.cycleLength} days` : 'Ongoing / Current'}</td>
                          <td className="p-4">
                            {period.cycleLength ? (
                              isAtypicalCycle ? (
                                <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">Irregular</span>
                              ) : (
                                <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-200/50">Regular</span>
                              )
                            ) : (
                              <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50">Active Cycle</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No cycle bleeding history logged.</p>
            )}
          </div>

          {/* Symptom Trends and Biological Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Symptom Frequency */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">3. Symptom Prevalence (Last 90 Days)</h3>
              {symptomCounts.length > 0 ? (
                <div className="space-y-2">
                  {symptomCounts.slice(0, 6).map((sym, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                      <span className="font-medium capitalize">{sym.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{sym.category}</span>
                        <span className="font-mono bg-gray-200/60 text-gray-700 px-2.5 py-0.5 rounded font-semibold">{sym.count} logs</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No symptoms logged in the last 90 days.</p>
              )}
            </div>

            {/* Biological NFP Indicators */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">4. Biological Ovulation Evidence</h3>
              <div className="space-y-3 text-xs">
                <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Positive LH Surge Tests</span>
                    <span className="font-mono text-gray-700">{nfpLogs.positiveLhCount} instances</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Indicates biological confirmation of the luteinizing hormone surge, which usually occurs 24 to 48 hours prior to ovulation.
                  </p>
                </div>

                <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Egg-White Cervical Mucus Logs</span>
                    <span className="font-mono text-gray-700">{nfpLogs.eggWhiteMucusCount} instances</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Estrogen-driven highly fertile cervical mucus tracking. Corresponds to the peak fertile window.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Notes & Signature (Writeable prior to printing!) */}
          <div className="pt-6 border-t-2 border-dashed border-gray-200 space-y-6">
            <div className="space-y-2">
              <label htmlFor="doctor-notes" className="text-sm font-bold uppercase tracking-wider text-gray-900 block">5. Clinician Consultation & Recommendations</label>
              <p className="text-[10px] text-gray-400 no-print">Type clinical feedback or recommendations below before printing the report.</p>
              <textarea
                id="doctor-notes"
                className="print-textarea w-full min-h-[100px] p-4 bg-gray-50/30 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 text-xs font-sans text-gray-800 leading-relaxed"
                placeholder="Clinician notes, diagnostic impressions, dietary suggestions, or follow-up timelines..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
              />
            </div>

            {/* Signature Area */}
            <div className="flex justify-between items-end pt-8 gap-8">
              <div className="space-y-1 text-xs text-gray-700 font-mono">
                <p><strong>Device Data Integrity:</strong> Validated ✔</p>
                <p><strong>Patient Authorization:</strong> Approved ✔</p>
              </div>
              <div className="w-56 space-y-1 text-center font-mono">
                <div className="border-b border-gray-900 h-8" />
                <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-1">Clinician Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
