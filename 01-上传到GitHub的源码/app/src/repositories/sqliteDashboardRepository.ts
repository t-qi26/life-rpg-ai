import type {
  DashboardRepository,
} from './dashboardRepository'
import type {
  MentorInsightRow,
  MentorSummaryRow,
  QuestRow,
  UserProfileRow,
} from '../types/storage'

export class SqliteDashboardRepository implements DashboardRepository {
  async getUserProfile(): Promise<UserProfileRow> {
    throw new Error('SQLite repository is not connected yet.')
  }

  async getTodayQuests(): Promise<QuestRow[]> {
    throw new Error('SQLite repository is not connected yet.')
  }

  async getMentorSummary(): Promise<MentorSummaryRow> {
    throw new Error('SQLite repository is not connected yet.')
  }

  async getMentorInsights(): Promise<MentorInsightRow[]> {
    throw new Error('SQLite repository is not connected yet.')
  }
}
