import { useState } from 'react'
import { m } from 'framer-motion'
import { Plus, Trash, Pill, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useMedications, useCreateMedication, useDeleteMedication } from '../services/medicationService'
import { Button } from '@/components/ui/button'

export function MedicationsView() {
  const { data: meds, isLoading } = useMedications()
  const createMed = useCreateMedication()
  const deleteMed = useDeleteMedication()
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [timeOfDay, setTimeOfDay] = useState('08:00')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) return
    try {
      await createMed.mutateAsync({ name: name.trim(), dosage, frequency, timeOfDay, notes })
      toast.success('Medication added')
      setName('')
      setDosage('')
      setFrequency('daily')
      setTimeOfDay('08:00')
      setNotes('')
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add medication')
    }
  }

  return (
    <div className="dashboard-flo-theme relative min-h-screen animate-in fade-in duration-300">
      <main className="flo-main-container pb-24 md:pb-32 pt-6 md:pt-10">
        <div className="flo-content-inner max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--mf-text-strong)] tracking-tight">Medications</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track your pills, supplements, and treatments</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="size-11 shrink-0 rounded-2xl bg-[var(--mf-accent)] text-white flex items-center justify-center hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus size={22} weight="bold" />
            </button>
          </div>

          {showForm && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[var(--mf-card)] rounded-2xl border border-[var(--mf-border)] p-5 space-y-4 mb-6"
            >
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Medication name *"
                className="w-full h-11 px-4 rounded-xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)]"
              />
              <div className="flex gap-3">
                <input
                  value={dosage}
                  onChange={e => setDosage(e.target.value)}
                  placeholder="Dosage (e.g. 500mg)"
                  className="flex-1 h-11 px-4 rounded-xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)]"
                />
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)]"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as-needed">As needed</option>
                </select>
              </div>
              <div className="flex gap-3">
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={e => setTimeOfDay(e.target.value)}
                  className="h-11 px-4 rounded-xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)]"
                />
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="flex-1 h-11 px-4 rounded-xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)]"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!name.trim() || createMed.isPending} className="flex-1 rounded-xl">
                  {createMed.isPending ? 'Adding...' : 'Add Medication'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              </div>
            </m.div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="size-8 rounded-full border-2 border-[var(--mf-border)] border-t-[var(--mf-accent)] animate-spin" />
            </div>
          ) : meds && meds.length > 0 ? (
            <div className="space-y-3">
              {meds.map(med => (
                <div key={med._id} className="bg-white dark:bg-[var(--mf-card)] rounded-2xl border border-[var(--mf-border)] p-4 md:p-5 flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] shrink-0">
                    <Pill size={20} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--mf-text-strong)]">{med.name}</h3>
                      {med.dosage && <span className="text-xs text-muted-foreground">{med.dosage}</span>}
                      {!med.active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={12} />{med.timeOfDay}</span>
                      <span className="capitalize">{med.frequency}</span>
                    </div>
                    {med.notes && <p className="text-xs text-muted-foreground mt-1">{med.notes}</p>}
                  </div>
                  <>{confirmDeleteId === med._id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setConfirmDeleteId(null)}>
                      <m.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-[var(--mf-card)] border border-[var(--mf-border)] rounded-xl p-4 min-w-[200px]"
                      >
                        <p className="text-sm text-[var(--mf-text)] mb-3">Remove this medication?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { deleteMed.mutate(med._id); setConfirmDeleteId(null) }}
                            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--mf-danger)] text-white hover:brightness-110 transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:text-[var(--mf-text-strong)] transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </m.div>
                    </div>
                  )}</>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(med._id)}
                    className="text-muted-foreground hover:text-[var(--mf-danger)] transition-colors cursor-pointer shrink-0 mt-1"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="size-16 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
                <Pill size={32} weight="thin" />
              </div>
              <div className="text-center space-y-1.5 max-w-xs">
                <p className="text-base font-semibold text-[var(--mf-text-strong)]">No medications tracked</p>
                <p className="text-sm text-muted-foreground">Add your pills, supplements, or treatments to keep track.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
