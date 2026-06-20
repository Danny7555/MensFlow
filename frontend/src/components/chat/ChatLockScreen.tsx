import { useState } from 'react'
import { Lock } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface UnlockInfo {
  sessionId: string
  securityQuestion: string | null
  error?: string
}

interface Props {
  unlockInfo: UnlockInfo
  onSubmit: (passcode: string, useSecurityAnswer: boolean, securityAnswer: string) => void
}

export function ChatLockScreen({ unlockInfo, onSubmit }: Props) {
  const [showSecurityQuestionReset, setShowSecurityQuestionReset] = useState(false)
  const [passcodeVal, setPasscodeVal] = useState('')
  const [securityAnsVal, setSecurityAnsVal] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = showSecurityQuestionReset ? securityAnsVal : passcodeVal
    if (!text.trim()) return
    onSubmit(text, showSecurityQuestionReset, securityAnsVal)
  }

  return (
    <div className="chat-lock-screen">
      <form className="chat-lock-card animate-in fade-in zoom-in-95 duration-300" onSubmit={handleSubmit}>
        <div className="chat-lock-icon-wrap">
          <Lock size={28} weight="fill" />
        </div>
        <h2 className="font-semibold text-lg text-[var(--mf-text-strong)]">
          {showSecurityQuestionReset ? "Unlock via Question" : "This chat is locked"}
        </h2>
        <p className="text-xs text-muted-foreground -mt-1 max-w-[280px]">
          {showSecurityQuestionReset
            ? "Answer the security question to retrieve your passcode."
            : "Enter the passcode to view and continue this conversation."}
        </p>

        <div className="chat-lock-inputs">
          {showSecurityQuestionReset ? (
            <>
              <div className="text-xs font-medium text-[var(--mf-text)] mb-0.5">
                Question: <span className="text-muted-foreground font-normal italic">{unlockInfo.securityQuestion}</span>
              </div>
              <input
                type="text"
                placeholder="Enter security answer"
                className="chat-lock-input"
                value={securityAnsVal}
                onChange={(e) => setSecurityAnsVal(e.target.value)}
                required
                autoFocus
              />
            </>
          ) : (
            <input
              type="password"
              placeholder="Enter passcode"
              className="chat-lock-input"
              value={passcodeVal}
              onChange={(e) => setPasscodeVal(e.target.value)}
              required
              autoFocus
            />
          )}
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl h-11 text-sm font-medium"
          disabled={showSecurityQuestionReset ? !securityAnsVal.trim() : !passcodeVal.trim()}
        >
          {showSecurityQuestionReset ? "Retrieve Passcode" : "Unlock Chat"}
        </Button>

        {unlockInfo?.securityQuestion && (
          <button
            type="button"
            className="chat-lock-forgot"
            onClick={() => setShowSecurityQuestionReset(!showSecurityQuestionReset)}
          >
            {showSecurityQuestionReset ? "Back to passcode" : "Forgot passcode?"}
          </button>
        )}
      </form>
    </div>
  )
}
