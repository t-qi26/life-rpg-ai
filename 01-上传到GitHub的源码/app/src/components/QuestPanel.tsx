import { useMemo, useState } from 'react'
import type { EditableQuest } from '../types'

type QuestPanelProps = {
  todayLongLabel: string
  quests: EditableQuest[]
  onChange: (quests: EditableQuest[]) => void
}

const groups = [
  { type: '主线', icon: '🔥', title: '主线任务' },
  { type: '支线', icon: '⭐', title: '支线任务' },
  { type: '挑战', icon: '🎯', title: '挑战任务' },
] as const

const EMPTY_QUEST: EditableQuest = {
  id: 'draft',
  type: '支线',
  title: '',
  duration: '30 分钟',
  xp: 20,
  note: '',
  completed: false,
}

export function QuestPanel({ todayLongLabel, quests, onChange }: QuestPanelProps) {
  const [draft, setDraft] = useState<EditableQuest>(EMPTY_QUEST)

  const groupedQuests = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        quests: quests.filter((quest) => quest.type === group.type),
        coins: quests
          .filter((quest) => quest.type === group.type)
          .reduce((sum, quest) => sum + quest.xp, 0),
      })),
    [quests],
  )

  function updateQuest(
    id: string,
    field: keyof EditableQuest,
    value: string | boolean,
  ) {
    const nextQuests = quests.map((quest) =>
      quest.id === id
        ? {
            ...quest,
            [field]: field === 'xp' ? Number(value) || 0 : value,
          }
        : quest,
    )

    onChange(nextQuests)
  }

  function removeQuest(id: string) {
    onChange(quests.filter((quest) => quest.id !== id))
  }

  function addQuest() {
    if (!draft.title.trim()) {
      return
    }

    onChange([
      ...quests,
      {
        ...draft,
        id: `local-${Date.now()}`,
        title: draft.title.trim(),
        note: draft.note.trim(),
      },
    ])

    setDraft(EMPTY_QUEST)
  }

  return (
    <section className="panel quest-panel">
      <div className="panel-heading">
        <p className="panel-kicker">今日成长任务</p>
        <h3>{todayLongLabel}</h3>
        <p className="report-progress">
          预计投入 5 小时。英语任务已经并入日常任务流，不再单独显示独立任务框。
        </p>
      </div>

      <div className="task-section-list">
        {groupedQuests.map((group) => (
          <section className="task-section" key={group.type}>
            <div className="task-section-header">
              <p className="task-section-kicker">
                {group.icon} {group.title}
              </p>
              <p className="task-section-reward">🪙 {group.coins}</p>
            </div>

            <div className="task-card-list">
              {group.quests.map((quest) => (
                <article
                  className={`task-card ${quest.completed ? 'quest-card-completed' : ''}`}
                  key={quest.id}
                >
                  <div className="quest-topline">
                    <label className="quest-complete-toggle">
                      <input
                        type="checkbox"
                        checked={quest.completed}
                        onChange={(event) =>
                          updateQuest(quest.id, 'completed', event.target.checked)
                        }
                      />
                      <span>{quest.completed ? '已完成' : '进行中'}</span>
                    </label>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => removeQuest(quest.id)}
                    >
                      删除
                    </button>
                  </div>

                  <input
                    className="quest-input quest-title-input"
                    value={quest.title}
                    onChange={(event) =>
                      updateQuest(quest.id, 'title', event.target.value)
                    }
                  />

                  <div className="task-card-meta">
                    <span>{quest.duration}</span>
                    <span>🪙 {quest.xp}</span>
                  </div>

                  <textarea
                    className="quest-textarea"
                    value={quest.note}
                    onChange={(event) =>
                      updateQuest(quest.id, 'note', event.target.value)
                    }
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="task-creator">
        <div className="panel-heading">
          <p className="panel-kicker">新增任务</p>
          <h3>把今天的新任务加进来</h3>
        </div>

        <div className="task-creator-grid">
          <input
            className="quest-input quest-type-input"
            value={draft.type}
            onChange={(event) =>
              setDraft((current) => ({ ...current, type: event.target.value }))
            }
          />
          <input
            className="quest-input quest-title-input"
            placeholder="例如：完成一个阅读任务"
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
          />
          <input
            className="quest-input"
            value={draft.duration}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                duration: event.target.value,
              }))
            }
          />
          <input
            className="quest-input"
            inputMode="numeric"
            value={String(draft.xp)}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                xp: Number(event.target.value) || 0,
              }))
            }
          />
          <textarea
            className="quest-textarea"
            placeholder="任务描述或完成标准"
            value={draft.note}
            onChange={(event) =>
              setDraft((current) => ({ ...current, note: event.target.value }))
            }
          />
        </div>

        <button
          type="button"
          className="primary-button quest-add"
          onClick={addQuest}
        >
          添加今日任务
        </button>
      </section>
    </section>
  )
}
