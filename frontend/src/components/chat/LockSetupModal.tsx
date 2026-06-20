import { X, Lock, LockKey, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { SECURITY_QUESTIONS } from '../../lib/constants'
import { getPasswordStrength } from '../../lib/passwordStrength'

interface Props {
  passcode: string
  isLocking: boolean
  questionId: string
  answer: string
  onPasscodeChange: (val: string) => void
  onQuestionChange: (id: string) => void
  onAnswerChange: (val: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function LockSetupModal({
  passcode,
  isLocking,
  questionId,
  answer,
  onPasscodeChange,
  onQuestionChange,
  onAnswerChange,
  onSubmit,
  onCancel,
}: Props) {
  const strength = passcode ? getPasswordStrength(passcode) : null

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal-card animate-in zoom-in-95 duration-200">
        <div className="chat-modal-header">
          <h3 className="chat-modal-title flex items-center gap-2">
            <Lock size={18} /> Lock Chat
          </h3>
          <button type="button" className="chat-modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Set a passcode to protect this conversation. You'll need it to view or continue the chat.
        </p>
        <div className="flex flex-col gap-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--mf-text)]">Passcode</label>
            <div className="relative">
              <LockKey size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Enter a passcode"
                className="chat-lock-input pl-9"
                value={passcode}
                onChange={(e) => onPasscodeChange(e.target.value)}
                autoFocus
              />
            </div>
            {strength && (
              <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Strength</span>
                  <span className={`text-[10px] font-medium ${strength.textClass}`}>{strength.label}</span>
                </div>
                <div className="h-1 bg-muted/50 rounded-full overflow-hidden flex gap-0.5">
                  <div className={`h-full transition-all duration-500 flex-1 rounded-full ${strength.percent >= 33 ? strength.label === 'Bad' ? 'bg-rose-500' : strength.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-muted/10'}`} />
                  <div className={`h-full transition-all duration-500 flex-1 rounded-full ${strength.percent >= 66 ? strength.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-muted/10'}`} />
                  <div className={`h-full transition-all duration-500 flex-1 rounded-full ${strength.percent >= 100 ? 'bg-emerald-500' : 'bg-muted/10'}`} />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--mf-text)]">Security Question <span className="text-muted-foreground font-normal">(optional)</span></label>
            <select
              className="w-full h-11 px-3 rounded-xl bg-muted border border-border text-sm text-[var(--mf-text-strong)] focus:border-[var(--mf-accent-border)] focus:ring-1 focus:ring-[var(--mf-accent)] outline-none transition-all"
              value={questionId}
              onChange={(e) => onQuestionChange(e.target.value)}
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q.id} value={q.id}>{q.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--mf-text)]">Answer <span className="text-muted-foreground font-normal">(optional — for recovery)</span></label>
            <input
              type="text"
              placeholder="Your answer"
              className="chat-lock-input"
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" className="flex-1 rounded-xl h-11 text-sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl h-11 text-sm"
            onClick={onSubmit}
            disabled={!passcode.trim() || isLocking}
          >
            <ShieldCheck size={16} weight="bold" />
            {isLocking ? 'Locking…' : 'Lock Chat'}
          </Button>
        </div>
      </div>
    </div>
  )
}
