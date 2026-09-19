import type { ArchivedPlan, DashboardData, EditableQuest } from '../types'
import type { PersistedUserProfile, UserProfileRow } from '../types/storage'

type AbilityKey = 'AI Engineering' | 'Cognitive' | 'Language' | 'Aesthetic'

const ABILITY_CAP = 100
const XP_PER_LEVEL = 1000
const COINS_PER_ABILITY_POINT = 10

const abilityKeywords: Record<AbilityKey, string[]> = {
  'AI Engineering': [
    'ai',
    'agent',
    'python',
    'api',
    'prompt',
    'mcp',
    'rag',
    'memory',
    'demo',
    'tool',
    'tools',
    'automation',
    'code',
    'coding',
    'programming',
    '模型',
    '智能体',
    '编程',
    '代码',
    '开发',
    '接口',
    '自动化',
  ],
  Cognitive: [
    '底层逻辑',
    '认知',
    '思维',
    '逻辑',
    '复盘',
    '总结',
    '阅读',
    '读书',
    'book',
    'books',
    'method',
    'reflection',
  ],
  Language: [
    'english',
    'ted',
    'bbc',
    'voa',
    'cet',
    'word',
    'words',
    'vocabulary',
    'reading',
    'listening',
    'speaking',
    '英语',
    '单词',
    '跟读',
    '演讲',
    '短文',
    '阅读训练',
    '四级',
  ],
  Aesthetic: [
    'design',
    'style',
    'visual',
    'aesthetic',
    '审美',
    '风格',
    '穿搭',
    '化妆',
    '视觉',
    '表达',
  ],
}

function normalizeQuestText(quest: EditableQuest) {
  return `${quest.type} ${quest.title} ${quest.note}`.toLowerCase()
}

function resolveAbilityKey(quest: EditableQuest): AbilityKey | null {
  const haystack = normalizeQuestText(quest)

  for (const [abilityKey, keywords] of Object.entries(abilityKeywords) as Array<
    [AbilityKey, string[]]
  >) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return abilityKey
    }
  }

  return null
}

export function collectUniqueCompletedQuests(
  todayQuests: EditableQuest[],
  archivedPlans: ArchivedPlan[],
) {
  const questMap = new Map<string, EditableQuest>()

  for (const quest of todayQuests) {
    if (quest.completed) {
      questMap.set(quest.id, quest)
    }
  }

  for (const plan of archivedPlans) {
    for (const quest of plan.quests) {
      if (quest.completed && !questMap.has(quest.id)) {
        questMap.set(quest.id, quest)
      }
    }
  }

  return [...questMap.values()]
}

export function applyAbilityProgress(
  stats: DashboardData['stats'],
  todayQuests: EditableQuest[],
  archivedPlans: ArchivedPlan[],
) {
  const nextStats = stats.map((stat) => ({ ...stat }))
  const completedQuests = collectUniqueCompletedQuests(todayQuests, archivedPlans)
  const abilityPoints: Record<AbilityKey, number> = {
    'AI Engineering': 0,
    Cognitive: 0,
    Language: 0,
    Aesthetic: 0,
  }

  for (const quest of completedQuests) {
    const abilityKey = resolveAbilityKey(quest)
    if (!abilityKey) {
      continue
    }

    abilityPoints[abilityKey] += Math.floor(quest.xp / COINS_PER_ABILITY_POINT)
  }

  return nextStats.map((stat) => {
    const abilityKey = stat.label as AbilityKey
    if (!(abilityKey in abilityPoints)) {
      return stat
    }

    return {
      ...stat,
      value: Math.min(ABILITY_CAP, abilityPoints[abilityKey]),
    }
  })
}

export function buildPersistedProfile(
  baseProfile: UserProfileRow,
  stats: DashboardData['stats'],
  todayQuests: EditableQuest[],
  archivedPlans: ArchivedPlan[],
): PersistedUserProfile {
  const completedQuests = collectUniqueCompletedQuests(todayQuests, archivedPlans)
  const xp = completedQuests.reduce((sum, quest) => sum + quest.xp, 0)
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const xpToNext = level * XP_PER_LEVEL

  return {
    roleName: baseProfile.roleName,
    level,
    xp,
    xpToNext,
    aiEngineering:
      stats.find((stat) => stat.label === 'AI Engineering')?.value ?? 0,
    cognitive: stats.find((stat) => stat.label === 'Cognitive')?.value ?? 0,
    language: stats.find((stat) => stat.label === 'Language')?.value ?? 0,
    aesthetic: stats.find((stat) => stat.label === 'Aesthetic')?.value ?? 0,
  }
}
