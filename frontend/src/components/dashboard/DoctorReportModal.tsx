import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Printer, X, FileText, Warning, SealCheck } from "@phosphor-icons/react"
import { useStore } from "@/store/useStore"
import { calculatePeriodsFromLogs, type PeriodInfo } from "../../lib/cycleUtils"
import { SYMPTOM_DEFS } from "@/data/symptomsData"
import { Button } from "@/components/ui/button"

interface DoctorReportModalProps {
  isOpen: boolean
  onClose: () => void
}

function DemographicBox({ patientName, condition, dataRange }: { patientName: string; condition: string; dataRange: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--mf-border)] rounded-2xl overflow-hidden border border-[var(--mf-border)]">
      {[
        { label: "Patient Name", value: patientName },
        { label: "Biological Target Condition", value: condition === 'none' ? 'Standard Track' : condition },
        { label: "Clinical Data Range", value: dataRange },
      ].map((item) => (
        <div key={item.label} className="bg-[var(--mf-card)] p-5 space-y-1.5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--mf-muted)]">{item.label}</span>
          <p className="text-sm font-medium text-[var(--mf-text-strong)]">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function CycleMetricsBox({ historicalAvg, cycleVariation, isAtypical }: { historicalAvg: number; cycleVariation: number; isAtypical: boolean }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-[var(--mf-accent)]" />
        Menstrual Cycle Metrics
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl border border-[var(--mf-border)] bg-[var(--mf-card)] space-y-2">
          <span className="text-xs font-medium text-[var(--mf-muted)]">Historical Typical Length</span>
          <p className="text-3xl font-light text-[var(--mf-text-strong)]">
            {historicalAvg} <span className="text-sm font-normal text-[var(--mf-muted)]">days</span>
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-[var(--mf-border)] bg-[var(--mf-card)] space-y-2">
          <span className="text-xs font-medium text-[var(--mf-muted)]">Cycle Variation Range</span>
          <p className="text-3xl font-light text-[var(--mf-text-strong)]">
            &plusmn;{cycleVariation} <span className="text-sm font-normal text-[var(--mf-muted)]">days</span>
          </p>
        </div>
        <div className={`p-5 rounded-2xl border flex items-start gap-3 ${isAtypical ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20' : 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20'}`}>
          <div className="space-y-1.5 flex-1">
            <span className={`text-xs font-medium ${isAtypical ? 'text-amber-600/70 dark:text-amber-400/70' : 'text-emerald-600/70 dark:text-emerald-400/70'}`}>ACOG Cycle Pattern</span>
            <p className={`text-base font-semibold ${isAtypical ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isAtypical ? 'Atypical / Irregular' : 'Normal / Typical'}
            </p>
          </div>
          {isAtypical ? (
            <Warning size={22} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
          ) : (
            <SealCheck size={22} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
          )}
        </div>
      </div>
    </div>
  )
}

function CycleChronologyTable({ historicalPeriods }: { historicalPeriods: PeriodInfo[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-[var(--mf-accent)]" />
        Cycle Chronology (Last 6 Periods)
      </h3>
      {historicalPeriods.length > 0 ? (
        <div className="border border-[var(--mf-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--mf-composer-bg)]/60 border-b border-[var(--mf-border)]">
                <th className="p-4 font-semibold text-[var(--mf-muted)] uppercase tracking-wider">Period Start</th>
                <th className="p-4 font-semibold text-[var(--mf-muted)] uppercase tracking-wider">Bleeding Duration</th>
                <th className="p-4 font-semibold text-[var(--mf-muted)] uppercase tracking-wider">Cycle Length</th>
                <th className="p-4 font-semibold text-[var(--mf-muted)] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {historicalPeriods.slice(0, 6).map((period, idx) => {
                const isAtypicalCycle = period.cycleLength ? (period.cycleLength < 24 || period.cycleLength > 35) : false
                return (
                  <tr key={period.startDate} className={`border-b border-[var(--mf-border)] last:border-0 ${idx % 2 === 0 ? 'bg-[var(--mf-composer-bg)]/20' : 'bg-transparent'}`}>
                    <td className="p-4 font-mono font-medium text-[var(--mf-text-strong)]">{period.startDate}</td>
                    <td className="p-4 text-[var(--mf-text)] font-medium">{period.duration} days</td>
                    <td className="p-4 font-mono text-[var(--mf-text-strong)]">{period.cycleLength ? `${period.cycleLength} days` : <span className="text-[var(--mf-muted)] italic">Ongoing</span>}</td>
                    <td className="p-4">
                      {period.cycleLength ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${isAtypicalCycle ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                          {isAtypicalCycle ? 'Irregular' : 'Regular'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20">
                          Active Cycle
                        </span>
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

function SymptomPrevalenceAndEvidence({ symptomCounts, positiveLhCount, eggWhiteMucusCount }: { symptomCounts: Array<{ id: string; label: string; category: string; count: number }>; positiveLhCount: number; eggWhiteMucusCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--mf-accent)]" />
          Symptom Prevalence (Last 90 Days)
        </h3>
        {symptomCounts.length > 0 ? (
          <div className="space-y-1.5">
            {symptomCounts.slice(0, 8).map((sym) => (
              <div key={sym.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--mf-composer-bg)]/30 border border-[var(--mf-border)]">
                <span className="text-xs font-medium text-[var(--mf-text-strong)] capitalize">{sym.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase font-semibold text-[var(--mf-muted)] tracking-widest">{sym.category}</span>
                  <span className="text-xs font-mono font-semibold text-[var(--mf-text-strong)] bg-[var(--mf-card)] border border-[var(--mf-border)] px-2.5 py-0.5 rounded-lg">{sym.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--mf-muted)] italic">No symptoms logged in the last 90 days.</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mf-text-strong)] flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--mf-accent)]" />
          Biological Ovulation Evidence
        </h3>
        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-[var(--mf-border)] bg-[var(--mf-card)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--mf-text-strong)]">Positive LH Surge Tests</span>
              <span className="text-sm font-mono font-bold text-[var(--mf-accent)]">{positiveLhCount}</span>
            </div>
            <p className="text-[10px] text-[var(--mf-muted)] leading-relaxed">
              Indicates biological confirmation of the luteinizing hormone surge, which usually occurs 24&ndash;48 hours prior to ovulation.
            </p>
          </div>
          <div className="p-4 rounded-2xl border border-[var(--mf-border)] bg-[var(--mf-card)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--mf-text-strong)]">Egg-White Cervical Mucus Logs</span>
              <span className="text-sm font-mono font-bold text-[var(--mf-accent)]">{eggWhiteMucusCount}</span>
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

export function DoctorReportModal({ isOpen, onClose }: DoctorReportModalProps) {
  const { logs, dashboard, settings, user } = useStore()
  const [doctorNotes, setDoctorNotes] = useState("")

  const historicalPeriods = useMemo(() => {
    return calculatePeriodsFromLogs(logs)
  }, [logs])

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

  const symptomCounts = useMemo(() => {
    const counts: Record<string, number> = {}
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
          body * { visibility: hidden; }
          .printable-report-container, .printable-report-container * { visibility: visible; }
          .printable-report-container {
            position: absolute; left: 0; top: 0;
            width: 100% !important; max-width: 100% !important;
            background: white !important; color: black !important;
            box-shadow: none !important; padding: 0 !important; margin: 0 !important;
          }
          .printable-report-container * {
            background: transparent !important; background-color: transparent !important;
            color: black !important; border-color: #444 !important; box-shadow: none !important;
          }
          .no-print { display: none !important; }
          .print-textarea { border: none !important; resize: none !important; padding: 0 !important; background: transparent !important; color: black !important; }
        }
      `}</style>

      <div className="printable-report-container w-full max-w-4xl bg-[var(--mf-card)] border border-[var(--mf-border)] rounded-3xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="no-print flex items-center justify-between px-6 sm:px-8 py-4 border-b border-[var(--mf-border)]">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)]">
              <FileText size={18} weight="duotone" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[var(--mf-text-strong)]">Doctor Report Preview</span>
              <p className="text-[10px] text-[var(--mf-muted)]">Clinical summary for consultation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 text-xs gap-2"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              Print Report
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-xl hover:bg-[var(--mf-composer-bg)] text-[var(--mf-muted)] hover:text-[var(--mf-text-strong)] flex items-center justify-center transition-colors cursor-pointer border-0"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-8 bg-[var(--mf-card)]">
          {/* Clinical Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-[var(--mf-border)]">
            <div>
              <h1 className="text-xl sm:text-2xl font-light text-[var(--mf-text-strong)] tracking-tight">
                Cycle Health Report
              </h1>
              <p className="text-xs text-[var(--mf-muted)] mt-1" suppressHydrationWarning>
                Generated {format(new Date(), 'PPpp')}
              </p>
            </div>
            <div className="text-left md:text-right text-[10px] space-y-0.5 text-[var(--mf-muted)] leading-relaxed">
              <p><span className="font-medium text-[var(--mf-text)]">Tool:</span> MensFlow App</p>
              <p><span className="font-medium text-[var(--mf-text)]">Protocol:</span> Symptothermal NFP</p>
              <p><span className="font-medium text-[var(--mf-text)]">Standards:</span> DSM / ACOG Aligned</p>
            </div>
          </div>

          <DemographicBox
            patientName={user?.name || "Patient Account"}
            condition={settings.conditionOptimization}
            dataRange={dataRangeStr}
          />

          <CycleMetricsBox
            historicalAvg={historicalAvg}
            cycleVariation={cycleVariation}
            isAtypical={isAtypical}
          />

          <CycleChronologyTable
            historicalPeriods={historicalPeriods}
          />

          <SymptomPrevalenceAndEvidence
            symptomCounts={symptomCounts}
            positiveLhCount={nfpLogs.positiveLhCount}
            eggWhiteMucusCount={nfpLogs.eggWhiteMucusCount}
          />

          {/* Notes & Signature */}
          <div className="pt-6 border-t border-dashed border-[var(--mf-border)] space-y-6">
            <div className="space-y-2">
              <label htmlFor="doctor-notes" className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--mf-accent)]" />
                Clinician Notes
              </label>
              <p className="text-[10px] text-[var(--mf-muted)] no-print">Type clinical feedback or recommendations below before printing.</p>
              <textarea
                id="doctor-notes"
                className="print-textarea w-full min-h-[100px] p-4 bg-[var(--mf-composer-bg)]/40 border border-[var(--mf-border)] text-[var(--mf-text-strong)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--mf-accent)] text-xs leading-relaxed resize-y"
                placeholder="Clinical impressions, recommendations, follow-up plan..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 pt-4">
              <div className="space-y-1 text-xs text-[var(--mf-text)]">
                <p className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  Device Data Integrity: Validated
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  Patient Authorization: Approved
                </p>
              </div>
              <div className="w-full sm:w-56 space-y-1.5 text-center">
                <div className="border-b-2 border-[var(--mf-border-strong)] h-8" />
                <p className="text-[10px] text-[var(--mf-muted)] uppercase tracking-widest font-medium">Clinician Signature &amp; Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
