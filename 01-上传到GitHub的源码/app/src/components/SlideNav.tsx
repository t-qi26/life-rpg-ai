import type { DashboardData } from '../types'

type PageKey =
  | 'overview'
  | 'tasks'
  | 'mentor'
  | 'records'
  | 'weekly'
  | 'archive'
  | 'settings'

type SlideNavProps = {
  isOpen: boolean
  activePage: PageKey
  dashboard: Pick<DashboardData, 'roleName' | 'level' | 'xp'>
  onClose: () => void
  onSelect: (page: PageKey) => void
}

const navItems: Array<{ key: PageKey; label: string; icon: string }> = [
  { key: 'overview', label: '总览', icon: '🏠' },
  { key: 'tasks', label: '今日任务', icon: '⚔' },
  { key: 'mentor', label: 'AI导师', icon: '🤖' },
  { key: 'records', label: '学习记录', icon: '📖' },
  { key: 'weekly', label: '周报', icon: '📈' },
  { key: 'archive', label: '人生档案', icon: '📷' },
  { key: 'settings', label: '设置', icon: '⚙' },
]

export function SlideNav({
  isOpen,
  activePage,
  dashboard,
  onClose,
  onSelect,
}: SlideNavProps) {
  return (
    <>
      <div
        className={`nav-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside className={`slide-nav ${isOpen ? 'open' : ''}`}>
        <div className="slide-nav-header">
          <p className="eyebrow">Life RPG AI</p>
          <button type="button" className="nav-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="slide-nav-profile">
          <p className="slide-nav-role">{dashboard.roleName}</p>
          <h2>{`Lv.${dashboard.level}`}</h2>
          <p className="slide-nav-coins">{`🪙 累计金币 ${dashboard.xp}`}</p>
        </div>

        <nav className="slide-nav-list">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`slide-nav-item ${activePage === item.key ? 'active' : ''}`}
              onClick={() => {
                onSelect(item.key)
                onClose()
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
