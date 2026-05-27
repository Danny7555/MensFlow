import { Bell, CaretLeft, CheckCircle, Info, WarningCircle } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  time: Date
  type: 'info' | 'success' | 'warning'
  read: boolean
}

const mockNotifications: Notification[] = []

export function NotificationsView() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--mf-main-bg)] pb-20">
      <header className="sticky top-0 z-10 bg-[var(--mf-main-bg)]/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="size-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
        >
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
      </header>

      <main className="max-w-2xl mx-auto mt-8 px-6">
        <div className="flex flex-col gap-4">
          {mockNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-5 rounded-2xl border transition-all ${
                notification.read 
                  ? 'bg-card/30 border-border/40 opacity-70' 
                  : 'bg-card border-[var(--mf-accent-border)]'
              }`}
            >
              <div className="flex gap-4">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                  notification.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                  notification.type === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {notification.type === 'success' && <CheckCircle size={22} weight="fill" />}
                  {notification.type === 'warning' && <WarningCircle size={22} weight="fill" />}
                  {notification.type === 'info' && <Info size={22} weight="fill" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[var(--mf-text-strong)]">{notification.title}</h3>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                      {format(notification.time, 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {!notification.read && (
                  <div className="size-2 rounded-full bg-[var(--mf-accent)] mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>

        {mockNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Bell size={48} weight="light" className="mb-4" />
            <p>No notifications yet</p>
          </div>
        )}
      </main>
    </div>
  )
}
