import { useState, useEffect } from "react"
import { Bell, Calendar as CalendarIcon, SignOut, Ghost, Question } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  mounted: boolean
  user: { name: string }
  isSaving: boolean
  temporaryChat: boolean
  toggleTempChat: () => void
  handleLogout: () => void
  getGreeting: () => string
  onStartTour?: () => void
}

export function DashboardHeader({
  mounted,
  user,
  isSaving,
  temporaryChat,
  toggleTempChat,
  handleLogout,
  getGreeting,
  onStartTour,
}: DashboardHeaderProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) 
    return () => clearInterval(interval)
  }, [mounted])

  return (
    <header className="flo-header relative z-10">
      <div className="flo-header-left">
        <div className="flo-avatar-wrap">
          <img src="/images/girl.png" alt="Profile" className="flo-avatar" />
        </div>
        <div className="flo-greeting">
          <div className="flex items-center gap-2">
            <p className="flo-date">
              {mounted ? (
                <>
                  <span className="font-semibold text-[var(--mf-accent)]">{format(now, 'h:mm a')}</span>
                  <span className="mx-1.5 opacity-50 hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{format(now, 'EEEE, d MMMM')}</span>
                </>
              ) : ''}
            </p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/30 border border-border/50 sync-pill">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isSaving ? 'Syncing' : 'Synced'}
              </span>
            </div>
          </div>
          <h1 className="flo-user-name">
            {mounted ? getGreeting() : 'Welcome'}, {user.name}
          </h1>
        </div>
      </div>
      <div className="flo-header-right gap-2">
        <button 
          className={cn("flo-icon-btn hover:bg-muted/50 transition-colors", temporaryChat && "flo-icon-btn--active")}
          onClick={toggleTempChat}
          title={temporaryChat ? "Temporary chat: On" : "Temporary chat: Off"}
        >
          <Ghost size={20} weight={temporaryChat ? "fill" : "regular"} />
        </button>
        <Link to="/notifications" className="flo-icon-btn hidden md:flex hover:bg-muted/50 transition-colors" aria-label="Notifications">
          <Bell size={24} weight="light" />
        </Link>
        <Link to="/calendar" className="flo-icon-btn hover:bg-muted/50 transition-colors" aria-label="Calendar">
          <CalendarIcon size={24} weight="light" />
        </Link>
        <button 
          className="flo-icon-btn hover:bg-muted/50 transition-colors"
          onClick={onStartTour}
          title="Start Tour"
        >
          <Question size={24} weight="light" />
        </button>
        <div className="w-px h-6 bg-border mx-2 opacity-50 hidden md:block" />
        
        <Dialog>
          <DialogTrigger asChild>
            <button 
              className="flo-icon-btn hidden md:flex text-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
              title="Log out"
            >
              <SignOut size={24} weight="light" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign Out</DialogTitle>
              <DialogDescription>
                Are you sure you want to sign out of MensFlow? Your local data will be safely synced.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start gap-2 mt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </header>
  )
}
