import type { ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { Button } from './ui/button'

export function AccessGate({ children }: { children: ReactNode }) {
  const { user, updateUser } = useStore()
  const isEducational = user.accessLevel === 'educational'

  if (!isEducational) {
    return <>{children}</>
  }

  return (
    <div className="relative flex flex-col flex-1 w-full h-full min-h-full overflow-hidden">
      <div 
        className="flex flex-col flex-1 w-full h-full pointer-events-none select-none opacity-60"
        style={{ filter: 'blur(8px)', WebkitFilter: 'blur(8px)' }}
      >
        {children}
      </div>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-3xl shadow-2xl border border-border/50 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <h2 className="text-2xl font-bold mb-3 text-foreground relative z-10">Unlock Full Access</h2>
          <p className="text-muted-foreground mb-8 relative z-10 text-sm leading-relaxed">
            You are currently on Educational Access. Opt in for full access to track your cycle, log symptoms, view personalized insights, and get daily health recommendations.
          </p>
          <Button 
            className="w-full relative z-10 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
            size="lg"
            onClick={() => updateUser({ accessLevel: 'full' })}
          >
            Opt in for Full Access
          </Button>
        </div>
      </div>
    </div>
  )
}
