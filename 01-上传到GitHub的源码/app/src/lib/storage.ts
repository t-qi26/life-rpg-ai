import type {
  ArchivedPlan,
  DashboardData,
  EditableQuest,
  PhotoArchiveRecord,
  TomorrowPlanDraft,
} from '../types'
import type { PersistedUserProfile } from '../types/storage'

export const STORAGE_KEYS = {
  activeDate: 'life-rpg-ai-active-date',
  deepseekKey: 'life-rpg-ai-deepseek-key',
  quests: 'life-rpg-ai-local-quests',
  tomorrowDraft: 'life-rpg-ai-tomorrow-draft',
  archivedPlans: 'life-rpg-ai-archived-plans',
  growthRecords: 'life-rpg-ai-growth-records',
  userProfile: 'life-rpg-ai-user-profile',
  photoArchive: 'life-rpg-ai-photo-archive',
} as const

export const MEOS_PATHS = {
  root: 'C:\\meos',
  database: 'C:\\meos\\database\\LifeRPG.db',
  photos: 'C:\\meos\\photos',
  reports: 'C:\\meos\\reports',
  config: 'C:\\meos\\config',
  logs: 'C:\\meos\\logs\\app.log',
} as const

type StorageArea = 'browser-local' | 'desktop-meos'

export type StorageStatusItem = {
  id: string
  label: string
  area: StorageArea
  currentPath: string
  targetPath: string
  coverage: string
  itemCount: number
}

export type PrototypeExportBundle = {
  exportedAt: string
  source: 'browser-local-prototype'
  userProfile: {
    roleName: string
    level: number
    xp: number
    xpToNext: number
  }
  quests: EditableQuest[]
  tomorrowDraft: TomorrowPlanDraft | null
  archivedPlans: ArchivedPlan[]
  growthRecords: DashboardData['growthRecords']
  photoArchive: PhotoArchiveRecord[]
  hasDeepseekKey: boolean
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function removeKey(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}

export function loadDeepseekKey() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(STORAGE_KEYS.deepseekKey) ?? ''
}

export function loadActiveDate() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(STORAGE_KEYS.activeDate) ?? ''
}

export function saveActiveDate(value: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.activeDate, value)
}

export function saveDeepseekKey(value: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.deepseekKey, value)
}

export function clearDeepseekKey() {
  removeKey(STORAGE_KEYS.deepseekKey)
}

export function loadQuestOverrides() {
  return readJson<EditableQuest[] | null>(STORAGE_KEYS.quests, null)
}

export function saveQuestOverrides(quests: EditableQuest[]) {
  writeJson(STORAGE_KEYS.quests, quests)
}

export function loadTomorrowDraft() {
  return readJson<TomorrowPlanDraft | null>(STORAGE_KEYS.tomorrowDraft, null)
}

export function saveTomorrowDraft(draft: TomorrowPlanDraft | null) {
  if (!draft) {
    removeKey(STORAGE_KEYS.tomorrowDraft)
    return
  }

  writeJson(STORAGE_KEYS.tomorrowDraft, draft)
}

export function loadArchivedPlans() {
  return readJson<ArchivedPlan[] | null>(STORAGE_KEYS.archivedPlans, null)
}

export function saveArchivedPlans(plans: ArchivedPlan[]) {
  writeJson(STORAGE_KEYS.archivedPlans, plans)
}

export function loadGrowthOverrides() {
  return readJson<DashboardData['growthRecords'] | null>(
    STORAGE_KEYS.growthRecords,
    null,
  )
}

export function saveGrowthOverrides(records: DashboardData['growthRecords']) {
  writeJson(STORAGE_KEYS.growthRecords, records)
}

export function loadUserProfileOverride() {
  return readJson<PersistedUserProfile | null>(STORAGE_KEYS.userProfile, null)
}

export function saveUserProfileOverride(profile: PersistedUserProfile) {
  writeJson(STORAGE_KEYS.userProfile, profile)
}

export function loadPhotoArchive() {
  return readJson<PhotoArchiveRecord[]>(STORAGE_KEYS.photoArchive, [])
}

export function savePhotoArchive(records: PhotoArchiveRecord[]) {
  writeJson(STORAGE_KEYS.photoArchive, records)
}

export function clearAllPrototypeStorage() {
  removeKey(STORAGE_KEYS.activeDate)
  removeKey(STORAGE_KEYS.deepseekKey)
  removeKey(STORAGE_KEYS.quests)
  removeKey(STORAGE_KEYS.tomorrowDraft)
  removeKey(STORAGE_KEYS.archivedPlans)
  removeKey(STORAGE_KEYS.growthRecords)
  removeKey(STORAGE_KEYS.userProfile)
  removeKey(STORAGE_KEYS.photoArchive)
}

export function buildStorageStatus(summary: {
  questCount: number
  tomorrowDraftCount: number
  archivedPlanCount: number
  growthRecordCount: number
  photoCount: number
  hasDeepseekKey: boolean
}) {
  return [
    {
      id: 'tasks',
      label: '任务与计划',
      area: 'browser-local',
      currentPath: 'Browser localStorage',
      targetPath: MEOS_PATHS.database,
      coverage: '今日任务、明日草案、历史计划',
      itemCount:
        summary.questCount + summary.tomorrowDraftCount + summary.archivedPlanCount,
    },
    {
      id: 'growth',
      label: '成长记录',
      area: 'browser-local',
      currentPath: 'Browser localStorage',
      targetPath: MEOS_PATHS.database,
      coverage: '连续成长、金币统计、成长曲线',
      itemCount: summary.growthRecordCount,
    },
    {
      id: 'photos',
      label: '人生档案',
      area: 'browser-local',
      currentPath: 'Browser localStorage',
      targetPath: MEOS_PATHS.photos,
      coverage: '图片时间线、分类、备注',
      itemCount: summary.photoCount,
    },
    {
      id: 'config',
      label: 'AI 配置',
      area: 'browser-local',
      currentPath: 'Browser localStorage',
      targetPath: `${MEOS_PATHS.config}\\encrypted_key.dat`,
      coverage: 'DeepSeek Key 与设置项',
      itemCount: summary.hasDeepseekKey ? 1 : 0,
    },
  ] satisfies StorageStatusItem[]
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

export function exportPrototypeBundle(bundle: PrototypeExportBundle) {
  downloadText(
    `life-rpg-ai-prototype-export-${bundle.exportedAt.slice(0, 10)}.json`,
    JSON.stringify(bundle, null, 2),
    'application/json;charset=utf-8',
  )
}
