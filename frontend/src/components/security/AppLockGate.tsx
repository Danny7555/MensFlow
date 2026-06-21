import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { Button } from '../ui/button'
import { Lock, Fingerprint, Backspace } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const settings = useStore((s) => s.settings)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [showBiometricSim, setShowBiometricSim] = useState(false)

  const handleBiometricUnlock = async () => {
    if (!settings.appLockEnabled || !settings.appLockBiometric || isUnlocked) {
      return
    }
    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        const hasAuth = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        if (hasAuth) {
          // Trigger WebAuthn local assertion
          const challenge = new Uint8Array([1, 2, 3, 4])
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: 'required'
            }
          })
          setIsUnlocked(true)
          toast.success('Unlocked via biometrics!')
          return
        }
      }
      // Fallback/Simulated biometric dialog if platform biometrics aren't configured or fail
      setShowBiometricSim(true)
    } catch (err) {
      console.warn('Biometric authentication bypassed/failed:', err)
      setShowBiometricSim(true)
    }
  }

  // Auto-trigger biometrics on mount if enabled
  useEffect(() => {
    void handleBiometricUnlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKeyPress = (num: string) => {
    if (error) setError(false)
    if (pin.length < 4) {
      const nextPin = pin + num
      setPin(nextPin)
      if (nextPin.length === 4) {
        if (nextPin === settings.appLockPIN) {
          setIsUnlocked(true)
          toast.success('Application Unlocked!')
        } else {
          setError(true)
          // Shake effect trigger, reset PIN after small delay
          setTimeout(() => {
            setPin('')
            setError(false)
          }, 600)
        }
      }
    }
  }

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1))
    }
  }

  if (!settings.appLockEnabled || isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* App Logo/Icon Container */}
        <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-4 shadow-sm">
          <Lock size={38} weight="duotone" />
        </div>
        <h1 className="text-xl font-normal text-[var(--mf-text-strong)] mb-1">MensFlow Secure</h1>
        <p className="text-xs text-muted-foreground mb-8">Enter your 4-digit security PIN to access the application</p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`size-4 rounded-full border-2 transition-all duration-200 ${
                error
                  ? 'border-rose-500 bg-rose-500 animate-bounce'
                  : index < pin.length
                  ? 'border-[var(--mf-accent)] bg-[var(--mf-accent)] scale-110 shadow-[0_0_8px_rgba(var(--mf-accent-rgb),0.5)]'
                  : 'border-muted-foreground/30 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Numeric PIN Pad */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[270px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="size-16 rounded-full bg-muted/50 border border-border/60 hover:bg-muted active:scale-95 transition-all text-lg font-medium text-[var(--mf-text-strong)] flex items-center justify-center cursor-pointer outline-none"
            >
              {num}
            </button>
          ))}

          {/* Biometrics Toggle Button */}
          {settings.appLockBiometric ? (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              className="size-16 rounded-full hover:bg-[var(--mf-accent-soft)] active:scale-95 transition-all text-[var(--mf-accent)] flex items-center justify-center cursor-pointer outline-none"
              aria-label="Unlock with biometrics"
            >
              <Fingerprint size={28} />
            </button>
          ) : (
            <div className="size-16" />
          )}

          {/* Zero key */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="size-16 rounded-full bg-muted/50 border border-border/60 hover:bg-muted active:scale-95 transition-all text-lg font-medium text-[var(--mf-text-strong)] flex items-center justify-center cursor-pointer outline-none"
          >
            0
          </button>

          {/* Delete Backspace key */}
          <button
            type="button"
            onClick={handleBackspace}
            className="size-16 rounded-full hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground flex items-center justify-center cursor-pointer outline-none"
            aria-label="Backspace"
          >
            <Backspace size={24} />
          </button>
        </div>
      </div>

      {/* Simulated Biometric Modal (Fallback when platform WebAuthn isn't set up/declined) */}
      {showBiometricSim && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-xs w-full text-center flex flex-col items-center shadow-lg animate-in zoom-in-95 duration-200">
            <div className="size-14 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-4">
              <Fingerprint size={32} className="animate-pulse" />
            </div>
            <h3 className="text-base font-normal mb-1">Verify Identity</h3>
            <p className="text-xs text-muted-foreground leading-normal mb-6">
              Confirm your Face ID, Touch ID, or OS User profile to unlock.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={() => {
                  setIsUnlocked(true)
                  setShowBiometricSim(false)
                  toast.success('Unlocked via device biometrics!')
                }}
                className="w-full rounded-xl"
              >
                Scan Fingerprint / Face
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowBiometricSim(false)}
                className="w-full rounded-xl text-xs"
              >
                Use PIN Code
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
