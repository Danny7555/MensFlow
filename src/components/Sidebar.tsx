import type { ComponentType } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { IconProps } from '@phosphor-icons/react'
import {
  BookOpen,
  CalendarBlank,
  CalendarHeart,
  ChartLineUp,
  ChatCircle,
  ChatCenteredDots,
  FlowerLotus,
  GearSix,
  Heart,
  House,
  Lightbulb,
  Pulse,
  Sparkle,
  X,
  SidebarSimple,
  LockKey,
} from '@phosphor-icons/react'
import { useSettings } from '../context/useSettings'
import type { SectionId } from '../types/nav'
import { cn } from '../lib/utils'

type NavIcon = ComponentType<IconProps>

const guestItems: { id: SectionId; label: string; Icon: NavIcon }[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'ask', label: 'Ask MensFlow', Icon: ChatCenteredDots },
  { id: 'calendar', label: 'Calendar', Icon: CalendarBlank },
  { id: 'tracker', label: 'Tracker', Icon: CalendarHeart },
  { id: 'health-insights', label: 'Health insights', Icon: ChartLineUp },
  { id: 'wellness-tips', label: 'Wellness Tips', Icon: Heart },
  { id: 'settings', label: 'Settings', Icon: GearSix },
]

const authItems: { id: SectionId; label: string; Icon: NavIcon }[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'ask', label: 'Ask MensFlow', Icon: ChatCircle },
  { id: 'symptoms', label: 'Symptoms', Icon: Pulse },
  { id: 'insights', label: 'Insights', Icon: Sparkle },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'calendar', label: 'Calendar', Icon: CalendarBlank },
  { id: 'tracker', label: 'Tracker', Icon: CalendarHeart },
  { id: 'tips', label: 'Tips', Icon: Lightbulb },
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
  const location = useLocation()
  const isDashboard = location.pathname === '/' || location.pathname.startsWith('/dashboard')
  const { settings } = useSettings()

  const rawItems = isAuthenticated ? authItems : guestItems
  const items = rawItems.filter(item => {
    // Hide Home/Settings only for guests who aren't on the landing page
    if (!isAuthenticated && (item.id === 'settings' || item.id === 'dashboard') && !isDashboard) return false
    return true
  })

  // Add Locked Chats if activated
  if (isAuthenticated && settings.chatLockPassword) {
    const askIndex = items.findIndex(i => i.id === 'ask')
    if (askIndex !== -1) {
      items.splice(askIndex + 1, 0, { id: 'locked-chats', label: 'Locked Chats', Icon: LockKey })
    }
  }

  const collapsed = !isMobile && desktopCollapsed
  const navIconSize = collapsed ? 22 : 20

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
            onClick={onToggleDesktopCollapse || onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isMobile && mobileOpen ? <X size={20} /> : <SidebarSimple size={22} />}
          </button>
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

        {!isAuthenticated && (
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
        )}

      </aside>
    </>
  )
}
