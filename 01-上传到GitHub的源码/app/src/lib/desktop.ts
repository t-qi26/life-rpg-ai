import { invoke } from '@tauri-apps/api/core'
import type {
  ArchivedPlan,
  DashboardData,
  EditableQuest,
  PhotoArchiveRecord,
  TomorrowPlanDraft,
} from '../types'
import type { PersistedUserProfile } from '../types/storage'

export type MeosDesktopPaths = {
  root: string
  database: string
  photos: string
  reports: string
  config: string
  logs: string
}

export function isDesktopRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function ensureDesktopMeosReady() {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('ensure_meos_ready')
}

export async function getDesktopMeosPaths() {
  if (!isDesktopRuntime()) {
    return null
  }

  return invoke<MeosDesktopPaths>('get_meos_paths')
}

export async function loadDesktopDeepseekKey() {
  if (!isDesktopRuntime()) {
    return null
  }

  return invoke<string>('load_deepseek_key')
}

export async function saveDesktopDeepseekKey(value: string) {
  if (!isDesktopRuntime()) {
    return { saved: false }
  }

  return invoke<{ saved: boolean }>('save_deepseek_key', { value })
}

export type DesktopAppState = {
  activeDate: string | null
  userProfile: PersistedUserProfile | null
  quests: EditableQuest[]
  growthRecords: DashboardData['growthRecords']
  tomorrowDraft: TomorrowPlanDraft | null
  archivedPlans: ArchivedPlan[]
  photoArchive: PhotoArchiveRecord[]
  deepseekKeyPresent: boolean
}

export async function loadDesktopAppState() {
  if (!isDesktopRuntime()) {
    return null
  }

  return invoke<DesktopAppState>('load_app_state')
}

export async function saveDesktopQuests(quests: EditableQuest[]) {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('save_quests', { quests })
}

export async function saveDesktopGrowthRecords(
  growthRecords: DashboardData['growthRecords'],
) {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('save_growth_records', { records: growthRecords })
}

export async function saveDesktopUserProfile(profile: PersistedUserProfile) {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('save_user_profile', { profile })
}

export async function saveDesktopTomorrowDraft(draft: TomorrowPlanDraft | null) {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('save_tomorrow_draft', { draft })
}

export async function saveDesktopArchivedPlans(plans: ArchivedPlan[]) {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('save_archived_plans', { plans })
}

export async function saveDesktopPhotoArchive(records: PhotoArchiveRecord[]) {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('save_photo_archive', { records })
}

export async function saveDesktopActiveDate(value: string) {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('save_active_date', { value })
}

export async function resetDesktopMeosData() {
  if (!isDesktopRuntime()) {
    return { ready: false }
  }

  return invoke<{ ready: boolean }>('reset_meos_data')
}
