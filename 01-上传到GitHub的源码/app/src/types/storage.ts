export type UserProfileRow = {
  roleName: string
  level: number
  xp: number
  xpToNext: number
  aiEngineering: number
  cognitive: number
  language: number
  aesthetic: number
}

export type MentorInsightRow = {
  tag: string
  content: string
  sortOrder: number
}

export type MentorSummaryRow = {
  summary: string
}

export type QuestRow = {
  type: string
  title: string
  duration: string
  xp: number
  note: string
  sortOrder: number
}

export type DashboardSnapshot = {
  user: UserProfileRow
  quests: QuestRow[]
  mentorSummary: MentorSummaryRow
  mentorInsights: MentorInsightRow[]
}

export type PersistedUserProfile = UserProfileRow
