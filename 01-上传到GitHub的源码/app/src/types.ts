export type Stat = {
  label: string
  value: number
  detail: string
}

export type Quest = {
  type: string
  title: string
  duration: string
  xp: number
  note: string
}

export type EditableQuest = Quest & {
  id: string
  completed: boolean
}

export type MentorInsight = {
  tag: string
  content: string
}

export type MentorDecision = {
  headline: string
  executionRate: number
  completedCount: number
  totalCount: number
  earnedCoins: number
  issue: string
  adjustment: string
  reason: string
  tomorrowFocus: string
}

export type MentorSections = {
  statusAnalysis: string
  problemJudgment: string
  adjustmentPlan: string[]
  todaySuggestion: string
}

export type DashboardData = {
  appName: string
  roleName: string
  level: number
  xp: number
  xpToNext: number
  summary: string
  stats: Stat[]
  mentorInsights: MentorInsight[]
  quests: EditableQuest[]
  modules: string[]
  roadmap: string[]
  weeklyReport: {
    weekLabel: string
    levelProgress: string
    gains: string[]
    focus: string
  }
  growthRecords: Array<{
    date: string
    completedQuestCount: number
    completedXp: number
  }>
  currentStreak: number
}

export type TomorrowPlanDraft = {
  createdAt: string
  quests: EditableQuest[]
}

export type ArchivedPlan = {
  date: string
  quests: EditableQuest[]
  source: 'manual' | 'promoted'
}

export type PhotoArchiveRecord = {
  id: string
  createdAt: string
  category: '学习' | '生活' | '旅行' | '其他'
  title: string
  note: string
  imageUrl: string
  fileName: string
}

export type DashboardStorageSnapshot = {
  todayQuests: EditableQuest[]
  tomorrowDraft: TomorrowPlanDraft | null
}
