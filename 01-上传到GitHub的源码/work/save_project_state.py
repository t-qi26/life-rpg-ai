from __future__ import annotations

import json
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
STATE_PATH = BASE_DIR / "work" / "project_state.json"


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python save_project_state.py <json-file>")

    source = Path(sys.argv[1]).resolve()
    payload = json.loads(source.read_text(encoding="utf-8"))

    quests = payload.get("quests", [])
    growth_records = payload.get("growthRecords", [])

    normalized = {
        "savedAt": "2026-08-01T00:00:00",
        "quests": quests,
        "growthRecords": growth_records,
    }

    STATE_PATH.write_text(
        json.dumps(normalized, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved project state to: {STATE_PATH}")


if __name__ == "__main__":
    main()
