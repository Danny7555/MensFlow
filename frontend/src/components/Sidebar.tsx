import type { ComponentType } from 'react'
import { useState, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import type { IconProps } from '@phosphor-icons/react'
import {
  Bell,
  BookOpen,
  CalendarBlank,
  CalendarHeart,
  CaretDown,
  ChartBar,
  ChatCircle,
  ClockClockwise,
  FlowerLotus,
  GearSix,
  Heart,
  House,
  Pill,
  Pulse,
  Target,
  X,
  SidebarIcon,
  SignOut,
  Users,
} from '@phosphor-icons/react'
import type { SectionId } from '../types/nav'
import { cn } from '../lib/utils'
import { useAuth } from '../context/useAuth'
import { useStore } from '../store/useStore'
import { computeCycleDay, getPhaseFromDay, getPhaseInfo, type CyclePhase } from '../lib/cycleUtils'
import { resolveAssetUrl } from '../lib/apiClient'

type NavIcon = ComponentType<IconProps>

interface NavItem {
  id: SectionId
  label: string
  Icon: NavIcon
  children?: { id: SectionId; label: string; Icon?: NavIcon }[]
}

const guestItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'settings', label: 'Settings', Icon: GearSix },
]

const authItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'ask', label: 'Ask MensFlow', Icon: ChatCircle },
  { id: 'symptoms', label: 'Symptoms', Icon: Pulse },
  { id: 'insights', label: 'Health insights', Icon: Target },
  // { id: 'community', label: 'Community', Icon: FlowerLotus },
  { id: 'cycle-history', label: 'Cycle History', Icon: ClockClockwise, children: [
    { id: 'cycle-compare', label: 'Compare Cycles', Icon: ChartBar },
    { id: 'medications', label: 'Medications', Icon: Pill },
  ] },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'calendar', label: 'Calendar', Icon: CalendarBlank },
  { id: 'tracker', label: 'Tracker', Icon: CalendarHeart },
  { id: 'tips', label: 'Wellness Tips', Icon: Heart },
  { id: 'sync', label: 'Partner Sync', Icon: Users },
  { id: 'notifications', label: 'Alerts', Icon: Bell },
  { id: 'settings', label: 'Settings', Icon: GearSix },
]

type SidebarProps = {
  isAuthenticated: boolean
  /** Mobile drawer open */
  mobileOpen: boolean
  onCloseMobile: () => void
  onLogin: (initialMode?: 'login' | 'register') => void
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

  const { dashboard: data, user, partnerStatus, notificationCount, settings: sideSettings } = useStore()
  const { pathname } = useLocation()

  const rawItems = isAuthenticated ? [...authItems] : [...guestItems]

  // Track user's manual toggle for parent sections
  const [userToggles, setUserToggles] = useState<Record<string, boolean>>({})
  const items = isAuthenticated ? authItems : guestItems
  // Derive auto-expanded sections from current pathname
  const autoExpanded = useMemo(() => {
    const auto: Record<string, boolean> = {}
    for (const item of items) {
      if (item.children) {
        auto[item.id] = item.children.some(c => pathname === `/${c.id}`)
      }
    }
    return auto
  }, [pathname, items])
  // Merge: user toggle overrides, else auto-expand
  const expanded: Record<string, boolean> = useMemo(() => {
    const result = { ...autoExpanded }
    for (const [id, val] of Object.entries(userToggles)) {
      result[id] = val
    }
    return result
  }, [autoExpanded, userToggles])

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
            id="sidebar-toggle-btn"
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
                collapsed ? "p-1.5" : "py-5 px-6"
              )}
            >
              <div className={cn("flex items-center gap-4", collapsed && "justify-center")}>
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center shrink-0 border border-[var(--mf-border)] overflow-hidden",
                    collapsed ? "size-10" : "size-12",
                    (user?.role === 'partner' ? partnerStatus?.partner?.avatar : user?.avatar) ? "bg-transparent" : "bg-white dark:bg-transparent"
                  )}
                >
                  {user?.role === 'partner' ? (
                    partnerStatus?.partner?.avatar ? (
                      <img loading="lazy" src={resolveAssetUrl(partnerStatus.partner.avatar)} alt="Partner" className="w-full h-full object-cover" />
                    ) : (
                      <img loading="lazy" src="/images/girl.jpg" alt="Partner" className="w-full h-full object-cover" />
                    )
                  ) : (
                    user?.avatar ? (
                      <img loading="lazy" src={resolveAssetUrl(user.avatar)} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <img loading="lazy" src="/images/girl.jpg" alt="You" className="w-full h-full object-cover" />
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
          {rawItems.map((item) => {
            // Check if this parent or any of its children should be visible
            const parentVisible = !onboardingCompleted && item.id !== 'ask' ? false
              : isAuthenticated && user?.accessLevel === 'educational' && !['ask', 'education', 'settings', 'cycle-history'].includes(item.id) ? false
              : true
            if (!parentVisible) return null
            return (
              <div key={item.id}>
                <div className="flex items-center">
                  <NavLink
                    id={`sidebar-link-${item.id}`}
                    to={item.id === 'dashboard' ? (isAuthenticated ? '/dashboard' : '/') : `/${item.id}`}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => cn(
                      "sidebar-link flex-1 transition-all duration-200",
                      isActive && "sidebar-link--active"
                    )}
                    onClick={onCloseMobile}
                  >
                    <div className="relative">
                      <item.Icon size={navIconSize} className="sidebar-link-icon" aria-hidden />
                      {item.id === 'notifications' && (() => {
                        const badgeCount = notificationCount + (user?.role === 'lady' && sideSettings?.privacyPendingAccessRequest ? 1 : 0)
                        return badgeCount > 0 ? (
                          <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-[var(--mf-accent)] text-white text-[8px] font-bold flex items-center justify-center leading-none animate-in fade-in zoom-in-95 duration-200">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        ) : null
                      })()}
                    </div>
                    <span className="sidebar-link-label">{item.label}</span>
                  </NavLink>
                  {item.children && (
                    <button
                      id={`sidebar-expand-${item.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUserToggles(prev => {
                          const currentDisplayed = item.id in prev ? prev[item.id] : autoExpanded[item.id]
                          return { ...prev, [item.id]: !currentDisplayed }
                        })
                      }}
                      className="flex items-center justify-center size-8 mr-1 text-muted-foreground hover:text-[var(--mf-text-strong)] transition-colors cursor-pointer bg-transparent border-none rounded-lg hover:bg-[var(--mf-hover)]"
                      aria-label={expanded[item.id] ? 'Collapse' : 'Expand'}
                    >
                      <CaretDown size={14} className={`transition-transform duration-200 ${expanded[item.id] ? '' : '-rotate-90'}`} />
                    </button>
                  )}
                </div>
                {item.children && expanded[item.id] && item.children.map(child => {
                  const childVisible = isAuthenticated && user?.accessLevel === 'educational' && !['cycle-compare', 'medications'].includes(child.id) ? false : true
                  if (!childVisible) return null
                  const ChildIcon = child.Icon
                  return (
                    <NavLink
                      id={`sidebar-link-${child.id}`}
                      key={child.id}
                      to={`/${child.id}`}
                      title={collapsed ? child.label : undefined}
                      className={({ isActive }) => cn(
                        "sidebar-link sidebar-link--child transition-all duration-200",
                        isActive && "sidebar-link--active"
                      )}
                      onClick={onCloseMobile}
                    >
                      {ChildIcon && <ChildIcon size={navIconSize} className="sidebar-link-icon" aria-hidden />}
                      <span className="sidebar-link-label text-xs">{child.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
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
              id="sidebar-login-btn"
              type="button"
              className={cn("btn btn-primary w-full transition-transform active:scale-95", collapsed && "sidebar-login-icon")}
              title={collapsed ? 'Log in' : undefined}
              onClick={() => onLogin('login')}
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
              id="sidebar-logout-btn"
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
