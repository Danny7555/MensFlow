import { X, LockOpen } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface Props {
  sessionId: string
  passcode: string
  onPasscodeChange: (val: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function PermanentUnlockModal({ passcode, onPasscodeChange, onConfirm, onCancel }: Props) {
  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal-card animate-in zoom-in-95 duration-200">
        <div className="chat-modal-header">
          <h3 className="chat-modal-title">Make Chat Public?</h3>
          <button type="button" className="chat-modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This will permanently remove password protection and move the conversation back into your main chat history.
        </p>
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-medium text-[var(--mf-text)]">Enter your passcode or account password</label>
          <input
            type="password"
            placeholder="Enter passcode / account password"
            className="chat-lock-input"
            value={passcode}
            onChange={(e) => onPasscodeChange(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" className="flex-1 rounded-xl h-11 text-sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl h-11 text-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            onClick={onConfirm}
            disabled={!passcode.trim()}
          >
            <LockOpen size={16} weight="bold" />
            Unlock & Make Public
          </Button>
        </div>
      </div>
    </div>
  )
}
