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

interface SnapshotData {
  lastPeriodStart: string
  typicalCycleDays: number
  cycleNotes?: string
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
  })

  // Removed useEffect sync in favor of key-based re-mounting in parent

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium">Your Snapshot</DialogTitle>
          <DialogDescription>
            Update your cycle basics to get more accurate predictions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <label htmlFor="period-start" className="text-sm font-medium ml-1">Last period start</label>
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
                  {localSnapshot.lastPeriodStart ? format(new Date(`${localSnapshot.lastPeriodStart}T12:00:00`), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localSnapshot.lastPeriodStart ? new Date(`${localSnapshot.lastPeriodStart}T12:00:00`) : undefined}
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
            <label htmlFor="cycle-days" className="text-sm font-medium ml-1">Typical cycle length (days)</label>
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
            <label htmlFor="cycle-notes" className="text-sm font-medium ml-1">Private notes</label>
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
