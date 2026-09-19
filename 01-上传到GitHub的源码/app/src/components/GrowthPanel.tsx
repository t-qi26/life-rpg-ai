import type { DashboardData } from '../types'

type GrowthPanelProps = {
  todayLabel: string
  currentStreak: number
  growthRecords: DashboardData['growthRecords']
}

export function GrowthPanel({
  todayLabel,
  currentStreak,
  growthRecords,
}: GrowthPanelProps) {
  const recentRecords = [...growthRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)

  return (
    <section className="panel growth-panel">
      <div className="panel-heading">
        <p className="panel-kicker">成长记录</p>
        <h3>{todayLabel}</h3>
      </div>

      <div className="growth-summary">
        <div className="progress-pill">
          <span>连续成长天数</span>
          <strong>{currentStreak}</strong>
        </div>
      </div>

      <div className="growth-record-list">
        {recentRecords.length > 0 ? (
          recentRecords.map((record) => (
            <article className="growth-record-card" key={record.date}>
              <p className="growth-date">{record.date}</p>
              <p className="growth-meta">完成 {record.completedQuestCount} 个任务</p>
              <p className="growth-meta">获得 🪙 {record.completedXp}</p>
            </article>
          ))
        ) : (
          <article className="growth-record-card">
            <p className="growth-date">今天还没有成长记录</p>
            <p className="growth-meta">完成第一条真实任务后，这里才会开始累计。</p>
          </article>
        )}
      </div>
    </section>
  )
}
