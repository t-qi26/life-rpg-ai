import type { DashboardData } from '../types'
import {
  getDashboardDataFromRepository,
  SnapshotDashboardRepository,
} from '../repositories/dashboardRepository'
import type { DashboardSnapshot } from '../types/storage'

const fallbackSnapshot: DashboardSnapshot = {
  user: {
    roleName: 'AI Builder',
    level: 1,
    xp: 0,
    xpToNext: 1000,
    aiEngineering: 0,
    cognitive: 0,
    language: 0,
    aesthetic: 0,
  },
  quests: [],
  mentorSummary: {
    summary: '今天还没有开始。先添加你的第一条任务，再让 AI 根据真实执行情况给建议。',
  },
  mentorInsights: [
    {
      tag: '状态分析',
      content: '当前还是空白开局，系统还没有采集到你的真实执行数据。',
      sortOrder: 1,
    },
    {
      tag: '问题判断',
      content: '今天还不能判断你的执行问题，因为你还没有开始第一条任务。',
      sortOrder: 2,
    },
    {
      tag: '下一步',
      content: '先创建今天的第一条任务，完成一次后再让 AI 给出真正的分析。',
      sortOrder: 3,
    },
  ],
}

export async function getDashboardData(): Promise<DashboardData> {
  return getDashboardDataFromRepository(
    new SnapshotDashboardRepository(fallbackSnapshot),
  )
}
