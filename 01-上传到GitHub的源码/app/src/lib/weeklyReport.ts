import type { DashboardData, EditableQuest } from '../types'

const WEEK_LABEL = '2026-W31'

function completionRate(quests: EditableQuest[]) {
  if (quests.length === 0) {
    return 0
  }

  const completed = quests.filter((quest) => quest.completed).length
  return Math.round((completed / quests.length) * 100)
}

function deriveFocus(quests: EditableQuest[]) {
  const incomplete = quests.filter((quest) => !quest.completed)
  if (incomplete.length === 0) {
    return '下周重点：保持节奏，并把已完成任务沉淀成一个可复用模板。'
  }

  const first = incomplete[0]
  return `下周重点：优先补完“${first.title}”，避免关键任务长期停留在计划状态。`
}

function deriveGains(
  quests: EditableQuest[],
  completedXp: number,
  completedCount: number,
) {
  const gains: string[] = []

  if (completedCount > 0) {
    gains.push(`完成 ${completedCount} 个任务，累计获得 ${completedXp} 金币`)
  }

  const completedTitles = quests
    .filter((quest) => quest.completed)
    .slice(0, 2)
    .map((quest) => `完成 ${quest.title}`)
  gains.push(...completedTitles)

  if (gains.length === 0) {
    gains.push('本周已建立任务清单，下一步重点是把计划转成实际完成。')
  }

  return gains
}

export function buildWeeklyReport(
  dashboard: DashboardData,
  quests: EditableQuest[],
  completedQuestCount: number,
  completedXp: number,
): DashboardData['weeklyReport'] {
  const rate = completionRate(quests)
  const currentLevelXp = dashboard.xp + completedXp
  const nextLevelHint =
    currentLevelXp >= dashboard.xpToNext
      ? `Lv.${dashboard.level} 已达到升级阈值`
      : `Lv.${dashboard.level} 持续推进中`

  return {
    weekLabel: WEEK_LABEL,
    levelProgress: `${nextLevelHint}，当前任务完成率 ${rate}%`,
    gains: deriveGains(quests, completedXp, completedQuestCount),
    focus: deriveFocus(quests),
  }
}

export function buildWeeklyReportMarkdown(
  dashboard: DashboardData,
  report: DashboardData['weeklyReport'],
  quests: EditableQuest[],
  completedQuestCount: number,
  completedXp: number,
) {
  const completed = quests.filter((quest) => quest.completed)
  const pending = quests.filter((quest) => !quest.completed)

  const completedLines =
    completed.length > 0
      ? completed.map((quest) => `- ${quest.title} | ${quest.xp} 金币`).join('\n')
      : '- 本周暂无已完成任务'

  const pendingLines =
    pending.length > 0
      ? pending.map((quest) => `- ${quest.title} | ${quest.duration}`).join('\n')
      : '- 当前任务已全部完成'

  return `# ${report.weekLabel} Life RPG AI 周报

角色：${dashboard.roleName} Lv.${dashboard.level}
本周新增金币：${completedXp}
已完成任务数：${completedQuestCount}

## 等级进展
${report.levelProgress}

## 本周收获
${report.gains.map((gain) => `- ${gain}`).join('\n')}

## 已完成任务
${completedLines}

## 待推进任务
${pendingLines}

## 下周重点
${report.focus}
`
}
