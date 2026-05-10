import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import type { IconProps } from '@phosphor-icons/react'
import {
  BookOpen,
  CalendarBlank,
  CalendarHeart,
  CaretDoubleLeft,
  CaretDoubleRight,
  ChartLineUp,
  ChatCircle,
  ChatCenteredDots,
  ClockCounterClockwise,
  FlowerLotus,
  GearSix,
  Heart,
  Lightbulb,
  Pulse,
  Sparkle,
} from '@phosphor-icons/react'
import type { SectionId } from '../types/nav'

type NavIcon = ComponentType<IconProps>

const guestItems: { id: SectionId; label: string; Icon: NavIcon }[] = [
  { id: 'new-chat', label: 'New chat', Icon: ChatCircle },
  { id: 'calendar', label: 'Calendar', Icon: CalendarBlank },
  { id: 'ask', label: 'Ask MensFlow', Icon: ChatCenteredDots },
  { id: 'health-insights', label: 'Health insights', Icon: ChartLineUp },
  { id: 'wellness-tips', label: 'Wellness Tips', Icon: Heart },
  { id: 'history', label: 'History / logs', Icon: ClockCounterClockwise },
  { id: 'settings', label: 'Settings', Icon: GearSix },
]

const authItems: { id: SectionId; label: string; Icon: NavIcon }[] = [
  { id: 'ask', label: 'Ask MensFlow', Icon: ChatCircle },
  { id: 'symptoms', label: 'Symptoms', Icon: Pulse },
  { id: 'insights', label: 'Insights', Icon: Sparkle },
  { id: 'education', label: 'Education', Icon: BookOpen },
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
}

export function Sidebar({
  isAuthenticated,
  mobileOpen,
  onCloseMobile,
  onLogin,
  isMobile,
  desktopCollapsed,
  onToggleDesktopCollapse,
}: SidebarProps) {
  const items = isAuthenticated ? authItems : guestItems
  const collapsed = !isMobile && desktopCollapsed

  const navIconSize = collapsed ? 22 : 20

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'sidebar-backdrop--visible' : ''}`}
        aria-hidden={!mobileOpen}
        role="button"
        tabIndex={0}
        onClick={onCloseMobile}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCloseMobile() }}
      />
      <aside
        className={`sidebar ${mobileOpen ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-brand">
          <FlowerLotus
            className="sidebar-brand-icon"
            size={26}
            weight="duotone"
            aria-hidden
          />
          <span className="sidebar-brand-text">MensFlow</span>
        </div>

        <nav className="sidebar-nav">
          {items.map(({ id, label, Icon }) => (
            <NavLink
              key={id}
              to={id === 'dashboard' || (id === 'ask' && !isAuthenticated) ? '/' : `/${id}`}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              onClick={onCloseMobile}
            >
              <Icon size={navIconSize} className="sidebar-link-icon" aria-hidden />
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {!isAuthenticated && (
          <div className={`sidebar-footer ${collapsed ? 'sidebar-footer--compact' : ''}`}>
            {!collapsed && (
              <p className="sidebar-footer-text">
                Get real-time responses from our model tailored to menstrual
                health.
              </p>
            )}
            <button
              type="button"
              className={collapsed ? 'btn btn-primary sidebar-login-icon' : 'btn btn-primary'}
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

        {!isMobile && (
          <div className="sidebar-rail-toggle">
            <button
              type="button"
              className="icon-btn sidebar-rail-toggle-btn"
              onClick={onToggleDesktopCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <CaretDoubleRight size={20} aria-hidden />
              ) : (
                <CaretDoubleLeft size={20} aria-hidden />
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
