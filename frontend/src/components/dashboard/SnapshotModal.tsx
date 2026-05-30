import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function formatPeriodStartDeterministic(dateStr: string) {
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr
  const year = parts[0]
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES[monthIdx]} ${day}, ${year}`
  }
  return dateStr
}

function parsePeriodStartDeterministic(dateStr?: string) {
  return dateStr ? new Date(`${dateStr}T12:00:00`) : undefined
}

interface SnapshotData {
  lastPeriodStart: string
  typicalCycleDays: number
  cycleNotes?: string
  cycleVariationDays?: number
  isAtypical?: boolean
}

interface SnapshotModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  data: SnapshotData
  update: (data: SnapshotData) => Promise<void>
  isSaving: boolean
}

export function SnapshotModal({ isOpen, onOpenChange, data, update, isSaving }: SnapshotModalProps) {
  const [localSnapshot, setLocalSnapshot] = React.useState({
    lastPeriodStart: data.lastPeriodStart,
    typicalCycleDays: data.typicalCycleDays,
    cycleNotes: data.cycleNotes || "",
    cycleVariationDays: data.cycleVariationDays ?? 36,
    isAtypical: data.isAtypical ?? true,
  })



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal">Your Snapshot</DialogTitle>
          <DialogDescription>
            Update your cycle basics to get more accurate predictions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <label htmlFor="period-start" className="text-sm font-normal ml-1">Last period start</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="period-start"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 rounded-2xl bg-muted/50 border-none",
                    !localSnapshot.lastPeriodStart && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon size={18} className="mr-2 opacity-60" />
                  {localSnapshot.lastPeriodStart ? formatPeriodStartDeterministic(localSnapshot.lastPeriodStart) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parsePeriodStartDeterministic(localSnapshot.lastPeriodStart)}
                  onSelect={(day) => {
                    if (day) {
                      setLocalSnapshot(prev => ({ ...prev, lastPeriodStart: format(day, "yyyy-MM-dd") }))
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <label htmlFor="cycle-days" className="text-sm font-normal ml-1">Typical cycle length (days)</label>
            <input
              id="cycle-days"
              type="number"
              min={21}
              max={45}
              className="w-full h-12 px-4 rounded-2xl bg-muted/50 border-none outline-none focus:ring-2 ring-[var(--mf-accent)] transition-all"
              value={localSnapshot.typicalCycleDays}
              onChange={(e) =>
                setLocalSnapshot(prev => ({
                  ...prev,
                  typicalCycleDays: Math.min(
                    45,
                    Math.max(21, Number(e.target.value) || 28),
                  ),
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="variation-days" className="text-sm font-normal ml-1">Cycle variation (days)</label>
            <input
              id="variation-days"
              type="number"
              min={0}
              max={60}
              className="w-full h-12 px-4 rounded-2xl bg-muted/50 border-none outline-none focus:ring-2 ring-[var(--mf-accent)] transition-all"
              value={localSnapshot.cycleVariationDays}
              onChange={(e) =>
                setLocalSnapshot(prev => ({
                  ...prev,
                  cycleVariationDays: Math.min(
                    60,
                    Math.max(0, Number(e.target.value) || 0),
                  ),
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-[var(--mf-border)]">
            <div className="space-y-0.5 text-left">
              <label htmlFor="atypical-pattern" className="text-sm font-normal cursor-pointer">Atypical cycle pattern</label>
              <p className="text-xs text-muted-foreground">Toggle if your cycle length varies significantly</p>
            </div>
            <input
              id="atypical-pattern"
              type="checkbox"
              className="accent-[var(--mf-accent)] size-5 rounded-lg cursor-pointer"
              checked={localSnapshot.isAtypical}
              onChange={(e) =>
                setLocalSnapshot(prev => ({
                  ...prev,
                  isAtypical: e.target.checked
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="cycle-notes" className="text-sm font-normal ml-1">Private notes</label>
            <textarea
              id="cycle-notes"
              className="w-full p-4 rounded-2xl bg-muted/50 border-none outline-none focus:ring-2 ring-[var(--mf-accent)] transition-all resize-none"
              rows={3}
              placeholder="Symptoms, meds, questions…"
              value={localSnapshot.cycleNotes}
              onChange={(e) => setLocalSnapshot(prev => ({ ...prev, cycleNotes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full h-12 rounded-full bg-[var(--mf-accent)] text-white hover:brightness-110 flex items-center justify-center gap-2"
            disabled={isSaving}
            onClick={async () => {
              await update(localSnapshot)
              onOpenChange(false)
            }}
          >
            {isSaving ? (
              <>
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
