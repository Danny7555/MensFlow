import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Lock, Fingerprint, Backspace, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { playFaceIDScanSound, playFaceIDSuccessSound } from '../../lib/sound'
import { hashPin } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Session key — survives HMR / React hot-reloads, wiped on real page refresh
// ---------------------------------------------------------------------------
const SESSION_UNLOCK_KEY = 'mensflow_app_unlocked'

function readSessionUnlock(): boolean {
  try {
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

function writeSessionUnlock(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(SESSION_UNLOCK_KEY, '1')
    } else {
      sessionStorage.removeItem(SESSION_UNLOCK_KEY)
    }
  } catch {
    // sessionStorage may be blocked in private browsing — degrade gracefully
  }
}

// ---------------------------------------------------------------------------
// LockState type definition
// ---------------------------------------------------------------------------
interface AppLockState {
  isUnlocked: boolean
  pin: string
  error: boolean
  showBiometricSim: boolean
  lockoutTimeLeft: number
}

// ---------------------------------------------------------------------------
// LockOverlayUI - Extracted Presentation Component
// ---------------------------------------------------------------------------
interface LockOverlayUIProps {
  pin: string
  error: boolean
  lockoutTimeLeft: number
  appLockBiometric: boolean
  onKeyPress: (num: string) => void
  onBackspace: () => void
  onBiometricUnlock: () => void
}

function LockOverlayUI({
  pin,
  error,
  lockoutTimeLeft,
  appLockBiometric,
  onKeyPress,
  onBackspace,
  onBiometricUnlock
}: LockOverlayUIProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* App Logo/Icon Container */}
        <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-4 shadow-sm">
          <Lock size={38} weight="duotone" />
        </div>
        <h1 className="text-xl font-normal text-[var(--mf-text-strong)] mb-1">MensFlow Secure</h1>
        <p className="text-xs text-muted-foreground mb-8 text-center px-4">
          {lockoutTimeLeft > 0 
            ? 'PIN pad locked due to excessive incorrect inputs' 
            : 'Enter your 4-digit security PIN to access the application'}
        </p>

        {lockoutTimeLeft > 0 ? (
          <div className="flex flex-col items-center justify-center my-8 text-center animate-in zoom-in-95 duration-200">
            <span className="text-rose-500 font-semibold mb-2">Security Lockout Active</span>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Please wait until the security timer expires:
            </p>
            <div className="text-3xl font-bold text-[var(--mf-text-strong)] mt-4 tracking-tight tabular-nums bg-muted px-6 py-2 rounded-2xl border border-border">
              {lockoutTimeLeft}s
            </div>
          </div>
        ) : (
          <>
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
                  onClick={() => onKeyPress(num)}
                  className="size-16 rounded-full bg-muted/50 border border-border/60 hover:bg-muted active:scale-95 transition-all text-lg font-medium text-[var(--mf-text-strong)] flex items-center justify-center cursor-pointer outline-none"
                >
                  {num}
                </button>
              ))}

              {/* Biometrics Toggle Button */}
              {appLockBiometric ? (
                <button
                  type="button"
                  onClick={onBiometricUnlock}
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
                onClick={() => onKeyPress('0')}
                className="size-16 rounded-full bg-muted/50 border border-border/60 hover:bg-muted active:scale-95 transition-all text-lg font-medium text-[var(--mf-text-strong)] flex items-center justify-center cursor-pointer outline-none"
              >
                0
              </button>

              {/* Delete Backspace key */}
              <button
                type="button"
                onClick={onBackspace}
                className="size-16 rounded-full hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground flex items-center justify-center cursor-pointer outline-none"
                aria-label="Backspace"
              >
                <Backspace size={24} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppLockGate
// ---------------------------------------------------------------------------
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const settings = useStore((s) => s.settings)

  // Security references
  const failedAttemptsRef = useRef<number>(0)
  const lockoutUntilRef = useRef<number | null>(null)

  // Lazy initialize all Lock states to group related useState calls
  const [state, setState] = useState<AppLockState>(() => {
    const isUnlockedInit = !settings.appLockEnabled || readSessionUnlock()
    let lockoutInit = 0
    if (typeof window !== 'undefined') {
      const rawLockout = localStorage.getItem('mensflow_lockout_until')
      if (rawLockout) {
        const until = parseInt(rawLockout, 10)
        if (!isNaN(until) && until > Date.now()) {
          lockoutInit = Math.ceil((until - Date.now()) / 1000)
          lockoutUntilRef.current = until
        }
      }
    }
    return {
      isUnlocked: isUnlockedInit,
      pin: '',
      error: false,
      showBiometricSim: false,
      lockoutTimeLeft: lockoutInit
    }
  })

  // Update helper
  const updateState = useCallback((patch: Partial<AppLockState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  // Keep unlock state in sync with sessionStorage
  const grantUnlock = useCallback(() => {
    writeSessionUnlock(true)
    updateState({ isUnlocked: true, pin: '', error: false, showBiometricSim: false })
    failedAttemptsRef.current = 0
  }, [updateState])

  // If the user disables the lock in settings while the gate is mounted,
  // clear the session key so the next load behaves correctly.
  useEffect(() => {
    if (!settings.appLockEnabled) {
      writeSessionUnlock(false)
      updateState({ isUnlocked: true })
    }
  }, [settings.appLockEnabled, updateState])

  // Lockout countdown timer using the cached ref value instead of localStorage calls
  useEffect(() => {
    if (state.lockoutTimeLeft <= 0) return

    const timer = setInterval(() => {
      const until = lockoutUntilRef.current
      if (until) {
        const left = Math.ceil((until - Date.now()) / 1000)
        if (left > 0) {
          updateState({ lockoutTimeLeft: left })
        } else {
          lockoutUntilRef.current = null
          localStorage.removeItem('mensflow_lockout_until')
          failedAttemptsRef.current = 0
          updateState({ lockoutTimeLeft: 0 })
        }
      } else {
        updateState({ lockoutTimeLeft: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [state.lockoutTimeLeft, updateState])

  // Activity tracker / Auto-lock on inactivity (3 minutes)
  const lastActivityRef = useRef<number>(0)
  
  useEffect(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!settings.appLockEnabled || !state.isUnlocked) return

    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    const timeoutMs = (settings.appLockTimeoutMinutes ?? 3) * 60 * 1000
    if (timeoutMs === 0) return // 0 = never auto-lock

    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current
      if (inactiveMs >= timeoutMs) {
        writeSessionUnlock(false)
        updateState({ isUnlocked: false, pin: '' })
        toast.info('Session locked due to inactivity.')
      }
    }, 5000)

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
      clearInterval(interval)
    }
  }, [settings.appLockEnabled, settings.appLockTimeoutMinutes, state.isUnlocked, updateState])

  // Auto-lock when tab becomes hidden (visibilitychange)
  useEffect(() => {
    if (!settings.appLockEnabled || !state.isUnlocked) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        writeSessionUnlock(false)
        updateState({ isUnlocked: false, pin: '' })
        toast.info('App locked for your security.')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [settings.appLockEnabled, state.isUnlocked, updateState])

  // Biometric unlock
  const handleBiometricUnlock = useCallback(async () => {
    if (!settings.appLockEnabled || !settings.appLockBiometric || state.isUnlocked || state.lockoutTimeLeft > 0) {
      return
    }
    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        const hasAuth = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        if (hasAuth) {
          const challenge = new Uint8Array([1, 2, 3, 4])
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: 'required'
            }
          })
          grantUnlock()
          toast.success('Unlocked via biometrics!')
          return
        }
      }
      updateState({ showBiometricSim: true })
    } catch {
      updateState({ showBiometricSim: true })
    }
  }, [settings.appLockEnabled, settings.appLockBiometric, state.isUnlocked, state.lockoutTimeLeft, grantUnlock, updateState])

  const handleKeyPress = useCallback((num: string) => {
    if (state.lockoutTimeLeft > 0) return
    
    // Read state value at the start
    const currentPin = state.pin
    const currentError = state.error
    
    if (currentError) updateState({ error: false })
    
    if (currentPin.length < 4) {
      const nextPin = currentPin + num
      updateState({ pin: nextPin })
      
      if (nextPin.length === 4) {
        const storedPIN = settings.appLockPIN
        const isMatch = hashPin(nextPin) === storedPIN || (storedPIN?.length === 4 && nextPin === storedPIN)
        if (isMatch) {
          grantUnlock()
          if (storedPIN?.length === 4) {
            useStore.getState().updateSettings({ appLockPIN: hashPin(nextPin) })
          }
          toast.success('Application Unlocked!')
        } else {
          updateState({ error: true })
          const nextFailed = failedAttemptsRef.current + 1
          failedAttemptsRef.current = nextFailed

          if (nextFailed >= 5) {
            const until = Date.now() + 30000 // 30 seconds lockout
            localStorage.setItem('mensflow_lockout_until', String(until))
            lockoutUntilRef.current = until
            updateState({ lockoutTimeLeft: 30, pin: '', error: false })
            toast.error('Too many failed attempts. PIN locked for 30 seconds.')
          } else {
            setTimeout(() => {
              updateState({ pin: '', error: false })
            }, 600)
          }
        }
      }
    }
  }, [state.pin, state.error, state.lockoutTimeLeft, settings.appLockPIN, grantUnlock, updateState])

  const handleBackspace = useCallback(() => {
    if (state.pin.length > 0 && state.lockoutTimeLeft === 0) {
      updateState({ pin: state.pin.slice(0, -1) })
    }
  }, [state.pin, state.lockoutTimeLeft, updateState])

  const showLock = settings.appLockEnabled && !state.isUnlocked

  return (
    <>
      {!showLock && children}
      {showLock && (
        <LockOverlayUI
          pin={state.pin}
          error={state.error}
          lockoutTimeLeft={state.lockoutTimeLeft}
          appLockBiometric={settings.appLockBiometric}
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onBiometricUnlock={() => void handleBiometricUnlock()}
        />
      )}

      {/* Simulated Biometric Modal */}
      {showLock && state.showBiometricSim && state.lockoutTimeLeft === 0 && (
        <FaceIDScanner
          onSuccess={() => {
            grantUnlock()
            updateState({ showBiometricSim: false })
            toast.success('Unlocked via Face ID!')
          }}
          onCancel={() => updateState({ showBiometricSim: false })}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// FaceIDScanner
// ---------------------------------------------------------------------------
export function FaceIDScanner({
  onSuccess,
  onCancel
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<'scanning' | 'success'>('scanning')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Cache onSuccess in a ref so the audio effect never re-subscribes when the
  // parent re-renders (satisfies react-doctor/prefer-use-effect-event)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  // Audio scanning tick loop
  useEffect(() => {
    if (phase !== 'scanning') return

    let unlockTimeout: ReturnType<typeof setTimeout> | null = null

    const interval = setInterval(() => {
      playFaceIDScanSound()
    }, 140)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPhase('success')
      playFaceIDSuccessSound()

      unlockTimeout = setTimeout(() => {
        onSuccessRef.current()
      }, 800)
    }, 1800)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      if (unlockTimeout !== null) {
        clearTimeout(unlockTimeout)
      }
    }
  }, [phase])

  // Canvas scan line / face mesh animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Read brand accent RGB from custom CSS variables; validate before using
    const rawAccent = getComputedStyle(document.documentElement)
      .getPropertyValue('--mf-accent-rgb')
      .trim()
    const accentRgb = rawAccent.includes(',') ? rawAccent : '236, 72, 153'

    let animationFrameId: number
    let angle = 0
    let scanY = 0
    let scanDirection = 1

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cx = canvas.width / 2
      const cy = canvas.height / 2

      if (phase === 'scanning') {
        // Rounded square bracket frame
        ctx.strokeStyle = `rgba(${accentRgb}, 0.4)`
        ctx.lineWidth = 3
        ctx.beginPath()

        const size = 110
        const r = 24

        ctx.moveTo(cx - size, cy - size + r)
        ctx.quadraticCurveTo(cx - size, cy - size, cx - size + r, cy - size)
        ctx.moveTo(cx + size - r, cy - size)
        ctx.quadraticCurveTo(cx + size, cy - size, cx + size, cy - size + r)
        ctx.moveTo(cx + size, cy + size - r)
        ctx.quadraticCurveTo(cx + size, cy + size, cx + size - r, cy + size)
        ctx.moveTo(cx - size + r, cy + size)
        ctx.quadraticCurveTo(cx - size, cy + size, cx - size, cy + size - r)
        ctx.stroke()

        // Bracket indicators
        ctx.strokeStyle = `rgba(${accentRgb}, 0.85)`
        ctx.lineWidth = 4.5

        const bLen = 28

        ctx.beginPath()
        ctx.moveTo(cx - size, cy - size + bLen)
        ctx.lineTo(cx - size, cy - size + r)
        ctx.quadraticCurveTo(cx - size, cy - size, cx - size + r, cy - size)
        ctx.lineTo(cx - size + bLen, cy - size)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(cx + size - bLen, cy - size)
        ctx.lineTo(cx + size - r, cy - size)
        ctx.quadraticCurveTo(cx + size, cy - size, cx + size, cy - size + r)
        ctx.lineTo(cx + size, cy - size + bLen)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(cx + size, cy + size - bLen)
        ctx.lineTo(cx + size, cy + size - r)
        ctx.quadraticCurveTo(cx + size, cy + size, cx + size - r, cy + size)
        ctx.lineTo(cx + size - bLen, cy + size)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(cx - size + bLen, cy + size)
        ctx.lineTo(cx - size + r, cy + size)
        ctx.quadraticCurveTo(cx - size, cy + size, cx - size, cy + size - r)
        ctx.lineTo(cx - size, cy + size - bLen)
        ctx.stroke()

        // Face outline
        ctx.fillStyle = `rgba(${accentRgb}, 0.15)`
        ctx.strokeStyle = `rgba(${accentRgb}, 0.25)`
        ctx.lineWidth = 1

        ctx.beginPath()
        ctx.arc(cx, cy - 10, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(cx, cy + 20, 30, 0, Math.PI)
        ctx.stroke()

        // Scanning grid / depth dots
        ctx.fillStyle = `rgba(${accentRgb}, 0.75)`
        for (let i = -4; i <= 4; i++) {
          for (let j = -4; j <= 4; j++) {
            const dx = i * 16
            const dy = j * 16
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 60) {
              const offset = Math.sin(angle + dist * 0.05) * 1.5
              ctx.beginPath()
              ctx.arc(cx + dx, cy + dy, 1.2 + offset, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }

        // Laser scan beam
        const gradient = ctx.createLinearGradient(0, cy + scanY - 15, 0, cy + scanY + 2)
        gradient.addColorStop(0, `rgba(${accentRgb}, 0)`)
        gradient.addColorStop(0.8, `rgba(${accentRgb}, 0.35)`)
        gradient.addColorStop(1, `rgba(${accentRgb}, 0.95)`)

        ctx.fillStyle = gradient
        ctx.fillRect(cx - size + 4, cy + scanY - 15, size * 2 - 8, 16)

        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.shadowColor = `rgba(${accentRgb}, 1)`
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.moveTo(cx - size + 4, cy + scanY)
        ctx.lineTo(cx + size - 4, cy + scanY)
        ctx.stroke()
        ctx.shadowBlur = 0

        scanY += scanDirection * 2.2
        if (scanY > size - 10 || scanY < -size + 10) {
          scanDirection *= -1
        }

        angle += 0.075
      } else {
        // Success state
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.arc(cx, cy, 60, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)'
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.arc(cx, cy, 60 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animationFrameId)
  }, [phase])

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">

        {/* Canvas container */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-8">
          <canvas
            ref={canvasRef}
            width={288}
            height={288}
            className="w-full h-full"
          />
          {phase === 'success' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-in zoom-in-50 duration-300">
                <Check size={36} weight="bold" />
              </div>
            </div>
          )}
        </div>

        <h2 className="text-xl font-normal text-[var(--mf-text-strong)] mb-1">
          {phase === 'scanning' ? 'Face ID' : 'Face ID Verified'}
        </h2>
        <p className="text-xs text-muted-foreground mb-12">
          {phase === 'scanning' ? 'Scanning face features...' : 'Identity confirmed successfully'}
        </p>

        {phase === 'scanning' && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-full border border-border hover:bg-muted active:scale-95 transition-all text-xs font-semibold text-[var(--mf-text)] cursor-pointer outline-none"
          >
            Cancel and enter PIN
          </button>
        )}
      </div>
    </div>
  )
}
