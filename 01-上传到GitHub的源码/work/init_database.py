from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path


ROOT = Path(r"C:\meos")
DB_PATH = ROOT / "database" / "LifeRPG.db"
SCHEMA_PATH = Path(__file__).with_name("schema.sql")
SETTINGS_PATH = ROOT / "config" / "settings.json"
KEY_PATH = ROOT / "config" / "encrypted_key.dat"
LOG_PATH = ROOT / "logs" / "app.log"

DIRECTORIES = [
    ROOT,
    ROOT / "database",
    ROOT / "photos",
    ROOT / "photos" / "学习",
    ROOT / "photos" / "生活",
    ROOT / "photos" / "旅行",
    ROOT / "photos" / "其他",
    ROOT / "reports",
    ROOT / "reports" / "weekly",
    ROOT / "backup",
    ROOT / "config",
    ROOT / "learning",
    ROOT / "learning" / "books",
    ROOT / "learning" / "AI",
    ROOT / "logs",
]


def ensure_directories() -> None:
    for directory in DIRECTORIES:
        directory.mkdir(parents=True, exist_ok=True)


def ensure_files() -> None:
    SETTINGS_PATH.write_text(
        '{\n'
        '  "appName": "Life RPG AI",\n'
        '  "dataRoot": "C:\\\\meos",\n'
        '  "aiProvider": "deepseek",\n'
        '  "keyStorage": "encrypted_key.dat",\n'
        '  "createdAt": "2026-08-01T00:00:00"\n'
        '}\n',
        encoding="utf-8",
    )

    if not KEY_PATH.exists():
        KEY_PATH.write_bytes(b"")

    if not LOG_PATH.exists():
        LOG_PATH.write_text("", encoding="utf-8")


def initialize_database() -> None:
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    now = datetime.now().isoformat(timespec="seconds")

    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(schema)
        conn.execute(
            """
            INSERT INTO user_profile (
                id, role_name, level, xp, xp_to_next,
                ai_engineering, cognitive, language, aesthetic,
                created_at, updated_at
            )
            VALUES (1, ?, 2, 680, 1000, 40, 45, 20, 30, ?, ?)
            ON CONFLICT(id) DO NOTHING
            """,
            ("AI Builder", now, now),
        )
        conn.execute(
            """
            INSERT INTO language_profile (
                id, current_level, target_level, vocabulary_goal, reading_goal, updated_at
            )
            VALUES (1, ?, ?, 50, ?, ?)
            ON CONFLICT(id) DO NOTHING
            """,
            ("Lv0", "CET-4 Reading", "Finish one short reading task daily", now),
        )
        conn.commit()


if __name__ == "__main__":
    ensure_directories()
    ensure_files()
    initialize_database()
    print(f"Initialized database at: {DB_PATH}")
