import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import './App.css'
import { GrowthPanel } from './components/GrowthPanel'
import { HeroPanel } from './components/HeroPanel'
import { MentorPanel } from './components/MentorPanel'
import { QuestPanel } from './components/QuestPanel'
import { SlideNav } from './components/SlideNav'
import { StatsPanel } from './components/StatsPanel'
import { TopBar } from './components/TopBar'
import { useDashboard } from './hooks/useDashboard'
import {
  ensureDesktopMeosReady,
  isDesktopRuntime,
  loadDesktopDeepseekKey,
  resetDesktopMeosData,
  saveDesktopDeepseekKey,
  saveDesktopPhotoArchive,
} from './lib/desktop'
import { requestMentorAnalysis } from './lib/deepseek'
import { formatLongDate } from './lib/date'
import { nextDateLabel } from './lib/growthRecords'
import { buildMentorDecision } from './lib/mentorEngine'
import { parseMentorResponse, buildTomorrowQuestsFromMentor } from './lib/mentorResponse'
import {
  buildStorageStatus,
  clearAllPrototypeStorage,
  clearDeepseekKey,
  exportPrototypeBundle,
  loadDeepseekKey,
  loadPhotoArchive,
  MEOS_PATHS,
  saveDeepseekKey,
  savePhotoArchive,
} from './lib/storage'
import type { EditableQuest } from './types'
import type { PhotoArchiveRecord } from './types'

type PageKey =
  | 'overview'
  | 'tasks'
  | 'mentor'
  | 'records'
  | 'weekly'
  | 'archive'
  | 'settings'

const pageTitles: Record<PageKey, string> = {
  overview: '总览',
  tasks: '今日任务',
  mentor: 'AI导师',
  records: '学习记录',
  weekly: '周报',
  archive: '人生档案',
  settings: '设置',
}

function maskApiKey(key: string) {
  if (!key) {
    return '未保存'
  }

  if (key.length <= 10) {
    return '已保存'
  }

  return `${key.slice(0, 5)}*****${key.slice(-4)}`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('overview')
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [mentorAction, setMentorAction] = useState<'idle' | 'accepted' | 'later'>(
    'idle',
  )
  const [showReason, setShowReason] = useState(false)
  const [deepseekKey, setDeepseekKey] = useState(() => loadDeepseekKey())
  const [keyDraft, setKeyDraft] = useState('')
  const [settingsMessage, setSettingsMessage] = useState(
    deepseekKey ? '当前已保存 DeepSeek Key。' : '当前还没有保存 DeepSeek Key。',
  )
  const [mentorPrompt, setMentorPrompt] = useState(
    '请根据我今天的完成情况，给我一个务实的调整建议。',
  )
  const [mentorAiReply, setMentorAiReply] = useState('')
  const [mentorAiStatus, setMentorAiStatus] = useState(
    '保存好 Key 后，就可以发起真实 AI 分析。',
  )
  const [applyStatus, setApplyStatus] = useState('')
  const [isMentorLoading, setIsMentorLoading] = useState(false)
  const [photoArchive, setPhotoArchive] = useState<PhotoArchiveRecord[]>(() =>
    loadPhotoArchive(),
  )
  const [archiveDraft, setArchiveDraft] = useState({
    category: '学习' as PhotoArchiveRecord['category'],
    title: '',
    note: '',
  })
  const [archiveStatus, setArchiveStatus] = useState(
    '上传 JPG / PNG / WEBP 后，会自动记录当前时间并保存到本地。',
  )

  const dashboardState = useDashboard()
  const dashboard = dashboardState.dashboard as any
  const mentorDecision = useMemo(() => {
    if (!dashboard) {
      return null
    }

    return buildMentorDecision(
      dashboard,
      dashboard.quests,
      dashboardState.completedQuestCount,
      dashboardState.completedXp,
    )
  }, [dashboard, dashboardState.completedQuestCount, dashboardState.completedXp]) as any

  useEffect(() => {
    async function bootstrapDesktop() {
      if (!isDesktopRuntime()) {
        return
      }

      await ensureDesktopMeosReady()
      const desktopKey = await loadDesktopDeepseekKey()
      if (desktopKey) {
        setDeepseekKey(desktopKey)
        setSettingsMessage('当前已连接桌面存储，DeepSeek Key 来自 C:\\meos\\config。')
      } else {
        setSettingsMessage('当前运行在桌面模式，但还没有保存 DeepSeek Key。')
      }
    }

    void bootstrapDesktop()
  }, [])

  if (!dashboard || !mentorDecision) {
    return (
      <main className="app-shell">
        <section className="hero-copy loading-panel">
          <p className="eyebrow">Life RPG AI</p>
          <h1>正在加载成长面板</h1>
          <p className="hero-text">正在准备今天的任务、导师建议和成长数据。</p>
        </section>
      </main>
    )
  }

  const {
    isRefreshing,
    refreshDashboard,
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
  } = dashboardState

  const recentRecord = dashboard.growthRecords[dashboard.growthRecords.length - 1] ?? null
  const completedTitles = dashboard.quests
    .filter((quest: EditableQuest) => quest.completed)
    .map((quest: EditableQuest) => quest.title)
  const pendingTitles = dashboard.quests
    .filter((quest: EditableQuest) => !quest.completed)
    .map((quest: EditableQuest) => quest.title)
  const mentorSections = mentorAiReply ? parseMentorResponse(mentorAiReply) : null
  const todayLongLabel = formatLongDate()
  const learningRecords = (
    dashboard.quests.some((quest: EditableQuest) => quest.completed)
      ? dashboard.quests.filter((quest: EditableQuest) => quest.completed)
      : dashboard.quests
  ).map((quest: EditableQuest) => ({
    id: quest.id,
    title: quest.title,
    duration: quest.duration,
    status: quest.completed ? '已完成' : '待推进',
    coins: quest.xp,
  }))

  const storageStatus = buildStorageStatus({
    questCount: dashboard.quests.length,
    tomorrowDraftCount: tomorrowDraft ? tomorrowDraft.quests.length : 0,
    archivedPlanCount: archivedPlans.length,
    growthRecordCount: dashboard.growthRecords.length,
    photoCount: photoArchive.length,
    hasDeepseekKey: Boolean(deepseekKey),
  })

  function handleSaveKey() {
    const trimmed = keyDraft.trim()
    if (!trimmed) {
      setSettingsMessage('请输入 DeepSeek API Key 后再保存。')
      return
    }

    saveDeepseekKey(trimmed)
    if (isDesktopRuntime()) {
      void saveDesktopDeepseekKey(trimmed)
    }
    setDeepseekKey(trimmed)
    setKeyDraft('')
    setSettingsMessage(
      isDesktopRuntime()
        ? 'DeepSeek Key 已保存，桌面版接通后会同步进入 C:\\meos\\config。'
        : 'DeepSeek Key 已保存到当前浏览器本地。',
    )
    setMentorAiStatus('Key 已就绪，现在可以去 AI 导师页面发起真实分析。')
  }

  function handleClearKey() {
    clearDeepseekKey()
    if (isDesktopRuntime()) {
      void saveDesktopDeepseekKey('')
    }
    setDeepseekKey('')
    setKeyDraft('')
    setMentorAiReply('')
    setApplyStatus('')
    updateTomorrowDraft(null)
    setSettingsMessage('已清除当前保存的 DeepSeek Key。')
    setMentorAiStatus('请先在设置页重新保存 Key。')
  }

  async function handleRunMentorAnalysis() {
    if (!deepseekKey) {
      setMentorAiStatus('请先到设置页保存 DeepSeek API Key。')
      return
    }

    setIsMentorLoading(true)
    setApplyStatus('')
    updateTomorrowDraft(null)
    setMentorAiStatus('正在请求 DeepSeek 分析...')

    try {
      const reply = await requestMentorAnalysis({
        apiKey: deepseekKey,
        userPrompt: mentorPrompt,
        summary: {
          completedQuestCount,
          totalQuestCount: dashboard.quests.length,
          completedCoins: completedXp,
          currentStreak: dashboard.currentStreak,
          weeklyFocus: dashboard.weeklyReport.focus,
          completedTitles,
          pendingTitles,
        },
      })

      setMentorAiReply(reply)
      setMentorAiStatus('DeepSeek 分析已返回。')
    } catch (error) {
      const message = error instanceof Error ? error.message : '调用失败，请稍后再试。'
      setMentorAiStatus(`调用失败：${message}`)
    } finally {
      setIsMentorLoading(false)
    }
  }

  function handleCreateTomorrowDraft() {
    if (!mentorSections) {
      setApplyStatus('还没有可采纳的 AI 计划。')
      return
    }

    const nextQuests = buildTomorrowQuestsFromMentor(mentorSections, dashboard.quests)
    if (nextQuests.length === 0) {
      setApplyStatus('AI 返回结果里暂时没有可落地的任务项。')
      return
    }

    updateTomorrowDraft({
      createdAt: nextDateLabel(todayLabel),
      quests: nextQuests,
    })
    setApplyStatus('已生成明日计划草案，请先确认再应用。')
  }

  function handleConfirmTomorrowDraft() {
    if (!tomorrowDraft) {
      setApplyStatus('当前没有可确认的明日计划草案。')
      return
    }

    archiveCurrentPlan('manual')
    updateQuests(tomorrowDraft.quests)
    setApplyStatus('明日计划已正式应用，你可以去今日任务页继续调整。')
    updateTomorrowDraft(null)
    setActivePage('tasks')
  }

  function handleCancelTomorrowDraft() {
    updateTomorrowDraft(null)
    setApplyStatus('已取消本次明日计划草案，当前任务保持不变。')
  }

  function handleExportPrototypeData() {
    exportPrototypeBundle({
      exportedAt: new Date().toISOString(),
      source: 'browser-local-prototype',
      userProfile: {
        roleName: dashboard.roleName,
        level: dashboard.level,
        xp: dashboard.xp,
        xpToNext: dashboard.xpToNext,
      },
      quests: dashboard.quests,
      tomorrowDraft,
      archivedPlans,
      growthRecords: dashboard.growthRecords,
      photoArchive,
      hasDeepseekKey: Boolean(deepseekKey),
    })
    setSettingsMessage('已导出当前原型数据，可用迁移脚本导入 C:\\meos。')
  }

  async function handleResetAllData() {
    const confirmed = window.confirm(
      '这会清空 C:\\meos 和当前程序里的本地缓存，所有现有任务、照片、记录和 Key 都会被删除。确定继续吗？',
    )

    if (!confirmed) {
      return
    }

    try {
      if (isDesktopRuntime()) {
        await resetDesktopMeosData()
      }

      clearAllPrototypeStorage()
      window.location.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message : '重置失败'
      setSettingsMessage(`重置失败：${message}`)
    }
  }

  function renderMentorStatus() {
    if (mentorAction === 'accepted') {
      return '你已接受本次调整，明天任务会优先朝这个方向收缩。'
    }

    if (mentorAction === 'later') {
      return '这次调整已暂缓，系统会先保留当前节奏，明天再重新判断。'
    }

    return '你还没有处理本次建议，AI 导师会继续根据今天的完成情况追踪。'
  }

  async function handleArchiveUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setArchiveStatus('仅支持 JPG、PNG、WEBP。')
      return
    }

    try {
      const imageUrl = await readFileAsDataUrl(file)
      const createdAt = new Date().toLocaleString('zh-CN', { hour12: false })
      const nextRecord: PhotoArchiveRecord = {
        id: `photo-${Date.now()}`,
        createdAt,
        category: archiveDraft.category,
        title: archiveDraft.title.trim() || file.name.replace(/\.[^.]+$/, ''),
        note: archiveDraft.note.trim() || '未填写备注',
        imageUrl,
        fileName: file.name,
      }

      const nextRecords = [nextRecord, ...photoArchive]
      setPhotoArchive(nextRecords)
      savePhotoArchive(nextRecords)
      if (isDesktopRuntime()) {
        void saveDesktopPhotoArchive(nextRecords)
      }
      setArchiveDraft({ category: '学习', title: '', note: '' })
      setArchiveStatus(`已保存：${nextRecord.title}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      setArchiveStatus(message)
    }
  }

  function renderPage() {
    if (activePage === 'overview') {
      return (
        <div className="page-stack">
          <HeroPanel
            dashboard={dashboard}
            isRefreshing={isRefreshing}
            completedQuestCount={completedQuestCount}
            completedXp={completedXp}
            onRefresh={refreshDashboard}
            onExport={exportQuests}
            onImport={importQuests}
            onExportWeeklyReport={exportWeeklyReport}
          />
          <section className="dashboard-grid">
            <StatsPanel stats={dashboard.stats} />
            <MentorPanel mentorInsights={dashboard.mentorInsights} />
          </section>
          <GrowthPanel
            todayLabel={todayLabel}
            currentStreak={dashboard.currentStreak}
            growthRecords={dashboard.growthRecords}
          />
        </div>
      )
    }

    if (activePage === 'tasks') {
      return (
        <div className="page-stack">
          <section className="panel overview-banner">
            <p className="panel-kicker">今日成长任务</p>
            <h3>{todayLongLabel}</h3>
            <p className="report-progress">
              预计投入 5 小时。英语任务已经并入每日任务，不再单独分页。
            </p>
          </section>
          <QuestPanel
            todayLongLabel={todayLongLabel}
            quests={dashboard.quests}
            onChange={updateQuests}
          />
          <p className="growth-meta">状态：当前生效中的今日任务</p>
          {tomorrowDraft ? (
            <section className="panel">
              <div className="panel-heading">
                <p className="panel-kicker">明日计划</p>
                <h3>{tomorrowDraft.createdAt}</h3>
                <p className="growth-meta">状态：已生成草案，等待确认或自动流转</p>
              </div>
              <div className="task-card-list">
                {tomorrowDraft.quests.map((quest) => (
                  <article className="task-card" key={quest.id}>
                    <div className="task-card-meta">
                      <span>{quest.type}</span>
                      <span>金币 {quest.xp}</span>
                    </div>
                    <h4>{quest.title}</h4>
                    <p className="growth-meta">{quest.duration}</p>
                    <p className="growth-meta">{quest.note}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {archivedPlans.length > 0 ? (
            <section className="panel">
              <div className="panel-heading">
                <p className="panel-kicker">历史计划</p>
                <h3>最近流转记录</h3>
              </div>
              <div className="archive-plan-list">
                {archivedPlans.map((plan) => (
                  <article className="growth-record-card" key={`${plan.date}-${plan.source}`}>
                    <p className="growth-date">{plan.date}</p>
                    <p className="growth-meta">
                      {plan.source === 'manual' ? '手动确认替换' : '次日自动转正'}
                    </p>
                    <p className="growth-meta">任务数量：{plan.quests.length}</p>
                    <p className="growth-meta">
                      {plan.quests
                        .slice(0, 2)
                        .map((quest) => quest.title)
                        .join(' / ')}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )
    }

    if (activePage === 'mentor') {
      return (
        <div className="page-stack">
          <section className="panel mentor-center">
            <div className="panel-heading">
              <p className="panel-kicker">成长决策中心</p>
              <h3>AI导师</h3>
            </div>

            <div className="mentor-center-grid">
              <article className="mentor-decision-card">
                <p className="growth-date">今日分析</p>
                <h4>{mentorDecision.headline}</h4>
                <p className="growth-meta">
                  执行率：{mentorDecision.executionRate}% · 已完成 {mentorDecision.completedCount}/
                  {mentorDecision.totalCount} · 今日金币 {mentorDecision.earnedCoins}
                </p>
                <p className="growth-meta">问题判断：{mentorDecision.issue}</p>
                <p className="growth-meta">调整方案：{mentorDecision.adjustment}</p>
                <p className="growth-meta">明日重点：{mentorDecision.tomorrowFocus}</p>
              </article>

              <article className="mentor-decision-card">
                <p className="growth-date">快捷处理</p>
                <div className="mentor-quick-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setMentorAction('accepted')}
                  >
                    接受调整
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setMentorAction('later')}
                  >
                    明天再说
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowReason((current) => !current)}
                  >
                    {showReason ? '收起原因' : '查看原因'}
                  </button>
                </div>
                <p className="report-focus">{renderMentorStatus()}</p>
                {showReason ? (
                  <p className="growth-meta">判断依据：{mentorDecision.reason}</p>
                ) : null}
              </article>
            </div>

            <div className="mentor-center-grid">
              <article className="mentor-decision-card">
                <p className="growth-date">今日任务观察</p>
                <p className="growth-meta">
                  已完成：{completedTitles.length > 0 ? completedTitles.join('、') : '暂时还没有完成任务'}
                </p>
                <p className="growth-meta">
                  待推进：{pendingTitles.length > 0 ? pendingTitles.join('、') : '当前任务已全部完成'}
                </p>
              </article>

              <article className="mentor-decision-card">
                <p className="growth-date">最近成长记录</p>
                <p className="growth-meta">连续成长天数：{dashboard.currentStreak} 天</p>
                <p className="growth-meta">
                  {recentRecord
                    ? `最近记录：${recentRecord.date} · 完成 ${recentRecord.completedQuestCount} 项 · 金币 ${recentRecord.completedXp}`
                    : '最近记录：还没有产生真实成长记录'}
                </p>
                <p className="growth-meta">{dashboard.weeklyReport.focus}</p>
              </article>
            </div>

            <article className="panel ai-live-panel">
              <div className="panel-heading">
                <p className="panel-kicker">DeepSeek 实时分析</p>
                <h3>让 AI 导师直接给建议</h3>
              </div>
              <p className="growth-meta">当前 Key 状态：{maskApiKey(deepseekKey)}</p>
              <p className="report-progress">{mentorAiStatus}</p>
              <div className="settings-form">
                <textarea
                  className="quest-textarea"
                  value={mentorPrompt}
                  onChange={(event) => setMentorPrompt(event.target.value)}
                />
                <div className="settings-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void handleRunMentorAnalysis()}
                    disabled={isMentorLoading}
                  >
                    {isMentorLoading ? '分析中...' : '开始 AI 分析'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCreateTomorrowDraft}
                    disabled={!mentorSections}
                  >
                    生成明日计划草案
                  </button>
                </div>
              </div>

              {applyStatus ? <p className="report-progress">{applyStatus}</p> : null}

              <div className="mentor-response-grid">
                <article className="mentor-decision-card ai-response-card">
                  <p className="growth-date">状态分析</p>
                  <p className="growth-meta">
                    {mentorSections?.statusAnalysis || '这里会显示状态分析。'}
                  </p>
                </article>
                <article className="mentor-decision-card ai-response-card">
                  <p className="growth-date">问题判断</p>
                  <p className="growth-meta">
                    {mentorSections?.problemJudgment || '这里会显示问题判断。'}
                  </p>
                </article>
                <article className="mentor-decision-card ai-response-card">
                  <p className="growth-date">调整方案</p>
                  {mentorSections?.adjustmentPlan.length ? (
                    <ul className="mentor-plan-list">
                      {mentorSections.adjustmentPlan.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="growth-meta">这里会显示调整方案。</p>
                  )}
                </article>
                <article className="mentor-decision-card ai-response-card">
                  <p className="growth-date">今天建议</p>
                  <p className="growth-meta">
                    {mentorSections?.todaySuggestion || '这里会显示今天建议。'}
                  </p>
                </article>
              </div>

              {tomorrowDraft ? (
                <section className="draft-preview">
                  <div className="draft-preview-header">
                    <div>
                      <p className="growth-date">明日计划草案</p>
                      <p className="growth-meta">目标日期：{tomorrowDraft.createdAt}</p>
                    </div>
                    <div className="draft-preview-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={handleConfirmTomorrowDraft}
                      >
                        确认替换
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleCancelTomorrowDraft}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                  <div className="task-card-list">
                    {tomorrowDraft.quests.map((quest) => (
                      <article className="task-card" key={quest.id}>
                        <div className="task-card-meta">
                          <span>{quest.type}</span>
                          <span>金币 {quest.xp}</span>
                        </div>
                        <h4>{quest.title}</h4>
                        <p className="growth-meta">{quest.duration}</p>
                        <p className="growth-meta">{quest.note}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </article>
          </section>
        </div>
      )
    }

    if (activePage === 'records') {
      return (
        <div className="page-stack">
          <section className="panel">
            <div className="panel-heading">
              <p className="panel-kicker">学习记录</p>
              <h3>今天学了什么</h3>
            </div>
            <div className="record-list">
              {learningRecords.map((record: (typeof learningRecords)[number]) => (
                <article className="growth-record-card" key={record.id}>
                  <p className="growth-date">{record.title}</p>
                  <p className="growth-meta">{record.duration}</p>
                  <p className="growth-meta">{record.status}</p>
                  <p className="growth-meta">金币：{record.coins}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )
    }

    if (activePage === 'weekly') {
      return (
        <div className="page-stack">
          <section className="panel">
            <div className="panel-heading">
              <p className="panel-kicker">周报</p>
              <h3>{dashboard.weeklyReport.weekLabel}</h3>
            </div>
            <p className="report-progress">{dashboard.weeklyReport.levelProgress}</p>
            <ul className="module-list">
              {dashboard.weeklyReport.gains.map((gain: string) => (
                <li key={gain}>{gain}</li>
              ))}
            </ul>
            <p className="report-focus">{dashboard.weeklyReport.focus}</p>
          </section>
        </div>
      )
    }

    if (activePage === 'archive') {
      return (
        <div className="page-stack">
          <section className="panel">
            <div className="panel-heading">
              <p className="panel-kicker">人生档案</p>
              <h3>时间线记录</h3>
            </div>
            <div className="archive-upload-grid">
              <article className="growth-record-card archive-upload-card">
                <p className="growth-date">上传人生记录</p>
                <p className="growth-meta">{archiveStatus}</p>
                <div className="task-creator-grid">
                  <select
                    className="quest-input"
                    value={archiveDraft.category}
                    onChange={(event) =>
                      setArchiveDraft((current) => ({
                        ...current,
                        category: event.target.value as PhotoArchiveRecord['category'],
                      }))
                    }
                  >
                    <option value="学习">学习</option>
                    <option value="生活">生活</option>
                    <option value="旅行">旅行</option>
                    <option value="其他">其他</option>
                  </select>
                  <input
                    className="quest-input"
                    placeholder="标题，例如：开始学习 Agent"
                    value={archiveDraft.title}
                    onChange={(event) =>
                      setArchiveDraft((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                  <textarea
                    className="quest-textarea"
                    placeholder="补充一句备注"
                    value={archiveDraft.note}
                    onChange={(event) =>
                      setArchiveDraft((current) => ({ ...current, note: event.target.value }))
                    }
                  />
                  <label className="primary-button archive-upload-button">
                    上传图片
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(event) => void handleArchiveUpload(event)}
                    />
                  </label>
                </div>
              </article>

              <article className="growth-record-card archive-upload-card">
                <p className="growth-date">当前保存方式</p>
                <p className="growth-meta">原型阶段先保存在浏览器本地。</p>
                <p className="growth-meta">桌面版接入后会切换到 `C:\meos\photos`。</p>
                <p className="growth-meta">每次上传会自动记录当前电脑时间。</p>
              </article>
            </div>

            <div className="photo-archive-list">
              {photoArchive.length > 0 ? (
                photoArchive.map((record) => (
                  <article className="growth-record-card photo-archive-card" key={record.id}>
                    <img className="photo-archive-image" src={record.imageUrl} alt={record.title} />
                    <p className="growth-date">{record.title}</p>
                    <p className="growth-meta">
                      {record.category} · {record.createdAt}
                    </p>
                    <p className="growth-meta">{record.note}</p>
                    <p className="growth-meta">{record.fileName}</p>
                  </article>
                ))
              ) : (
                <article className="growth-record-card">
                  <p className="growth-date">还没有人生记录</p>
                  <p className="growth-meta">先上传第一张照片，这里就会开始形成你的时间线。</p>
                </article>
              )}
            </div>
          </section>
        </div>
      )
    }

    return (
      <div className="page-stack">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <p className="panel-kicker">设置</p>
            <h3>核心配置</h3>
          </div>

          <div className="settings-grid">
            <article className="growth-record-card">
              <p className="growth-date">DeepSeek API Key</p>
              <p className="growth-meta">当前状态：{maskApiKey(deepseekKey)}</p>
              <p className="growth-meta">{settingsMessage}</p>
              <div className="settings-form">
                <input
                  type="password"
                  className="quest-input"
                  placeholder="输入新的 DeepSeek API Key"
                  value={keyDraft}
                  onChange={(event) => setKeyDraft(event.target.value)}
                />
                <div className="settings-actions">
                  <button type="button" className="primary-button" onClick={handleSaveKey}>
                    保存 Key
                  </button>
                  <button type="button" className="secondary-button" onClick={handleClearKey}>
                    清除 Key
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleExportPrototypeData}
                  >
                    导出原型数据
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void handleResetAllData()}
                  >
                    重置全部数据
                  </button>
                </div>
              </div>
            </article>

            <article className="growth-record-card">
              <p className="growth-date">数据目录状态</p>
              <p className="growth-meta">目标目录：{MEOS_PATHS.root}</p>
              <p className="growth-meta">
                当前原型先使用浏览器本地存储；桌面版接入后会切到 `C:\meos`。
              </p>
            </article>
          </div>

          <section className="settings-storage-panel">
            <div className="panel-heading">
              <p className="panel-kicker">数据状态</p>
              <h3>当前原型存储分布</h3>
            </div>
            <div className="storage-status-list">
              {storageStatus.map((item) => (
                <article className="growth-record-card storage-status-card" key={item.id}>
                  <p className="growth-date">{item.label}</p>
                  <p className="growth-meta">当前：{item.currentPath}</p>
                  <p className="growth-meta">目标：{item.targetPath}</p>
                  <p className="growth-meta">覆盖：{item.coverage}</p>
                  <p className="growth-meta">条目数：{item.itemCount}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="settings-storage-panel">
            <div className="panel-heading">
              <p className="panel-kicker">Meos 路径</p>
              <h3>桌面版落地映射</h3>
            </div>
            <div className="storage-status-list">
              <article className="growth-record-card storage-status-card">
                <p className="growth-date">数据库</p>
                <p className="growth-meta">{MEOS_PATHS.database}</p>
              </article>
              <article className="growth-record-card storage-status-card">
                <p className="growth-date">图片目录</p>
                <p className="growth-meta">{MEOS_PATHS.photos}</p>
              </article>
              <article className="growth-record-card storage-status-card">
                <p className="growth-date">配置目录</p>
                <p className="growth-meta">{MEOS_PATHS.config}</p>
              </article>
              <article className="growth-record-card storage-status-card">
                <p className="growth-date">周报导出</p>
                <p className="growth-meta">{MEOS_PATHS.reports}</p>
              </article>
            </div>
          </section>
        </section>
      </div>
    )
  }

  return (
    <main className="workspace-shell">
      <SlideNav
        isOpen={isNavOpen}
        activePage={activePage}
        dashboard={dashboard}
        onClose={() => setIsNavOpen(false)}
        onSelect={setActivePage}
      />
      <div className="workspace-surface">
        <TopBar
          title={pageTitles[activePage] as any}
          todayLongLabel={todayLongLabel}
          onOpenNav={() => setIsNavOpen(true)}
        />
        {renderPage()}
      </div>
    </main>
  )
}

export default App
