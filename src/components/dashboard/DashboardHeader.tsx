import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flo-header relative z-10"
    >
      <div className="flo-header-left">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flo-avatar-wrap"
        >
          <img src="/images/girl.png" alt="Profile" className="flo-avatar" />
        </motion.div>
        <div className="flo-greeting">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <p className="flo-date">
              {mounted ? (
                <>
                  <span className="font-semibold text-[var(--mf-accent)]">{format(now, 'h:mm a')}</span>
                  <span className="mx-2 hidden sm:inline"></span>
                  <span className="hidden sm:inline">{format(now, 'EEEE, d MMMM')}</span>
                </>
              ) : ''}
            </p>
            <motion.div 
              animate={isSaving ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/30 border border-border/50 sync-pill"
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isSaving ? 'Syncing' : 'Synced'}
              </span>
            </motion.div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flo-user-name"
          >
            {mounted ? getGreeting() : 'Welcome'}, {user.name}
          </motion.h1>
        </div>
      </div>
      <div className="flo-header-right gap-2">
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: "var(--mf-hover)" }}
          whileTap={{ scale: 0.9 }}
          className={cn("flo-icon-btn transition-colors", temporaryChat && "flo-icon-btn--active")}
          onClick={toggleTempChat}
          title={temporaryChat ? "Temporary chat: On" : "Temporary chat: Off"}
        >
          <Ghost size={20} weight={temporaryChat ? "fill" : "regular"} />
        </motion.button>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/notifications" className="flo-icon-btn hidden md:flex hover:bg-muted/50 transition-colors" aria-label="Notifications">
            <Bell size={24} weight="light" />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/calendar" className="flo-icon-btn hover:bg-muted/50 transition-colors" aria-label="Calendar">
            <CalendarIcon size={24} weight="light" />
          </Link>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          className="flo-icon-btn hover:bg-muted/50 transition-colors"
          onClick={onStartTour}
          title="Start Tour"
        >
          <Question size={24} weight="light" />
        </motion.button>
        <div className="w-px h-6 bg-border mx-2 opacity-50 hidden md:block" />
        
        <Dialog>
          <DialogTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.1, color: "var(--mf-danger)" }}
              whileTap={{ scale: 0.9 }}
              className="flo-icon-btn hidden md:flex text-destructive/50 hover:bg-destructive/5 transition-colors"
              title="Log out"
            >
              <SignOut size={24} weight="light" />
            </motion.button>
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
    </motion.header>
  )
}
