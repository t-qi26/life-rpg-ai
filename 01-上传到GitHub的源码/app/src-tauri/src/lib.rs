use base64::Engine;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const ROOT: &str = r"C:\meos";
const SETTINGS_XOR_KEY: &[u8] = b"life-rpg-ai::meos";
const TODAY: &str = "2026-08-01";

#[derive(Serialize)]
struct ReadyState {
    ready: bool,
}

#[derive(Serialize)]
struct MeosPaths {
    root: String,
    database: String,
    photos: String,
    reports: String,
    config: String,
    logs: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DesktopQuest {
    id: String,
    r#type: String,
    title: String,
    duration: String,
    xp: i64,
    note: String,
    completed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DesktopGrowthRecord {
    date: String,
    completed_quest_count: i64,
    completed_xp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DesktopTomorrowDraft {
    created_at: String,
    quests: Vec<DesktopQuest>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DesktopArchivedPlan {
    date: String,
    quests: Vec<DesktopQuest>,
    source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DesktopPhotoRecord {
    id: String,
    created_at: String,
    category: String,
    title: String,
    note: String,
    image_url: String,
    file_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopAppState {
    active_date: Option<String>,
    user_profile: Option<DesktopUserProfile>,
    quests: Vec<DesktopQuest>,
    growth_records: Vec<DesktopGrowthRecord>,
    tomorrow_draft: Option<DesktopTomorrowDraft>,
    archived_plans: Vec<DesktopArchivedPlan>,
    photo_archive: Vec<DesktopPhotoRecord>,
    deepseek_key_present: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DesktopUserProfile {
    role_name: String,
    level: i64,
    xp: i64,
    xp_to_next: i64,
    ai_engineering: i64,
    cognitive: i64,
    language: i64,
    aesthetic: i64,
}

fn meos_root() -> PathBuf {
    PathBuf::from(ROOT)
}

fn photo_category_directories() -> [(&'static str, &'static str); 4] {
    [
        ("学习", "study"),
        ("生活", "life"),
        ("旅行", "travel"),
        ("其他", "other"),
    ]
}

fn ensure_directories() -> std::io::Result<()> {
    let mut directories = vec![
        meos_root(),
        meos_root().join("database"),
        meos_root().join("photos"),
        meos_root().join("reports"),
        meos_root().join("reports").join("weekly"),
        meos_root().join("backup"),
        meos_root().join("config"),
        meos_root().join("learning"),
        meos_root().join("learning").join("books"),
        meos_root().join("learning").join("AI"),
        meos_root().join("logs"),
    ];

    for (label, slug) in photo_category_directories() {
        directories.push(meos_root().join("photos").join(label));
        directories.push(meos_root().join("photos").join(slug));
    }

    for directory in directories {
        fs::create_dir_all(directory)?;
    }

    Ok(())
}

fn database_path() -> PathBuf {
    meos_root().join("database").join("LifeRPG.db")
}

fn settings_path() -> PathBuf {
    meos_root().join("config").join("settings.json")
}

fn encrypted_key_path() -> PathBuf {
    meos_root().join("config").join("encrypted_key.dat")
}

fn connect_database() -> Result<Connection, String> {
    ensure_directories().map_err(|error| error.to_string())?;
    let connection = Connection::open(database_path()).map_err(|error| error.to_string())?;
    initialize_schema(&connection)?;
    Ok(connection)
}

fn initialize_schema(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            r#"
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                role_name TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                xp INTEGER NOT NULL DEFAULT 0,
                xp_to_next INTEGER NOT NULL DEFAULT 1000,
                ai_engineering INTEGER NOT NULL DEFAULT 0,
                cognitive INTEGER NOT NULL DEFAULT 0,
                language INTEGER NOT NULL DEFAULT 0,
                aesthetic INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS quest (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                quest_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                planned_minutes INTEGER NOT NULL DEFAULT 0,
                reward_xp INTEGER NOT NULL DEFAULT 0,
                scheduled_for TEXT NOT NULL,
                notes TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS growth_record (
                record_date TEXT PRIMARY KEY,
                completed_quest_count INTEGER NOT NULL DEFAULT 0,
                completed_xp INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS photo_record (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL UNIQUE,
                taken_at TEXT NOT NULL,
                note TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS app_kv (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            "#,
        )
        .map_err(|error| error.to_string())?;

    seed_defaults(connection)?;
    Ok(())
}

fn seed_defaults(connection: &Connection) -> Result<(), String> {
    let now = "2026-08-01T00:00:00";
    connection
        .execute(
            r#"
            INSERT OR IGNORE INTO user_profile (
                id, role_name, level, xp, xp_to_next, ai_engineering, cognitive, language, aesthetic, created_at, updated_at
            ) VALUES (1, 'AI Builder', 1, 0, 1000, 0, 0, 0, 0, ?1, ?1)
            "#,
            params![now],
        )
        .map_err(|error| error.to_string())?;

    let existing_quest_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM quest WHERE scheduled_for = ?1", params![TODAY], |row| {
            row.get(0)
        })
        .map_err(|error| error.to_string())?;

    if existing_quest_count == 0 {
        let quests = default_quests();
        for (index, quest) in quests.iter().enumerate() {
            connection
                .execute(
                    r#"
                    INSERT INTO quest (
                        id, title, quest_type, status, planned_minutes, reward_xp, scheduled_for, notes, sort_order, created_at, updated_at
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)
                    "#,
                    params![
                        quest.id,
                        quest.title,
                        quest.r#type,
                        if quest.completed { "done" } else { "pending" },
                        parse_duration_minutes(&quest.duration),
                        quest.xp,
                        TODAY,
                        quest.note,
                        index as i64,
                        now
                    ],
                )
                .map_err(|error| error.to_string())?;
        }
    }

    if !settings_path().exists() {
        fs::write(
            settings_path(),
            r#"{"theme":"warm-light","storageMode":"desktop-meos"}"#,
        )
        .map_err(|error| error.to_string())?;
    }

    if !encrypted_key_path().exists() {
        fs::write(encrypted_key_path(), "").map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn default_quests() -> Vec<DesktopQuest> {
    Vec::new()
}

fn parse_duration_minutes(duration: &str) -> i64 {
    duration
        .chars()
        .filter(|char| char.is_ascii_digit())
        .collect::<String>()
        .parse::<i64>()
        .unwrap_or(30)
}

fn encode_key(value: &str) -> String {
    let encoded: Vec<u8> = value
        .as_bytes()
        .iter()
        .enumerate()
        .map(|(index, byte)| byte ^ SETTINGS_XOR_KEY[index % SETTINGS_XOR_KEY.len()])
        .collect();

    base64::engine::general_purpose::STANDARD.encode(encoded)
}

fn decode_key(value: &str) -> Result<String, String> {
    if value.trim().is_empty() {
        return Ok(String::new());
    }

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(value)
        .map_err(|error| error.to_string())?;

    let decoded: Vec<u8> = bytes
        .iter()
        .enumerate()
        .map(|(index, byte)| byte ^ SETTINGS_XOR_KEY[index % SETTINGS_XOR_KEY.len()])
        .collect();

    String::from_utf8(decoded).map_err(|error| error.to_string())
}

fn save_app_kv(connection: &Connection, key: &str, value: &str) -> Result<(), String> {
    connection
        .execute(
            r#"
            INSERT INTO app_kv (key, value, updated_at)
            VALUES (?1, ?2, '2026-08-01T00:00:00')
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            "#,
            params![key, value],
        )
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn load_app_kv(connection: &Connection, key: &str) -> Result<Option<String>, String> {
    connection
        .query_row("SELECT value FROM app_kv WHERE key = ?1", params![key], |row| row.get(0))
        .optional()
        .map_err(|error| error.to_string())
}

fn load_json_kv<T>(connection: &Connection, key: &str) -> Result<Option<T>, String>
where
    T: for<'de> Deserialize<'de>,
{
    load_app_kv(connection, key)?
        .map(|raw| serde_json::from_str::<T>(&raw).map_err(|error| error.to_string()))
        .transpose()
}

fn write_photo_data(category: &str, file_name: &str, image_url: &str, title: &str) -> Result<String, String> {
    let extension = Path::new(file_name)
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("png");
    let safe_title = sanitize_file_name(title);
    let file_path = meos_root()
        .join("photos")
        .join(category)
        .join(format!("{}-{}.{}", TODAY, safe_title, extension));

    fs::write(&file_path, image_url).map_err(|error| error.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}

fn reset_meos_root() -> Result<(), String> {
    let root = meos_root();
    if root.exists() {
        fs::remove_dir_all(&root).map_err(|error| error.to_string())?;
    }

    ensure_directories().map_err(|error| error.to_string())?;
    let connection = Connection::open(database_path()).map_err(|error| error.to_string())?;
    initialize_schema(&connection)?;
    Ok(())
}

fn sanitize_file_name(value: &str) -> String {
    let filtered: String = value
        .chars()
        .map(|char| match char {
            '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => char,
        })
        .collect();

    if filtered.trim().is_empty() {
        "photo".into()
    } else {
        filtered
    }
}

#[tauri::command]
fn ensure_meos_ready() -> Result<ReadyState, String> {
    let _ = connect_database()?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn get_meos_paths() -> MeosPaths {
    MeosPaths {
        root: ROOT.into(),
        database: database_path().to_string_lossy().to_string(),
        photos: meos_root().join("photos").to_string_lossy().to_string(),
        reports: meos_root().join("reports").to_string_lossy().to_string(),
        config: meos_root().join("config").to_string_lossy().to_string(),
        logs: meos_root()
            .join("logs")
            .join("app.log")
            .to_string_lossy()
            .to_string(),
    }
}

#[tauri::command]
fn load_deepseek_key() -> Result<String, String> {
    ensure_directories().map_err(|error| error.to_string())?;
    if !encrypted_key_path().exists() {
        return Ok(String::new());
    }

    let raw = fs::read_to_string(encrypted_key_path()).map_err(|error| error.to_string())?;
    decode_key(&raw)
}

#[tauri::command]
fn save_deepseek_key(value: String) -> Result<ReadyState, String> {
    let _connection = connect_database()?;
    let encoded = encode_key(&value);
    fs::write(encrypted_key_path(), encoded).map_err(|error| error.to_string())?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn load_app_state() -> Result<DesktopAppState, String> {
    let connection = connect_database()?;
    let user_profile = load_json_kv::<DesktopUserProfile>(&connection, "user_profile")?;
    let quests = load_json_kv::<Vec<DesktopQuest>>(&connection, "today_quests")?
        .unwrap_or_else(default_quests);
    let growth_records = load_json_kv::<Vec<DesktopGrowthRecord>>(&connection, "growth_records")?
        .unwrap_or_default();
    let tomorrow_draft = load_json_kv::<DesktopTomorrowDraft>(&connection, "tomorrow_draft")?;
    let archived_plans =
        load_json_kv::<Vec<DesktopArchivedPlan>>(&connection, "archived_plans")?.unwrap_or_default();
    let photo_archive =
        load_json_kv::<Vec<DesktopPhotoRecord>>(&connection, "photo_archive")?.unwrap_or_default();
    let deepseek_key_present = !load_deepseek_key()?.is_empty();
    let active_date = load_app_kv(&connection, "active_date")?;

    Ok(DesktopAppState {
        active_date,
        user_profile,
        quests,
        growth_records,
        tomorrow_draft,
        archived_plans,
        photo_archive,
        deepseek_key_present,
    })
}

#[tauri::command]
fn save_quests(quests: Vec<DesktopQuest>) -> Result<ReadyState, String> {
    let connection = connect_database()?;
    let value = serde_json::to_string(&quests).map_err(|error| error.to_string())?;
    save_app_kv(&connection, "today_quests", &value)?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn save_user_profile(profile: DesktopUserProfile) -> Result<ReadyState, String> {
    let connection = connect_database()?;
    let value = serde_json::to_string(&profile).map_err(|error| error.to_string())?;
    save_app_kv(&connection, "user_profile", &value)?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn save_growth_records(records: Vec<DesktopGrowthRecord>) -> Result<ReadyState, String> {
    let connection = connect_database()?;
    let value = serde_json::to_string(&records).map_err(|error| error.to_string())?;
    save_app_kv(&connection, "growth_records", &value)?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn save_tomorrow_draft(draft: Option<DesktopTomorrowDraft>) -> Result<ReadyState, String> {
    let connection = connect_database()?;
    match draft {
        Some(draft) => {
            let value = serde_json::to_string(&draft).map_err(|error| error.to_string())?;
            save_app_kv(&connection, "tomorrow_draft", &value)?;
        }
        None => {
            connection
                .execute("DELETE FROM app_kv WHERE key = 'tomorrow_draft'", [])
                .map_err(|error| error.to_string())?;
        }
    }

    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn save_archived_plans(plans: Vec<DesktopArchivedPlan>) -> Result<ReadyState, String> {
    let connection = connect_database()?;
    let value = serde_json::to_string(&plans).map_err(|error| error.to_string())?;
    save_app_kv(&connection, "archived_plans", &value)?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn save_photo_archive(records: Vec<DesktopPhotoRecord>) -> Result<ReadyState, String> {
    let connection = connect_database()?;
    for record in &records {
        let _ = write_photo_data(&record.category, &record.file_name, &record.image_url, &record.title)?;
    }
    let value = serde_json::to_string(&records).map_err(|error| error.to_string())?;
    save_app_kv(&connection, "photo_archive", &value)?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn save_active_date(value: String) -> Result<ReadyState, String> {
    let connection = connect_database()?;
    save_app_kv(&connection, "active_date", &value)?;
    Ok(ReadyState { ready: true })
}

#[tauri::command]
fn reset_meos_data() -> Result<ReadyState, String> {
    reset_meos_root()?;
    Ok(ReadyState { ready: true })
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ensure_meos_ready,
            get_meos_paths,
            load_deepseek_key,
            save_deepseek_key,
            load_app_state,
            save_quests,
            save_growth_records,
            save_user_profile,
            save_tomorrow_draft,
            save_archived_plans,
            save_photo_archive,
            save_active_date,
            reset_meos_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
