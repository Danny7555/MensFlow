import { useState, useEffect, useMemo } from "react"
import { CycleTrackerHero } from "@/components/tracker/CycleTrackerHero"
import { CycleStatsHero } from "@/components/tracker/CycleStatsHero"
import { CycleHistory } from "@/components/tracker/CycleHistory"
import { CycleTips } from "@/components/tracker/CycleTips"
import { HealthMetrics } from "@/components/tracker/HealthMetrics"
import { CycleLogs } from "@/components/tracker/CycleLogs"
import { useAuth } from "@/context/useAuth"
import { Copy, Users, ShareNetwork, Check } from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { TrackerSkeleton } from "@/components/skeletons/TrackerSkeleton"

export function TrackerView() {
  const { isSaving, dashboard: data } = useStore()
  const { isAuthenticated, openAuthModal } = useAuth()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Compute initial cycle day based on store last period start
  const initialDay = useMemo(() => {
    const start = new Date(`${data.lastPeriodStart}T12:00:00`)
    if (!Number.isNaN(+start)) {
      const days = Math.floor((Date.now() - +start) / 86400000)
      const m = ((days % data.typicalCycleDays) + data.typicalCycleDays) % data.typicalCycleDays
      return m + 1
    }
    return 1
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const [selectedDay, setSelectedDay] = useState<number>(initialDay)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  useEffect(() => {
    setSelectedDay(initialDay)
  }, [initialDay])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText("https://mensflow.app/join/u123abc")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return <TrackerSkeleton />
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-auto relative">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-end mb-4">
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border sync-pill">
            <div className={cn("size-2 rounded-full", isSaving ? "bg-orange-400 sync-dot-active" : "bg-green-500")} />
            <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
              {isSaving ? 'Syncing with cloud' : 'All data synced'}
            </span>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start mt-4">
          {/* Main Column */}
          <div className="space-y-12">
            <CycleTrackerHero 
              selectedDay={selectedDay}
              hoveredDay={hoveredDay}
              onSelectDay={setSelectedDay}
              onHoverDay={setHoveredDay}
            />
            <CycleLogs />
            <HealthMetrics />
            
            <div className="relative">
              <CycleHistory />
              {!isAuthenticated && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none z-20 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 150px)' }} />
                  <div className="relative z-30 pointer-events-auto bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto mt-24">
                    <h3 className="text-xl font-normal mb-2">Unlock your full history</h3>
                    <p className="text-muted-foreground text-sm mb-6">Log in to see your past cycles, personalized tips, and partner sharing features.</p>
                    <button 
                       onClick={openAuthModal}
                      className="btn btn-primary px-8 py-3 rounded-full"
                    >
                      Log in to access
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-10">
            <CycleStatsHero />
            <CycleTips activeDay={hoveredDay ?? selectedDay} />
          </aside>
        </div>

        {isAuthenticated && (
          <div className="mt-16 mb-16 w-full max-w-[1100px] mx-auto">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setIsInviteModalOpen(true)}
              onKeyDown={(e) => e.key === 'Enter' && setIsInviteModalOpen(true)}
              className="bg-gradient-to-r from-[var(--mf-accent)] to-[#be185d] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group cursor-pointer border border-white/10"
            >
              <div className="z-10 text-center md:text-left">
                <h3 className="text-2xl font-normal mb-2">Share your cycle with a partner</h3>
                <p className="text-white/80 max-w-[400px]">
                  Invite your partner to view your cycle phases and symptoms to improve communication and support.
                </p>
              </div>
              <button className="z-10 px-8 py-3 bg-white text-[var(--mf-accent)] rounded-full font-normal hover:scale-105 transition-transform">
                Invite Partner
              </button>
              <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <img src="/images/girl.png" alt="" className="size-64 object-contain rotate-[-15deg]" />
              </div>
            </div>
          </div>
        )}

        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[32px] bg-background">
            <div className="p-6 sm:p-8">
              <DialogHeader className="mb-4">
                <div className="size-12 rounded-2xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-4">
                  <ShareNetwork size={24} weight="duotone" />
                </div>
                <DialogTitle className="text-2xl font-normal tracking-tight">Invite your partner</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground pt-1">
                  Shared access allows your partner to see your cycle phases, symptoms, and daily insights.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label 
                    htmlFor="partner-email"
                    className="text-xs font-normal uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Partner's Email
                  </label>
                  <div className="relative">
                    <input 
                      id="partner-email"
                      type="email" 
                      placeholder="email@example.com"
                      className="w-full h-14 px-5 rounded-2xl bg-muted/50 border border-border focus:border-[var(--mf-accent-border)] focus:bg-background transition-all outline-none text-base"
                    />
                    <button className="absolute right-2 top-2 h-10 px-6 bg-[var(--mf-accent)] text-white rounded-xl text-sm font-normal hover:brightness-110 transition-all">
                      Invite
                    </button>
                  </div>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-background px-4 text-muted-foreground tracking-widest font-normal">Or use a link</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:border-border transition-colors">
                    <div className="flex-1 truncate text-sm text-muted-foreground font-mono">
                      mensflow.app/join/u123abc
                    </div>
                    <button 
                      onClick={copyLink}
                      className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-normal hover:bg-muted transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-green-500" weight="bold" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center px-4">
                    This link will expire in 24 hours. Your partner will need their own account to join.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/30 p-6 flex items-center gap-4 border-t border-border/50">
              <div className="size-10 rounded-full bg-background flex items-center justify-center border border-border">
                <Users size={18} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can manage or revoke access at any time from your <span className="text-foreground font-normal">Account Settings</span>.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
