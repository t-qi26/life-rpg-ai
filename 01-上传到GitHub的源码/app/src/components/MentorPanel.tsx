import type { DashboardData } from '../types'

type MentorPanelProps = {
  mentorInsights: DashboardData['mentorInsights']
}

export function MentorPanel({ mentorInsights }: MentorPanelProps) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="panel-kicker">AI 导师建议</p>
        <h3>今日策略</h3>
      </div>

      {mentorInsights.map((insight) => (
        <div className="mentor-block" key={insight.tag}>
          <p className="mentor-tag">{insight.tag}</p>
          <p>{insight.content}</p>
        </div>
      ))}
    </article>
  )
}
