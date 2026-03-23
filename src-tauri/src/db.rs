//! Shared SQLite path — matches [`crate::config::database_path`].
//!
//! Schema is applied via [`sqlx::migrate!`] at startup; [`ensure_nodes_schema`] aligns older files.

use crate::config;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

pub fn resolve_database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    Ok(config::database_path(&app_data_dir))
}

pub async fn create_pool(app: &AppHandle) -> Result<SqlitePool, String> {
    let path = resolve_database_path(app)?;
    let opts = SqliteConnectOptions::new()
        .filename(&path)
        .create_if_missing(true)
        .foreign_keys(true);
    SqlitePool::connect_with(opts)
        .await
        .map_err(|e| format!("Failed to open database: {}", e))
}

/// Older DBs may have a `nodes` row from before the full schema existed. `CREATE TABLE IF NOT EXISTS`
/// in migrations does not add columns to an existing table, so `SELECT … is_pinned, is_open` fails.
/// This aligns the live table with what migrations expect.
pub async fn ensure_nodes_schema(pool: &SqlitePool) -> Result<(), String> {
    let table_exists: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='nodes'",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;
    if table_exists == 0 {
        return Ok(());
    }

    let mut col_names: Vec<String> =
        sqlx::query_scalar::<_, String>("SELECT name FROM pragma_table_info('nodes')")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?;

    macro_rules! add_if_missing {
        ($name:expr, $ddl:expr) => {
            if !col_names.iter().any(|c| c.eq_ignore_ascii_case($name)) {
                let sql = format!("ALTER TABLE nodes ADD COLUMN {} {}", $name, $ddl);
                sqlx::query(&sql).execute(pool).await.map_err(|e| {
                    format!("nodes schema: ADD COLUMN {}: {}", $name, e)
                })?;
                col_names.push($name.to_string());
            }
        };
    }

    add_if_missing!("content", "TEXT");
    add_if_missing!("is_open", "INTEGER NOT NULL DEFAULT 0");
    add_if_missing!("is_pinned", "INTEGER NOT NULL DEFAULT 0");
    add_if_missing!("sort_order", "INTEGER NOT NULL DEFAULT 0");
    add_if_missing!("created_at", "TEXT");
    add_if_missing!("updated_at", "TEXT");

    Ok(())
}
