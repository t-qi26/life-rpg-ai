import type { DashboardData } from '../types'

type SystemPanelsProps = {
  modules: DashboardData['modules']
  roadmap: DashboardData['roadmap']
  weeklyReport: DashboardData['weeklyReport']
}

export function SystemPanels({
  modules,
  roadmap,
  weeklyReport,
}: SystemPanelsProps) {
  return (
    <section className="bottom-grid">
      <article className="panel">
        <div className="panel-heading">
          <p className="panel-kicker">系统模块</p>
          <h3>核心功能</h3>
        </div>
        <ul className="module-list">
          {modules.map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <p className="panel-kicker">下个版本</p>
          <h3>开发推进</h3>
        </div>
        <ul className="roadmap-list">
          {roadmap.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <p className="panel-kicker">周报预览</p>
          <h3>{weeklyReport.weekLabel}</h3>
        </div>
        <p className="report-progress">{weeklyReport.levelProgress}</p>
        <ul className="module-list">
          {weeklyReport.gains.map((gain) => (
            <li key={gain}>{gain}</li>
          ))}
        </ul>
        <p className="report-focus">{weeklyReport.focus}</p>
      </article>
    </section>
  )
}
