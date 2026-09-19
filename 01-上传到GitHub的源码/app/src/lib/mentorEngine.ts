import type { DashboardData, EditableQuest, MentorDecision } from '../types'

function pickPrimaryIncomplete(quests: EditableQuest[]) {
  return (
    quests.find((quest) => !quest.completed && quest.type === '主线') ??
    quests.find((quest) => !quest.completed && quest.type === '挑战') ??
    quests.find((quest) => !quest.completed)
  )
}

export function buildMentorDecision(
  _dashboard: DashboardData,
  quests: EditableQuest[],
  completedCount: number,
  earnedCoins: number,
): MentorDecision {
  const totalCount = quests.length
  const executionRate =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const primaryIncomplete = pickPrimaryIncomplete(quests)

  if (totalCount === 0) {
    return {
      headline: '今天还没有开始，先创建第一条真实任务。',
      executionRate: 0,
      completedCount: 0,
      totalCount: 0,
      earnedCoins: 0,
      issue: '当前没有可分析的执行数据，所以不能假装给出你的成长判断。',
      adjustment: '先在今日任务里添加一条最小可执行任务，例如 30 分钟阅读或一个小实验。',
      reason: 'AI 的调整应该建立在真实执行之上，而不是演示数据之上。',
      tomorrowFocus: '先完成今天的第一条真实任务。',
    }
  }

  if (executionRate >= 100) {
    return {
      headline: '今天的关键任务已经清空。',
      executionRate,
      completedCount,
      totalCount,
      earnedCoins,
      issue: '当前不是执行问题，而是需要把完成内容沉淀成可复用成果。',
      adjustment: '明天减少重复输入，优先整理今天的 Demo、笔记或流程。',
      reason: '你已经完成今天计划，下一步最有价值的是让成果留下来。',
      tomorrowFocus: '把已完成任务整理成模板或作品。',
    }
  }

  if (executionRate >= 50) {
    return {
      headline: '执行状态稳定，可以开始微调结构。',
      executionRate,
      completedCount,
      totalCount,
      earnedCoins,
      issue: '你能推进任务，但剩余任务可能过散，容易把注意力切碎。',
      adjustment: primaryIncomplete
        ? `明天保留一个主目标，优先完成“${primaryIncomplete.title}”，其余任务缩成辅助动作。`
        : '明天继续保持一主两辅的节奏，避免临时加任务。',
      reason: '当完成率过半时，问题通常不在动力，而在任务结构和切换成本。',
      tomorrowFocus: primaryIncomplete
        ? `先完成 ${primaryIncomplete.title}`
        : '继续保持当前推进节奏',
    }
  }

  return {
    headline: '今天更适合收缩任务，而不是继续加码。',
    executionRate,
    completedCount,
    totalCount,
    earnedCoins,
    issue: '当前完成率偏低，说明任务设计可能超过了今天的真实可执行容量。',
    adjustment: primaryIncomplete
      ? `把“${primaryIncomplete.title}”拆成一个 45 到 90 分钟的最小行动，先拿下一个确定完成。`
      : '先把明天任务减少到 2 到 3 个，并给每个任务设定更短时间块。',
    reason: '低完成率通常不是失败，而是任务体积过大、反馈过慢，导致启动成本太高。',
    tomorrowFocus: primaryIncomplete
      ? `只盯住 ${primaryIncomplete.title} 的最小版本`
      : '先降低任务数量，再恢复节奏',
  }
}
