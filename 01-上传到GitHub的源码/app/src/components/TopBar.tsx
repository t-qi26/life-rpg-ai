type PageTitle =
  | '总览'
  | '今日任务'
  | 'AI导师'
  | '学习记录'
  | '周报'
  | '人生档案'
  | '设置'

type TopBarProps = {
  title: PageTitle
  todayLongLabel: string
  onOpenNav: () => void
}

export function TopBar({ title, todayLongLabel, onOpenNav }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button type="button" className="menu-button" onClick={onOpenNav}>
          菜单
        </button>
        <div>
          <p className="eyebrow">{todayLongLabel}</p>
          <h1 className="page-title">{title}</h1>
        </div>
      </div>

      <div className="top-bar-actions">
        <span className="top-bar-badge">Life RPG AI</span>
      </div>
    </header>
  )
}
