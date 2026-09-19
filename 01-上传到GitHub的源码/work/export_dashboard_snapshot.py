from __future__ import annotations

import json
import sqlite3
from pathlib import Path


ROOT = Path(r"C:\meos")
DB_PATH = ROOT / "database" / "LifeRPG.db"
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = BASE_DIR / "app" / "public" / "dashboard-snapshot.json"
STATE_PATH = BASE_DIR / "work" / "project_state.json"
TODAY = "2026-08-01"


DEFAULT_QUESTS = [
    {
        "type": "主线",
        "title": "Agent Memory 学习",
        "duration": "90 分钟",
        "xp": 80,
        "note": "先理解 memory 分层，再画出自己的知识流程图。",
        "sortOrder": 1,
    },
    {
        "type": "支线",
        "title": "英语阅读训练",
        "duration": "30 分钟",
        "xp": 30,
        "note": "阅读一篇四级难度短文，记录 5 个新词。",
        "sortOrder": 2,
    },
    {
        "type": "支线",
        "title": "底层逻辑阅读",
        "duration": "40 分钟",
        "xp": 40,
        "note": "完成 1 节阅读，并写 3 句核心观点。",
        "sortOrder": 3,
    },
    {
        "type": "挑战",
        "title": "完成一个 Agent 小实验",
        "duration": "60 分钟",
        "xp": 150,
        "note": "把今天输入内容转成一个最小可运行 Demo。",
        "sortOrder": 4,
    },
]


def load_project_state() -> dict:
    if not STATE_PATH.exists():
        return {"quests": [], "growthRecords": []}

    return json.loads(STATE_PATH.read_text(encoding="utf-8"))


def load_user_profile(conn: sqlite3.Connection) -> dict:
    row = conn.execute(
        """
        SELECT role_name, level, xp, xp_to_next,
               ai_engineering, cognitive, language, aesthetic
        FROM user_profile
        WHERE id = 1
        """
    ).fetchone()

    if row is None:
        return {
            "roleName": "AI Builder",
            "level": 1,
            "xp": 0,
            "xpToNext": 1000,
            "aiEngineering": 0,
            "cognitive": 0,
            "language": 0,
            "aesthetic": 0,
        }

    return {
        "roleName": row[0],
        "level": row[1],
        "xp": row[2],
        "xpToNext": row[3],
        "aiEngineering": row[4],
        "cognitive": row[5],
        "language": row[6],
        "aesthetic": row[7],
    }


def load_today_quests(conn: sqlite3.Connection, state: dict) -> list[dict]:
    if state.get("quests"):
        quests = []
        for index, quest in enumerate(state["quests"], start=1):
            quests.append(
                {
                    "type": quest["type"],
                    "title": quest["title"],
                    "duration": quest["duration"],
                    "xp": quest["xp"],
                    "note": quest["note"],
                    "sortOrder": index,
                }
            )
        return quests

    rows = conn.execute(
        """
        SELECT quest_type, title, planned_minutes, reward_xp, COALESCE(notes, '')
        FROM quest
        WHERE scheduled_for = ?
          AND status IN ('pending', 'in_progress')
        ORDER BY id ASC
        """,
        (TODAY,),
    ).fetchall()

    if not rows:
        return DEFAULT_QUESTS

    quests = []
    for index, row in enumerate(rows, start=1):
        quests.append(
            {
                "type": row[0],
                "title": row[1],
                "duration": f"{row[2]} 分钟",
                "xp": row[3],
                "note": row[4] or "今天完成这一项，留下一个可见结果。",
                "sortOrder": index,
            }
        )
    return quests


def build_snapshot() -> dict:
    state = load_project_state()

    with sqlite3.connect(DB_PATH) as conn:
        return {
            "user": load_user_profile(conn),
            "quests": load_today_quests(conn, state),
            "mentorSummary": {
                "summary": "当前判断：输入稳定，但实践不足。今天优先减少泛学，增加一个可交付的小实验。"
            },
            "mentorInsights": [
                {
                    "tag": "状态分析",
                    "content": "本周输入量较高，但能证明掌握度的输出行为偏少。",
                    "sortOrder": 1,
                },
                {
                    "tag": "问题判断",
                    "content": "当前瓶颈不是学习意愿，而是任务设计偏大，导致行动启动成本过高。",
                    "sortOrder": 2,
                },
                {
                    "tag": "调整方案",
                    "content": "把大块学习拆成理解加产出两段式，每次都要求留下可见结果。",
                    "sortOrder": 3,
                },
            ],
        }


def main() -> None:
    snapshot = build_snapshot()
    OUTPUT_PATH.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Exported dashboard snapshot to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
