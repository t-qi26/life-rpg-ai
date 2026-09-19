import type { EditableQuest, MentorSections } from '../types'

const SECTION_TITLES = {
  status: '【状态分析】',
  problem: '【问题判断】',
  adjustment: '【调整方案】',
  today: '【今天建议】',
} as const

function getSection(text: string, start: string, end?: string) {
  const startIndex = text.indexOf(start)
  if (startIndex === -1) {
    return ''
  }

  const contentStart = startIndex + start.length
  const contentEnd = end ? text.indexOf(end, contentStart) : text.length
  return text.slice(contentStart, contentEnd === -1 ? text.length : contentEnd).trim()
}

function splitPlanItems(section: string) {
  return section
    .split(/\n+/)
    .flatMap((line) => line.split(/(?=\d+\.)/))
    .map((item) => item.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
}

export function parseMentorResponse(text: string): MentorSections {
  const statusAnalysis = getSection(
    text,
    SECTION_TITLES.status,
    SECTION_TITLES.problem,
  )
  const problemJudgment = getSection(
    text,
    SECTION_TITLES.problem,
    SECTION_TITLES.adjustment,
  )
  const adjustmentRaw = getSection(
    text,
    SECTION_TITLES.adjustment,
    SECTION_TITLES.today,
  )
  const todaySuggestion = getSection(text, SECTION_TITLES.today)

  return {
    statusAnalysis,
    problemJudgment,
    adjustmentPlan: splitPlanItems(adjustmentRaw),
    todaySuggestion,
  }
}

function inferQuestType(text: string) {
  if (text.includes('挑战') || text.includes('实验') || text.includes('Demo')) {
    return '挑战'
  }

  if (text.includes('主线') || text.includes('核心')) {
    return '主线'
  }

  return '支线'
}

function inferDuration(text: string) {
  const match = text.match(/(\d+)\s*(分钟|小时)/)
  if (match) {
    return `${match[1]} ${match[2]}`
  }

  if (text.includes('跟读 1 篇 3 分钟短文')) {
    return '15 分钟'
  }

  return '30 分钟'
}

export function buildTomorrowQuestsFromMentor(
  sections: MentorSections,
  existingQuests: EditableQuest[],
) {
  const sourceItems =
    sections.adjustmentPlan.length > 0
      ? sections.adjustmentPlan
      : sections.todaySuggestion
        ? [sections.todaySuggestion]
        : []

  return sourceItems.slice(0, 4).map((item, index) => {
    const existing = existingQuests[index]

    return {
      id: `mentor-${Date.now()}-${index}`,
      type: inferQuestType(item),
      title: item.slice(0, 28),
      duration: inferDuration(item),
      xp: existing?.xp ?? (index === 0 ? 80 : 40),
      note: item,
      completed: false,
    }
  })
}
