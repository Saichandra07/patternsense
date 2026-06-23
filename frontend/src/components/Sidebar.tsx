import React from 'react'

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M1.5 7.5L8 2L14.5 7.5V14H10.5V10H5.5V14H1.5V7.5Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
    </svg>
  )
}

function RoadmapIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1.5" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.4"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <rect x="6.5" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.5" y="2" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function WeaknessIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M2 13L6 8L9 10.5L13 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="5" r="1.5" fill="currentColor" opacity={active ? 1 : 0.7} />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M6 3H3C2.4 3 2 3.4 2 4V12C2 12.6 2.4 13 3 13H6"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 11L13 8L10 5M13 8H5"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'home',         label: 'Home',         Icon: HomeIcon },
  { id: 'roadmap',      label: 'Roadmap',       Icon: RoadmapIcon },
  { id: 'weakness-map', label: 'Weakness Map',  Icon: WeaknessIcon },
] as const

type NavScreen = 'home' | 'roadmap' | 'weakness-map' | 'settings'

interface Props {
  activeScreen: string
  onNavigate: (screen: NavScreen) => void
  onLogout: () => void
}

export default function Sidebar({ activeScreen, onNavigate, onLogout }: Props) {
  function navItem(id: NavScreen, label: string, Icon: React.FC<{ active: boolean }>) {
    const active = activeScreen === id
    return (
      <button
        key={id}
        onClick={() => onNavigate(id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
          active
            ? 'bg-accent/10 text-accent-text border border-accent/15'
            : 'text-ink-secondary hover:text-ink hover:bg-elevated border border-transparent'
        }`}
      >
        <Icon active={active} />
        {label}
      </button>
    )
  }

  return (
    <aside className="w-[220px] h-screen bg-surface border-r border-sep flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-sep">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(124,58,237,0.3)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="7,1 13,7 7,13 1,7" fill="white" opacity="0.95" />
            </svg>
          </div>
          <span className="font-semibold text-ink text-sm tracking-tight">PatternSense</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label, Icon }) => navItem(id, label, Icon))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-sep flex flex-col gap-0.5">
        {navItem('settings', 'Settings', SettingsIcon)}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-ink-muted hover:text-ink-secondary hover:bg-elevated border border-transparent transition-all"
        >
          <SignOutIcon />
          Sign out
        </button>
      </div>
    </aside>
  )
}
