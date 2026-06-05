import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { m } from 'framer-motion'
import type { IconProps } from '@phosphor-icons/react'
import {
  BookOpen,
  CalendarBlank,
  CalendarHeart,
  ChatCircle,
  FlowerLotus,
  GearSix,
  Heart,
  House,
  Pulse,
  Target,
  X,
  SidebarIcon,
  SignOut,
  Users,
  Lock,
} from '@phosphor-icons/react'
import type { SectionId } from '../types/nav'
import { cn } from '../lib/utils'
import { useAuth } from '../context/useAuth'
import { useStore } from '../store/useStore'
import { computeCycleDay, getPhaseFromDay, getPhaseInfo, type CyclePhase } from '../lib/cycleUtils'
import { resolveAssetUrl } from '../lib/apiClient'

type NavIcon = ComponentType<IconProps>

const guestItems: { id: SectionId; label: string; Icon: NavIcon }[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'settings', label: 'Settings', Icon: GearSix },
]

const authItems: { id: SectionId; label: string; Icon: NavIcon }[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'ask', label: 'Ask MensFlow', Icon: ChatCircle },
  { id: 'symptoms', label: 'Symptoms', Icon: Pulse },
  { id: 'insights', label: 'Health insights', Icon: Target },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'calendar', label: 'Calendar', Icon: CalendarBlank },
  { id: 'tracker', label: 'Tracker', Icon: CalendarHeart },
  { id: 'tips', label: 'Wellness Tips', Icon: Heart },
  { id: 'sync', label: 'Partner Sync', Icon: Users },
  { id: 'settings', label: 'Settings', Icon: GearSix },
]

type SidebarProps = {
  isAuthenticated: boolean
  /** Mobile drawer open */
  mobileOpen: boolean
  onCloseMobile: () => void
  onLogin: () => void
  isMobile: boolean
  desktopCollapsed: boolean
  onToggleDesktopCollapse: () => void
  onToggleSidebar?: () => void
}

export function Sidebar({
  isAuthenticated,
  mobileOpen,
  onCloseMobile,
  onLogin,
  isMobile,
  desktopCollapsed,
  onToggleDesktopCollapse,
  onToggleSidebar,
}: SidebarProps) {
  const { logout, onboardingCompleted } = useAuth()

  const { dashboard: data, settings, user, partnerStatus } = useStore()

  const rawItems = isAuthenticated ? [...authItems] : [...guestItems]
  if (isAuthenticated && settings.privacyLockChats) {
    rawItems.splice(rawItems.length - 1, 0, { id: 'locked-chats', label: 'Locked Chats', Icon: Lock })
  }


  const items = rawItems.filter(item => {
    // If onboarding is not completed, only show the chat assistant
    if (!onboardingCompleted && item.id !== 'ask') return false
    // If user has educational access, restrict dashboard, symptoms, insights, calendar, tracker, tips, sync.
    // So only keep ask, education, settings, and locked-chats.
    if (isAuthenticated && user?.accessLevel === 'educational') {
      const allowedEducationalIds = ['ask', 'education', 'settings', 'locked-chats']
      if (!allowedEducationalIds.includes(item.id)) return false
    }
    return true
  })

  const collapsed = !isMobile && desktopCollapsed
  const navIconSize = collapsed ? 22 : 20

  const activeCycle = (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle)
    ? partnerStatus.cycle
    : data

  const phase: CyclePhase = activeCycle.phaseLabel 
    ? (() => {
        const normalized = activeCycle.phaseLabel.toLowerCase()
        if (normalized.includes('menstrual')) return 'menstrual'
        if (normalized.includes('follicular')) return 'follicular'
        if (normalized.includes('fertile') || normalized.includes('ovulat')) return 'fertile'
        if (normalized.includes('luteal')) return 'luteal'
        return 'follicular'
      })()
    : getPhaseFromDay(computeCycleDay(activeCycle.lastPeriodStart, activeCycle.typicalCycleDays), activeCycle.typicalCycleDays)
  const phaseInfo = getPhaseInfo(phase)

  return (
    <>
      <button
        type="button"
        className={cn(
          "sidebar-backdrop transition-all duration-300 ease-in-out border-none p-0 outline-none",
          mobileOpen ? "sidebar-backdrop--visible opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Close navigation menu"
        onClick={onCloseMobile}
      />
      <aside
        className={cn(
          "sidebar",
          mobileOpen && "sidebar--open",
          collapsed && "sidebar--collapsed"
        )}
        aria-label="Primary navigation"
      >
        <div className="sidebar-brand">
          <FlowerLotus
            className="sidebar-brand-icon"
            size={26}
            weight="duotone"
            aria-hidden
          />
          {!collapsed && <span className="sidebar-brand-text">MensFlow</span>}
          
          <button
            type="button"
            className={cn("icon-btn sidebar-toggle-btn-top", !collapsed && "ml-auto")}
            onClick={desktopCollapsed ? onToggleDesktopCollapse : (onToggleSidebar || onToggleDesktopCollapse)}
            aria-label="Toggle sidebar"
          >
            {isMobile && mobileOpen ? <X size={20} /> : <SidebarIcon size={22}/>}
          </button>
        </div>

        {/* Empathy Widget */}
        {isAuthenticated && user?.accessLevel !== 'educational' && (
          <div className={cn("px-4 mb-4 mt-4", collapsed && "px-2 text-center")}>
            <m.div 
              layout
              className={cn(
                "transition-all duration-500 overflow-hidden border border-[var(--mf-border)] bg-white dark:bg-white/5 rounded-[2rem]",
                collapsed ? "p-2" : "py-5 px-6"
              )}
            >
              <div className={cn("flex items-center gap-4", collapsed && "justify-center")}>
                <div 
                  className={cn("size-12 rounded-full flex items-center justify-center shrink-0 border border-[var(--mf-border)] shadow-sm overflow-hidden",
                    (user?.role === 'partner' ? partnerStatus?.partner?.avatar : user?.avatar) ? "bg-transparent" : "bg-white dark:bg-transparent"
                  )}
                >
                  {user?.role === 'partner' ? (
                    partnerStatus?.partner?.avatar ? (
                      <img src={resolveAssetUrl(partnerStatus.partner.avatar)} alt="Partner" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/images/girl.png" alt="Partner" className="w-full h-full object-cover" />
                    )
                  ) : (
                    user?.avatar ? (
                      <img src={resolveAssetUrl(user.avatar)} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/images/girl.png" alt="You" className="w-full h-full object-cover" />
                    )
                  )}
                </div>
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground/50 mb-0.5">
                      {user?.role === 'partner' ? "Her Phase" : "Your Phase"}
                    </span>
                    <span className="text-base font-normal truncate text-[var(--mf-text-strong)]">
                      {user?.role === 'partner' && !partnerStatus?.paired ? "Unpaired" : phaseInfo.label}
                    </span>
                  </div>
                )}
              </div>
            </m.div>
          </div>
        )}

        <nav className="sidebar-nav">
          {items.map(({ id, label, Icon }) => (
            <NavLink
              key={id}
              to={id === 'dashboard' ? (isAuthenticated ? '/dashboard' : '/') : `/${id}`}
              title={collapsed ? label : undefined}
              className={({ isActive }) => cn(
                "sidebar-link transition-all duration-200",
                isActive && "sidebar-link--active"
              )}
              onClick={onCloseMobile}
            >
              <Icon size={navIconSize} className="sidebar-link-icon" aria-hidden />
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {!isAuthenticated ? (
          <div className={cn("sidebar-footer", collapsed && "sidebar-footer--compact mt-auto")}>
            {!collapsed && (
              <p className="sidebar-footer-text">
                Get real-time responses from our model tailored to menstrual
                health.
              </p>
            )}
            <button
              type="button"
              className={cn("btn btn-primary w-full transition-transform active:scale-95", collapsed && "sidebar-login-icon")}
              title={collapsed ? 'Log in' : undefined}
              onClick={onLogin}
            >
              {!collapsed ? (
                'Log in'
              ) : (
                <ChatCircle size={20} weight="bold" aria-hidden />
              )}
            </button>
          </div>
        ) : (
          <div className={cn("sidebar-footer", collapsed && "sidebar-footer--compact mt-auto")}>
            <button
              type="button"
              className={cn(
                "btn w-full flex items-center justify-center gap-2 border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95",
                collapsed ? "sidebar-login-icon" : "h-11 rounded-2xl text-xs font-normal"
              )}
              title={collapsed ? 'Sign out' : undefined}
              onClick={logout}
            >
              <SignOut size={collapsed ? 22 : 18} weight="regular" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        )}

      </aside>
    </>
  )
}
