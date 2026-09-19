from __future__ import annotations

import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path


ROOT = Path(r"C:\meos")
DB_PATH = ROOT / "database" / "LifeRPG.db"
PHOTO_ROOT = ROOT / "photos"
CONFIG_ROOT = ROOT / "config"

CATEGORY_MAP = {
    "学习": "学习",
    "生活": "生活",
    "旅行": "旅行",
    "其他": "其他",
    "瀛︿範": "学习",
    "鐢熸椿": "生活",
    "鏃呰": "旅行",
    "鍏朵粬": "其他",
}


def normalize_category(value: str) -> str:
    return CATEGORY_MAP.get(value, "其他")


def write_photo_stub(record: dict) -> str:
    category = normalize_category(str(record.get("category", "其他")))
    title = str(record.get("title", "photo")).strip() or "photo"
    safe_title = "".join(char if char not in r'\/:*?"<>|' else "_" for char in title)
    extension = Path(str(record.get("fileName", "photo.jpg"))).suffix or ".jpg"
    target_dir = PHOTO_ROOT / category
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{safe_title}{extension}"

    if not target_path.exists():
      target_path.write_text(
          "Prototype import placeholder. Original image remains in browser export bundle.\n",
          encoding="utf-8",
      )

    return str(target_path)


def import_bundle(bundle_path: Path) -> None:
    bundle = json.loads(bundle_path.read_text(encoding="utf-8"))
    now = datetime.now().isoformat(timespec="seconds")

    user = bundle["userProfile"]
    quests = bundle.get("quests", [])
    growth_records = bundle.get("growthRecords", [])
    photos = bundle.get("photoArchive", [])

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            UPDATE user_profile
            SET role_name = ?, level = ?, xp = ?, xp_to_next = ?, updated_at = ?
            WHERE id = 1
            """,
            (
                user["roleName"],
                int(user["level"]),
                int(user["xp"]),
                int(user["xpToNext"]),
                now,
            ),
        )

        conn.execute("DELETE FROM quest")
        for quest in quests:
            conn.execute(
                """
                INSERT INTO quest (
                    title, quest_type, status, planned_minutes, reward_xp,
                    scheduled_for, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    quest["title"],
                    quest["type"],
                    "completed" if quest.get("completed") else "pending",
                    0,
                    int(quest.get("xp", 0)),
                    "2026-08-01",
                    quest.get("note", ""),
                    now,
                    now,
                ),
            )

        conn.execute("DELETE FROM growth_record")
        for record in growth_records:
            conn.execute(
                """
                INSERT INTO growth_record (
                    record_date, focus_area, duration_minutes, completion_rate, reflection
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    record["date"],
                    "Daily Growth",
                    0,
                    float(record["completedQuestCount"]),
                    f"coins={record['completedXp']}",
                ),
            )

        for photo in photos:
            file_path = write_photo_stub(photo)
            conn.execute(
                """
                INSERT OR IGNORE INTO photo_record (
                    category, file_path, taken_at, note, created_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    normalize_category(str(photo.get("category", "其他"))),
                    file_path,
                    photo.get("createdAt", now),
                    photo.get("note", ""),
                    now,
                ),
            )

        conn.commit()

    if bundle.get("hasDeepseekKey"):
        marker = CONFIG_ROOT / "prototype_key_migration_note.txt"
        marker.write_text(
            "Browser export indicated an existing DeepSeek key. "
            "For security, the raw key is not included in the export bundle.\n",
            encoding="utf-8",
        )


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python work\\import_prototype_bundle.py <bundle.json>")
        raise SystemExit(1)

    bundle_path = Path(sys.argv[1]).expanduser().resolve()
    if not bundle_path.exists():
        print(f"Bundle not found: {bundle_path}")
        raise SystemExit(1)

    import_bundle(bundle_path)
    print(f"Imported prototype bundle into: {DB_PATH}")


if __name__ == "__main__":
    main()
