import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useStore } from "@/store/useStore"
import { Warning, Info, Trash, ArrowCounterClockwise } from "@phosphor-icons/react"

export function GlobalModalContainer() {
  const { 
    confirmDialog, 
    closeConfirm, 
    alertDialog, 
    closeAlert 
  } = useStore()

  // Dynamic icon selector based on keywords in dialog title
  const getConfirmIcon = (title: string) => {
    const t = title.toLowerCase()
    if (t.includes('delete') || t.includes('wipe') || t.includes('remove') || t.includes('clear')) {
      return <Trash className="size-6 text-red-500" weight="duotone" />
    }
    if (t.includes('reset') || t.includes('restore') || t.includes('undo')) {
      return <ArrowCounterClockwise className="size-6 text-orange-500" weight="duotone" />
    }
    return <Info className="size-6 text-[var(--mf-accent)]" weight="duotone" />
  }

  return (
    <>
      {/* Premium Confirm Dialog */}
      <Dialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            if (confirmDialog.onCancel) confirmDialog.onCancel()
            closeConfirm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] bg-card border border-border p-6 rounded-[28px] overflow-hidden shadow-2xl backdrop-blur-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-medium tracking-tight flex items-center gap-3 text-foreground">
              {getConfirmIcon(confirmDialog.title)}
              <span>{confirmDialog.title}</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 justify-end w-full">
            <button
              type="button"
              onClick={() => {
                if (confirmDialog.onCancel) confirmDialog.onCancel()
                closeConfirm()
              }}
              className="btn bg-secondary hover:bg-secondary/80 text-foreground px-5 py-2.5 rounded-full font-medium transition-all text-sm border border-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmDialog.onConfirm) confirmDialog.onConfirm()
                closeConfirm()
              }}
              className="btn bg-gradient-to-r from-[var(--mf-accent)] to-[#be185d] text-white hover:opacity-90 px-6 py-2.5 rounded-full font-medium transition-all text-sm shadow-md"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Alert Dialog */}
      <Dialog 
        open={alertDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) closeAlert()
        }}
      >
        <DialogContent className="sm:max-w-[420px] bg-card border border-border p-6 rounded-[28px] overflow-hidden shadow-2xl backdrop-blur-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-medium tracking-tight flex items-center gap-3 text-foreground">
              <Warning className="size-6 text-amber-500" weight="duotone" />
              <span>{alertDialog.title}</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
              {alertDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end w-full">
            <button
              type="button"
              onClick={closeAlert}
              className="btn bg-gradient-to-r from-[var(--mf-accent)] to-[#be185d] text-white hover:opacity-90 px-6 py-2.5 rounded-full font-medium transition-all text-sm shadow-md"
            >
              Dismiss
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
