import { mapSnapshotToDashboard } from '../lib/dashboardMapper'
import type { DashboardData } from '../types'
import type {
  DashboardSnapshot,
  MentorInsightRow,
  MentorSummaryRow,
  QuestRow,
  UserProfileRow,
} from '../types/storage'

export interface DashboardRepository {
  getUserProfile(): Promise<UserProfileRow>
  getTodayQuests(): Promise<QuestRow[]>
  getMentorSummary(): Promise<MentorSummaryRow>
  getMentorInsights(): Promise<MentorInsightRow[]>
}

export class SnapshotDashboardRepository implements DashboardRepository {
  private readonly snapshot: DashboardSnapshot

  constructor(snapshot: DashboardSnapshot) {
    this.snapshot = snapshot
  }

  async getUserProfile(): Promise<UserProfileRow> {
    return this.snapshot.user
  }

  async getTodayQuests(): Promise<QuestRow[]> {
    return this.snapshot.quests
  }

  async getMentorSummary(): Promise<MentorSummaryRow> {
    return this.snapshot.mentorSummary
  }

  async getMentorInsights(): Promise<MentorInsightRow[]> {
    return this.snapshot.mentorInsights
  }
}

export async function getDashboardDataFromRepository(
  repository: DashboardRepository,
): Promise<DashboardData> {
  const [user, quests, mentorSummary, mentorInsights] = await Promise.all([
    repository.getUserProfile(),
    repository.getTodayQuests(),
    repository.getMentorSummary(),
    repository.getMentorInsights(),
  ])

  const snapshot: DashboardSnapshot = {
    user,
    quests,
    mentorSummary,
    mentorInsights,
  }

  return mapSnapshotToDashboard(snapshot)
}
