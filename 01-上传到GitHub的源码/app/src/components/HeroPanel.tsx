import type { ChangeEvent } from 'react'
import type { DashboardData } from '../types'

type HeroPanelProps = {
  dashboard: DashboardData
  isRefreshing: boolean
  completedQuestCount: number
  completedXp: number
  onRefresh: () => void
  onExport: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onExportWeeklyReport: () => void
}

export function HeroPanel({
  dashboard,
  isRefreshing,
  completedQuestCount,
  completedXp,
  onRefresh,
  onExport,
  onImport,
  onExportWeeklyReport,
}: HeroPanelProps) {
  const completionRate = Math.round(
    (completedQuestCount / Math.max(dashboard.quests.length, 1)) * 100,
  )

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">{dashboard.appName}</p>
        <h1>人生控制台</h1>
        <p className="hero-text">Desktop Growth Console</p>
        <p className="hero-text">{dashboard.summary}</p>

        <div className="hero-actions">
          <button type="button" className="primary-button">
            进入今日任务
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? '正在刷新数据' : '刷新成长数据'}
          </button>
          <button type="button" className="secondary-button" onClick={onExport}>
            导出今日任务快照
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onExportWeeklyReport}
          >
            导出本周成长报告
          </button>
          <label className="secondary-button import-button">
            导入任务快照
            <input type="file" accept="application/json" onChange={onImport} />
          </label>
        </div>

        <div className="hero-progress">
          <div className="progress-pill">
            <span>今日完成率</span>
            <strong>{completionRate}%</strong>
          </div>
          <div className="progress-pill">
            <span>已完成任务</span>
            <strong>{completedQuestCount}</strong>
          </div>
          <div className="progress-pill">
            <span>今日获得金币</span>
            <strong>🪙 {completedXp}</strong>
          </div>
        </div>
      </div>

      <aside className="profile-card profile-overview">
        <p className="profile-role">
          {dashboard.roleName} Lv.{dashboard.level}
        </p>
        <h2>🪙 {dashboard.xp}</h2>
        <p className="profile-summary">累计金币</p>
        <div className="overview-focus">
          <span>今日一句话</span>
          <strong>
            {dashboard.xp === 0 && dashboard.quests.length === 0
              ? '从第一条真实任务开始，今天的成长会从 0 变成 1。'
              : '先完成关键任务，再考虑额外扩展，成长会更稳。'}
          </strong>
        </div>
      </aside>
    </section>
  )
}
