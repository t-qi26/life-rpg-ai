import type { DashboardData } from '../types'

export const mockDashboard: DashboardData = {
  appName: 'Life RPG AI',
  roleName: 'AI Builder',
  level: 1,
  xp: 0,
  xpToNext: 1000,
  summary: '今天还没有开始。先添加第一条任务，再让系统根据你的真实执行情况生成建议。',
  stats: [
    { label: 'AI能力', value: 0, detail: 'Agent / Prompt / 自动化' },
    { label: '认知', value: 0, detail: '阅读 / 思维训练 / 复盘' },
    { label: '语言', value: 0, detail: '英语任务会在开始后累计' },
    { label: '审美', value: 0, detail: '表达 / 视觉感知 / 风格积累' },
  ],
  mentorInsights: [
    {
      tag: '状态分析',
      content: '当前还是空白开局，系统还没有采集到你的真实执行数据。',
    },
    {
      tag: '问题判断',
      content: '今天还不能判断你的执行问题，因为你还没有开始第一条任务。',
    },
    {
      tag: '调整方案',
      content: '先创建今天的第一条任务，完成一次后再让 AI 给出真正的分析。',
    },
  ],
  quests: [],
  modules: ['总览', '今日任务', 'AI导师', '学习记录'],
  roadmap: ['创建今天第一条任务', '完成一次真实执行', '生成第一条成长记录', '开始让 AI 参与调整'],
  weeklyReport: {
    weekLabel: '2026-W31',
    levelProgress: '本周还没有产生真实成长结算。',
    gains: ['暂无已完成项目'],
    focus: '下一步：从第一条真实任务开始，而不是先看演示进度。',
  },
  growthRecords: [],
  currentStreak: 0,
}
