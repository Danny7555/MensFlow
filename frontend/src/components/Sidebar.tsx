import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { m } from 'framer-motion'
import type { IconProps } from '@phosphor-icons/react'
import {
  BookOpen,
  CalendarBlank,
  CalendarHeart,
  ChatCircle,
  ChatCenteredDots,
  FlowerLotus,
  GearSix,
  Heart,
  House,
  Pulse,
  Target,
  X,
  SidebarSimple,
  SignOut,
  Users,
  Sparkle,
} from '@phosphor-icons/react'
import type { SectionId } from '../types/nav'
import { cn } from '../lib/utils'
import { useAuth } from '../context/useAuth'
import { useStore } from '../store/useStore'
import { computeCycleDay, getPhaseFromDay, getPhaseInfo } from '../lib/cycleUtils'

type NavIcon = ComponentType<IconProps>

const guestItems: { id: SectionId; label: string; Icon: NavIcon }[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'ask', label: 'Ask MensFlow', Icon: ChatCenteredDots },
  { id: 'symptoms', label: 'Symptoms', Icon: Pulse },
  { id: 'insights', label: 'Health insights', Icon: Target },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'calendar', label: 'Calendar', Icon: CalendarBlank },
  { id: 'tracker', label: 'Tracker', Icon: CalendarHeart },
  { id: 'tips', label: 'Wellness Tips', Icon: Heart },
  { id: 'sync', label: 'Partner Sync', Icon: Users },
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
  const { logout } = useAuth()

  const items = isAuthenticated ? authItems : guestItems

  const collapsed = !isMobile && desktopCollapsed
  const navIconSize = collapsed ? 22 : 20

  const { dashboard: data, user } = useStore()
  const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
  const phase = getPhaseFromDay(cycleDay)
  const phaseInfo = getPhaseInfo(phase)

  return (
    <>
      <div
        className={cn(
          "sidebar-backdrop transition-all duration-300 ease-in-out",
          mobileOpen ? "sidebar-backdrop--visible opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
        role="button"
        tabIndex={-1}
        onClick={onCloseMobile}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCloseMobile() }}
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
            {isMobile && mobileOpen ? <X size={20} /> : <SidebarSimple size={22} />}
          </button>
        </div>

        {/* Empathy Widget */}
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
                  user?.avatar ? "bg-transparent" : "bg-white dark:bg-transparent"
                )}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Partner" className="w-full h-full object-cover" />
                ) : (
                  <Sparkle size={20} weight="fill" className="text-yellow-400" />
                )}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground/50 mb-0.5">Partner</span>
                  <span className="text-base font-normal truncate text-[var(--mf-text-strong)]">{phaseInfo.label}</span>
                </div>
              )}
            </div>
          </m.div>
        </div>

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
