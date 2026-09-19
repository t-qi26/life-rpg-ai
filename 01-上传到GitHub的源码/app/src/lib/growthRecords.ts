import type { EditableQuest, DashboardData } from '../types'
import { getTodayLabel } from './date'

export function nextDateLabel(date: string) {
  const cursor = new Date(`${date}T00:00:00`)
  cursor.setDate(cursor.getDate() + 1)
  return cursor.toISOString().slice(0, 10)
}

export function upsertGrowthRecord(
  records: DashboardData['growthRecords'],
  quests: EditableQuest[],
) {
  const today = getTodayLabel()
  const completedQuestCount = quests.filter((quest) => quest.completed).length
  const completedXp = quests
    .filter((quest) => quest.completed)
    .reduce((sum, quest) => sum + quest.xp, 0)

  const filtered = records.filter((record) => record.date !== today)

  if (completedQuestCount === 0 && completedXp === 0) {
    return filtered.sort((a, b) => a.date.localeCompare(b.date))
  }

  const nextRecord = {
    date: today,
    completedQuestCount,
    completedXp,
  }

  return [...filtered, nextRecord].sort((a, b) => a.date.localeCompare(b.date))
}

export function calculateCurrentStreak(
  records: DashboardData['growthRecords'],
) {
  const today = getTodayLabel()
  const activeDates = records
    .filter((record) => record.completedQuestCount > 0)
    .map((record) => record.date)
    .sort()

  if (activeDates.length === 0) {
    return 0
  }

  let streak = 0
  let cursor = new Date(`${today}T00:00:00`)

  while (true) {
    const label = cursor.toISOString().slice(0, 10)
    if (!activeDates.includes(label)) {
      break
    }

    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
