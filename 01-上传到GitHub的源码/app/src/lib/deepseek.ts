type MentorAnalysisRequest = {
  apiKey: string
  userPrompt: string
  summary: {
    completedQuestCount: number
    totalQuestCount: number
    completedCoins: number
    currentStreak: number
    weeklyFocus: string
    completedTitles: string[]
    pendingTitles: string[]
  }
}

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

export async function requestMentorAnalysis({
  apiKey,
  userPrompt,
  summary,
}: MentorAnalysisRequest) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      thinking: {
        type: 'disabled',
      },
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content:
            '你是 Life RPG AI 的成长导师。请用简洁中文输出，结构固定为：【状态分析】【问题判断】【调整方案】【今天建议】。不要空泛鼓励，要具体、务实。',
        },
        {
          role: 'user',
          content: `用户额外要求：${userPrompt}

今日完成任务：${summary.completedQuestCount}/${summary.totalQuestCount}
今日获得金币：${summary.completedCoins}
连续成长天数：${summary.currentStreak}
本周重点：${summary.weeklyFocus}
已完成任务：${summary.completedTitles.join('、') || '暂无'}
待推进任务：${summary.pendingTitles.join('、') || '暂无'}

请直接给出今天的成长建议。`,
        },
      ],
    }),
  })

  const data = (await response.json()) as DeepSeekResponse

  if (!response.ok) {
    throw new Error(data.error?.message || `请求失败 (${response.status})`)
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('DeepSeek 没有返回有效内容。')
  }

  return content
}
