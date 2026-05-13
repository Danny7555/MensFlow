import { Bell, Calendar as CalendarIcon, SignOut, Ghost } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  mounted: boolean
  user: { name: string }
  isSaving: boolean
  temporaryChat: boolean
  toggleTempChat: () => void
  handleLogout: () => void
  getGreeting: () => string
}

export function DashboardHeader({
  mounted,
  user,
  isSaving,
  temporaryChat,
  toggleTempChat,
  handleLogout,
  getGreeting,
}: DashboardHeaderProps) {
  return (
    <header className="flo-header relative z-10">
      <div className="flo-header-left">
        <div className="flo-avatar-wrap">
          <img src="/images/girl.png" alt="Profile" className="flo-avatar" />
        </div>
        <div className="flo-greeting">
          <div className="flex items-center gap-2">
            <p className="flo-date">{mounted ? format(new Date(), 'EEEE, d MMMM') : ''}</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/30 border border-border/50 sync-pill">
              <div className={cn("size-1.5 rounded-full", isSaving ? "bg-orange-400 sync-dot-active" : "bg-green-500")} />
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
      <div className="flo-header-right">
        <button 
          className={cn("flo-icon-btn", temporaryChat && "flo-icon-btn--active")}
          onClick={toggleTempChat}
          title={temporaryChat ? "Temporary chat: On" : "Temporary chat: Off"}
        >
          <Ghost size={20} weight={temporaryChat ? "fill" : "regular"} />
        </button>
        <Link to="/notifications" className="flo-icon-btn" aria-label="Notifications">
          <Bell size={24} weight="light" />
        </Link>
        <Link to="/calendar" className="flo-icon-btn" aria-label="Calendar">
          <CalendarIcon size={24} weight="light" />
        </Link>
        <button 
          className="flo-icon-btn text-destructive/70 hover:text-destructive"
          onClick={handleLogout}
          title="Log out"
        >
          <SignOut size={24} weight="light" />
        </button>
      </div>
    </header>
  )
}
