import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getTodayLabel } from '../lib/date'
import {
  applyAbilityProgress,
  buildPersistedProfile,
} from '../lib/profileProgress'
import { getDashboardData } from '../lib/dashboard'
import {
  isDesktopRuntime,
  loadDesktopAppState,
  saveDesktopActiveDate,
  saveDesktopArchivedPlans,
  saveDesktopGrowthRecords,
  saveDesktopQuests,
  saveDesktopTomorrowDraft,
  saveDesktopUserProfile,
} from '../lib/desktop'
import {
  calculateCurrentStreak,
  upsertGrowthRecord,
} from '../lib/growthRecords'
import {
  loadActiveDate,
  loadArchivedPlans,
  loadGrowthOverrides,
  loadQuestOverrides,
  loadTomorrowDraft,
  loadUserProfileOverride,
  saveArchivedPlans,
  saveActiveDate,
  saveGrowthOverrides,
  saveQuestOverrides,
  saveTomorrowDraft,
  saveUserProfileOverride,
} from '../lib/storage'
import { buildWeeklyReport, buildWeeklyReportMarkdown } from '../lib/weeklyReport'
import type {
  ArchivedPlan,
  DashboardData,
  DashboardStorageSnapshot,
  EditableQuest,
  TomorrowPlanDraft,
} from '../types'

const EXPORT_DATE = getTodayLabel()

function activateTomorrowDraftIfDue(
  todayLabel: string,
  todayQuests: EditableQuest[],
  tomorrowDraft: TomorrowPlanDraft | null,
  archivedPlans: ArchivedPlan[],
) {
  if (!tomorrowDraft) {
    return {
      activeQuests: todayQuests,
      activeTomorrowDraft: null,
      activeArchivedPlans: archivedPlans,
      promoted: false,
    }
  }

  if (tomorrowDraft.createdAt !== todayLabel) {
    return {
      activeQuests: todayQuests,
      activeTomorrowDraft: tomorrowDraft,
      activeArchivedPlans: archivedPlans,
      promoted: false,
    }
  }

  const promotedQuests = tomorrowDraft.quests.map((quest, index) => ({
    ...quest,
    id: `today-${Date.now()}-${index}`,
    completed: false,
  }))

  const nextArchivedPlans = todayQuests.length
    ? [
        {
          date: todayLabel,
          quests: todayQuests,
          source: 'promoted' as const,
        },
        ...archivedPlans.filter((plan) => plan.date !== todayLabel),
      ].slice(0, 10)
    : archivedPlans

  return {
    activeQuests: promotedQuests,
    activeTomorrowDraft: null,
    activeArchivedPlans: nextArchivedPlans,
    promoted: true,
  }
}

function archivePreviousDayIfNeeded(
  storedActiveDate: string | null | undefined,
  todayLabel: string,
  previousQuests: EditableQuest[] | null | undefined,
  archivedPlans: ArchivedPlan[],
) {
  if (!storedActiveDate || storedActiveDate === todayLabel || !previousQuests?.length) {
    return archivedPlans
  }

  return [
    {
      date: storedActiveDate,
      quests: previousQuests,
      source: 'promoted' as const,
    },
    ...archivedPlans.filter((plan) => plan.date !== storedActiveDate),
  ].slice(0, 30)
}

function downloadText(filename: string, content: string, mimeType: string) {
  if (typeof window === 'undefined') {
    return
  }

  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function downloadSnapshot(quests: EditableQuest[]) {
  const payload = {
    exportedAt: `${EXPORT_DATE}T00:00:00`,
    quests,
  }

  downloadText(
    `life-rpg-ai-quests-${EXPORT_DATE}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8',
  )
}

async function readImportedQuests(file: File): Promise<EditableQuest[] | null> {
  const raw = await file.text()

  try {
    const parsed = JSON.parse(raw) as { quests?: EditableQuest[] }
    if (!parsed.quests || !Array.isArray(parsed.quests)) {
      return null
    }

    return parsed.quests.map((quest, index) => ({
      id: quest.id || `imported-${index}`,
      type: quest.type || '支线',
      title: quest.title || '',
      duration: quest.duration || '30 分钟',
      xp: Number(quest.xp) || 0,
      note: quest.note || '',
      completed: Boolean(quest.completed),
    }))
  } catch {
    return null
  }
}

export function useDashboard() {
  const todayLabel = getTodayLabel()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tomorrowDraft, setTomorrowDraftState] = useState<TomorrowPlanDraft | null>(
    null,
  )
  const [archivedPlans, setArchivedPlans] = useState<ArchivedPlan[]>([])

  async function loadDashboard() {
    setIsRefreshing(true)
    try {
      const data = await getDashboardData()
      const desktopState = isDesktopRuntime() ? await loadDesktopAppState() : null
      const storedActiveDate = desktopState?.activeDate ?? loadActiveDate()
      const isFreshDay = !storedActiveDate || storedActiveDate !== todayLabel
      const savedQuests = desktopState?.quests ?? loadQuestOverrides()
      const storedArchivedPlans = desktopState?.archivedPlans ?? loadArchivedPlans() ?? []
      const rolledArchivedPlans = archivePreviousDayIfNeeded(
        storedActiveDate,
        todayLabel,
        savedQuests,
        storedArchivedPlans,
      )
      const questOverrides = isFreshDay ? null : savedQuests
      const baseQuests =
        questOverrides && questOverrides.length > 0 ? questOverrides : data.quests
      const storedTomorrowDraft = isFreshDay
        ? desktopState?.tomorrowDraft ?? loadTomorrowDraft()
        : desktopState?.tomorrowDraft ?? loadTomorrowDraft()
      const activated = activateTomorrowDraftIfDue(
        todayLabel,
        baseQuests,
        storedTomorrowDraft,
        rolledArchivedPlans,
      )
      const quests = activated.activeQuests
      const growthOverrides = desktopState?.growthRecords ?? loadGrowthOverrides()
      const stats = applyAbilityProgress(data.stats, quests, activated.activeArchivedPlans)
      const userProfile = buildPersistedProfile(
        desktopState?.userProfile ?? loadUserProfileOverride() ?? {
          roleName: data.roleName,
          level: data.level,
          xp: data.xp,
          xpToNext: data.xpToNext,
          aiEngineering: 0,
          cognitive: 0,
          language: 0,
          aesthetic: 0,
        },
        stats,
        quests,
        activated.activeArchivedPlans,
      )
      const growthRecords = upsertGrowthRecord(
        growthOverrides && growthOverrides.length > 0
          ? growthOverrides
          : data.growthRecords,
        quests,
      )

      saveActiveDate(todayLabel)
      if (isDesktopRuntime()) {
        void saveDesktopActiveDate(todayLabel)
      }

      if (isFreshDay) {
        saveQuestOverrides([])
        saveTomorrowDraft(null)
        saveArchivedPlans(activated.activeArchivedPlans)
        if (isDesktopRuntime()) {
          void saveDesktopQuests([])
          void saveDesktopTomorrowDraft(null)
          void saveDesktopArchivedPlans(activated.activeArchivedPlans)
        }
      }

      if (activated.promoted) {
        saveQuestOverrides(quests)
        saveTomorrowDraft(null)
        saveArchivedPlans(activated.activeArchivedPlans)
        if (isDesktopRuntime()) {
          void saveDesktopQuests(quests)
          void saveDesktopTomorrowDraft(null)
          void saveDesktopArchivedPlans(activated.activeArchivedPlans)
        }
      }

      saveGrowthOverrides(growthRecords)
      saveUserProfileOverride(userProfile)
      if (isDesktopRuntime()) {
        void saveDesktopGrowthRecords(growthRecords)
        void saveDesktopUserProfile(userProfile)
      }
      setTomorrowDraftState(activated.activeTomorrowDraft)
      setArchivedPlans(activated.activeArchivedPlans)

      setDashboard({
        ...data,
        roleName: userProfile.roleName,
        level: userProfile.level,
        xp: userProfile.xp,
        xpToNext: userProfile.xpToNext,
        stats,
        quests,
        growthRecords,
        currentStreak: calculateCurrentStreak(growthRecords),
      })
    } catch {
      const data = await getDashboardData()
      const storedActiveDate = loadActiveDate()
      const isFreshDay = !storedActiveDate || storedActiveDate !== todayLabel
      const savedQuests = loadQuestOverrides()
      const rolledArchivedPlans = archivePreviousDayIfNeeded(
        storedActiveDate,
        todayLabel,
        savedQuests,
        loadArchivedPlans() ?? [],
      )
      const questOverrides = isFreshDay ? null : savedQuests
      const quests = questOverrides && questOverrides.length > 0 ? questOverrides : data.quests
      const growthOverrides = loadGrowthOverrides()
      const archivedPlans = rolledArchivedPlans
      const stats = applyAbilityProgress(data.stats, quests, archivedPlans)
      const userProfile = buildPersistedProfile(
        loadUserProfileOverride() ?? {
          roleName: data.roleName,
          level: data.level,
          xp: data.xp,
          xpToNext: data.xpToNext,
          aiEngineering: 0,
          cognitive: 0,
          language: 0,
          aesthetic: 0,
        },
        stats,
        quests,
        archivedPlans,
      )
      const growthRecords = upsertGrowthRecord(
        growthOverrides && growthOverrides.length > 0
          ? growthOverrides
          : data.growthRecords,
        quests,
      )

      setTomorrowDraftState(isFreshDay ? null : loadTomorrowDraft())
      setArchivedPlans(archivedPlans)
      saveActiveDate(todayLabel)
      saveArchivedPlans(archivedPlans)
      saveUserProfileOverride(userProfile)
      setDashboard({
        ...data,
        roleName: userProfile.roleName,
        level: userProfile.level,
        xp: userProfile.xp,
        xpToNext: userProfile.xpToNext,
        stats,
        quests,
        growthRecords,
        currentStreak: calculateCurrentStreak(growthRecords),
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  function updateQuests(quests: EditableQuest[]) {
    setDashboard((current) => {
      if (!current) {
        return current
      }

      const growthRecords = upsertGrowthRecord(current.growthRecords, quests)
      const stats = applyAbilityProgress(current.stats, quests, archivedPlans)
      const userProfile = buildPersistedProfile(
        {
          roleName: current.roleName,
          level: current.level,
          xp: current.xp,
          xpToNext: current.xpToNext,
          aiEngineering: 0,
          cognitive: 0,
          language: 0,
          aesthetic: 0,
        },
        stats,
        quests,
        archivedPlans,
      )
      saveQuestOverrides(quests)
      saveGrowthOverrides(growthRecords)
      saveUserProfileOverride(userProfile)
      if (isDesktopRuntime()) {
        void saveDesktopQuests(quests)
        void saveDesktopGrowthRecords(growthRecords)
        void saveDesktopUserProfile(userProfile)
      }

      return {
        ...current,
        level: userProfile.level,
        xp: userProfile.xp,
        xpToNext: userProfile.xpToNext,
        stats,
        quests,
        growthRecords,
        currentStreak: calculateCurrentStreak(growthRecords),
      }
    })
  }

  function updateTomorrowDraft(draft: TomorrowPlanDraft | null) {
    setTomorrowDraftState(draft)
    saveTomorrowDraft(draft)
    if (isDesktopRuntime()) {
      void saveDesktopTomorrowDraft(draft)
    }
  }

  function archiveCurrentPlan(source: ArchivedPlan['source']) {
    setDashboard((current) => {
      if (!current || current.quests.length === 0) {
        return current
      }

      setArchivedPlans((existingPlans) => {
        const nextPlans = [
          {
            date: todayLabel,
            quests: current.quests,
            source,
          },
          ...existingPlans.filter((plan) => plan.date !== todayLabel),
        ].slice(0, 10)

        saveArchivedPlans(nextPlans)
        if (isDesktopRuntime()) {
          void saveDesktopArchivedPlans(nextPlans)
        }
        return nextPlans
      })

      return current
    })
  }

  function exportQuests() {
    if (!dashboard) {
      return
    }

    downloadSnapshot(dashboard.quests)
  }

  async function importQuests(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const importedQuests = await readImportedQuests(file)
    event.target.value = ''

    if (!importedQuests || importedQuests.length === 0) {
      return
    }

    updateQuests(importedQuests)
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const completedQuestCount =
    dashboard?.quests.filter((quest) => quest.completed).length ?? 0
  const completedXp =
    dashboard?.quests
      .filter((quest) => quest.completed)
      .reduce((sum, quest) => sum + quest.xp, 0) ?? 0

  const weeklyReport = useMemo(() => {
    if (!dashboard) {
      return null
    }

    return buildWeeklyReport(
      dashboard,
      dashboard.quests,
      completedQuestCount,
      completedXp,
    )
  }, [dashboard, completedQuestCount, completedXp])

  function exportWeeklyReport() {
    if (!dashboard || !weeklyReport) {
      return
    }

    const markdown = buildWeeklyReportMarkdown(
      dashboard,
      weeklyReport,
      dashboard.quests,
      completedQuestCount,
      completedXp,
    )

    downloadText(
      `life-rpg-ai-weekly-report-${weeklyReport.weekLabel}.md`,
      markdown,
      'text/markdown;charset=utf-8',
    )
  }

  return {
    dashboard: dashboard
      ? {
          ...dashboard,
          weeklyReport: weeklyReport ?? dashboard.weeklyReport,
        }
      : null,
    isRefreshing,
    refreshDashboard: loadDashboard,
    updateQuests,
    exportQuests,
    importQuests,
    exportWeeklyReport,
    completedQuestCount,
    completedXp,
    todayLabel,
    tomorrowDraft,
    updateTomorrowDraft,
    archivedPlans,
    archiveCurrentPlan,
    storageSnapshot: {
      todayQuests: dashboard?.quests ?? [],
      tomorrowDraft,
    } satisfies DashboardStorageSnapshot,
  }
}
