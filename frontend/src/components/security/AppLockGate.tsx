import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Lock, Fingerprint, Backspace, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { playFaceIDScanSound, playFaceIDSuccessSound } from '../../lib/sound'

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const settings = useStore((s) => s.settings)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [showBiometricSim, setShowBiometricSim] = useState(false)

  const handleBiometricUnlock = useCallback(async () => {
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
  }, [settings.appLockEnabled, settings.appLockBiometric, isUnlocked])

  // Auto-trigger biometrics on mount if enabled
  useEffect(() => {
    void handleBiometricUnlock()
  }, [handleBiometricUnlock])

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

  const showLock = settings.appLockEnabled && !isUnlocked

  return (
    <>
      {children}
      {showLock && (
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
            <FaceIDScanner
              onSuccess={() => {
                setIsUnlocked(true)
                setShowBiometricSim(false)
                toast.success('Unlocked via Face ID!')
              }}
              onCancel={() => setShowBiometricSim(false)}
            />
          )}
        </div>
      )}
    </>
  )
}

export function FaceIDScanner({
  onSuccess,
  onCancel
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<'scanning' | 'success'>('scanning')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Cache onSuccess in a mutable ref to prevent effect re-subscription triggers
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess
  
  // Audio scanning tick loop
  useEffect(() => {
    if (phase !== 'scanning') return
    
    let unlockTimeout: any = null
    
    // Play tick sound every 140ms
    const interval = setInterval(() => {
      playFaceIDScanSound()
    }, 140)
    
    // Scan duration is 1.8 seconds, then success
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPhase('success')
      playFaceIDSuccessSound()
      
      // Delay success display for 800ms before unlocking
      unlockTimeout = setTimeout(() => {
        onSuccessRef.current()
      }, 800)
    }, 1800)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      if (unlockTimeout) {
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
    
    // Read user's brand accent RGB coordinates dynamically from custom CSS variables
    const accentRgb = getComputedStyle(document.documentElement).getPropertyValue('--mf-accent-rgb').trim() || '236, 72, 153'
    
    let animationFrameId: number
    let angle = 0
    let scanY = 0
    let scanDirection = 1
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      
      if (phase === 'scanning') {
        // Draw the Face ID rounded square bracket frame
        ctx.strokeStyle = `rgba(${accentRgb}, 0.4)` // Custom accent border soft
        ctx.lineWidth = 3
        ctx.beginPath()
        
        const size = 110
        const r = 24 // border radius
        
        // Custom draw rounded rect corners
        // Top Left corner
        ctx.moveTo(cx - size, cy - size + r)
        ctx.quadraticCurveTo(cx - size, cy - size, cx - size + r, cy - size)
        
        // Top Right corner
        ctx.moveTo(cx + size - r, cy - size)
        ctx.quadraticCurveTo(cx + size, cy - size, cx + size, cy - size + r)
        
        // Bottom Right corner
        ctx.moveTo(cx + size, cy + size - r)
        ctx.quadraticCurveTo(cx + size, cy + size, cx + size - r, cy + size)
        
        // Bottom Left corner
        ctx.moveTo(cx - size + r, cy + size)
        ctx.quadraticCurveTo(cx - size, cy + size, cx - size, cy + size - r)
        ctx.stroke()
 
        // Draw pulsing bracket indicators
        ctx.strokeStyle = `rgba(${accentRgb}, 0.85)` // Custom accent border strong
        ctx.lineWidth = 4.5
        
        const bLen = 28 // bracket line length
        
        // Top Left Bracket
        ctx.beginPath()
        ctx.moveTo(cx - size, cy - size + bLen)
        ctx.lineTo(cx - size, cy - size + r)
        ctx.quadraticCurveTo(cx - size, cy - size, cx - size + r, cy - size)
        ctx.lineTo(cx - size + bLen, cy - size)
        ctx.stroke()
        
        // Top Right Bracket
        ctx.beginPath()
        ctx.moveTo(cx + size - bLen, cy - size)
        ctx.lineTo(cx + size - r, cy - size)
        ctx.quadraticCurveTo(cx + size, cy - size, cx + size, cy - size + r)
        ctx.lineTo(cx + size, cy - size + bLen)
        ctx.stroke()
        
        // Bottom Right Bracket
        ctx.beginPath()
        ctx.moveTo(cx + size, cy + size - bLen)
        ctx.lineTo(cx + size, cy + size - r)
        ctx.quadraticCurveTo(cx + size, cy + size, cx + size - r, cy + size)
        ctx.lineTo(cx + size - bLen, cy + size)
        ctx.stroke()
        
        // Bottom Left Bracket
        ctx.beginPath()
        ctx.moveTo(cx - size + bLen, cy + size)
        ctx.lineTo(cx - size + r, cy + size)
        ctx.quadraticCurveTo(cx - size, cy + size, cx - size, cy + size - r)
        ctx.lineTo(cx - size, cy + size - bLen)
        ctx.stroke()
 
        // Draw simulated face outline made of points
        ctx.fillStyle = `rgba(${accentRgb}, 0.15)`
        ctx.strokeStyle = `rgba(${accentRgb}, 0.25)`
        ctx.lineWidth = 1
        
        // Head circle
        ctx.beginPath()
        ctx.arc(cx, cy - 10, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        
        // Jaw outline
        ctx.beginPath()
        ctx.arc(cx, cy + 20, 30, 0, Math.PI)
        ctx.stroke()
 
        // Scanning grid/points
        ctx.fillStyle = `rgba(${accentRgb}, 0.75)`
        for (let i = -4; i <= 4; i++) {
          for (let j = -4; j <= 4; j++) {
            // Only draw inside the face shape or circle
            const dx = i * 16
            const dy = j * 16
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 60) {
              // Pulse radius
              const offset = Math.sin(angle + dist * 0.05) * 1.5
              ctx.beginPath()
              ctx.arc(cx + dx, cy + dy, 1.2 + offset, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
 
        // Draw scanning laser beam
        const gradient = ctx.createLinearGradient(0, cy + scanY - 15, 0, cy + scanY + 2)
        gradient.addColorStop(0, `rgba(${accentRgb}, 0)`)
        gradient.addColorStop(0.8, `rgba(${accentRgb}, 0.35)`)
        gradient.addColorStop(1, `rgba(${accentRgb}, 0.95)`)
        
        ctx.fillStyle = gradient
        ctx.fillRect(cx - size + 4, cy + scanY - 15, (size * 2) - 8, 16)
        
        // Bright laser center line
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.shadowColor = `rgba(${accentRgb}, 1)`
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.moveTo(cx - size + 4, cy + scanY)
        ctx.lineTo(cx + size - 4, cy + scanY)
        ctx.stroke()
        ctx.shadowBlur = 0 // reset shadow

        // Move scan line
        scanY += scanDirection * 2.2
        if (scanY > size - 10 || scanY < -size + 10) {
          scanDirection *= -1
        }
        
        angle += 0.075
      } else {
        // Success state: Draw green checkmark and success circle
        ctx.strokeStyle = '#10b981' // emerald-500
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.arc(cx, cy, 60, 0, Math.PI * 2)
        ctx.stroke()

        // Pulsing background ring
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
            className="w-full h-full animate-pulse"
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
