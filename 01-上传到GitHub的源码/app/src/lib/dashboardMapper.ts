import { mockDashboard } from '../data/mockDashboard'
import type { DashboardData } from '../types'
import type { DashboardSnapshot } from '../types/storage'

export function mapSnapshotToDashboard(
  snapshot: DashboardSnapshot,
): DashboardData {
  const mentorInsights = [...snapshot.mentorInsights]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ tag, content }) => ({ tag, content }))

  const quests = [...snapshot.quests]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...quest }, index) => ({
      ...quest,
      id: `${quest.type}-${quest.title}-${index}`,
      completed: false,
    }))

  return {
    appName: 'Life RPG AI',
    roleName: snapshot.user.roleName,
    level: snapshot.user.level,
    xp: snapshot.user.xp,
    xpToNext: snapshot.user.xpToNext,
    summary: snapshot.mentorSummary.summary,
    stats: [
      {
        label: 'AI Engineering',
        value: snapshot.user.aiEngineering,
        detail: 'Python / Agent / MCP',
      },
      {
        label: 'Cognitive',
        value: snapshot.user.cognitive,
        detail: '底层逻辑 / 思维训练',
      },
      {
        label: 'Language',
        value: snapshot.user.language,
        detail: '四级阅读进阶中',
      },
      {
        label: 'Aesthetic',
        value: snapshot.user.aesthetic,
        detail: '风格表达 / 视觉审美',
      },
    ],
    mentorInsights,
    quests,
    modules: mockDashboard.modules,
    roadmap: mockDashboard.roadmap,
    weeklyReport: mockDashboard.weeklyReport,
    growthRecords: [],
    currentStreak: 0,
  }
}
