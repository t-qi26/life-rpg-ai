import type { DashboardData } from '../types'

type StatsPanelProps = {
  stats: DashboardData['stats']
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="panel-kicker">能力状态</p>
        <h3>今天最值得关注的成长维度</h3>
      </div>

      <div className="stats-list">
        {stats.map((stat) => (
          <div className="stat-row" key={stat.label}>
            <div>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-detail">{stat.detail}</p>
            </div>
            <div className="stat-value-wrap">
              <span className="stat-value">{stat.value}%</span>
              <div className="stat-bar">
                <span style={{ width: `${stat.value}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
