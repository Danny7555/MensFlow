import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface PlanSetting {
  label: string
  active: boolean
}

interface CustomizePlanModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  planSettings: PlanSetting[]
  setPlanSettings: React.Dispatch<React.SetStateAction<PlanSetting[]>>
  onUpdate: () => Promise<void>
  isSaving: boolean
}

export function CustomizePlanModal({ 
  isOpen, 
  onOpenChange, 
  planSettings, 
  setPlanSettings, 
  onUpdate,
  isSaving 
}: CustomizePlanModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] p-6 border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium">Customize Plan</DialogTitle>
          <DialogDescription>
            Choose which insights you want to see in your daily feed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {planSettings.map(item => (
            <div 
              key={item.label} 
              role="button"
              tabIndex={0}
              className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-all"
              onClick={() => {
                setPlanSettings(prev => prev.map(p => 
                  p.label === item.label ? { ...p, active: !p.active } : p
                ))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setPlanSettings(prev => prev.map(p => 
                    p.label === item.label ? { ...p, active: !p.active } : p
                  ))
                }
              }}
            >
              <span className="font-medium">{item.label}</span>
              <div className={cn(
                "w-10 h-6 rounded-full transition-all flex items-center px-1",
                item.active ? "bg-[var(--mf-accent)]" : "bg-muted"
              )}>
                <div className={cn(
                  "size-4 bg-white rounded-full shadow-sm transition-transform",
                  item.active && "translate-x-4"
                )} />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button 
            className="w-full h-12 rounded-full bg-[var(--mf-accent)] text-white flex items-center justify-center gap-2"
            disabled={isSaving}
            onClick={onUpdate}
          >
            {isSaving ? (
              <>
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              "Update Feed"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
