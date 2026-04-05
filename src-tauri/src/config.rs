use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{command, AppHandle, Manager};

pub const DEV_DATABASE_FILE_NAME: &str = "unfold-dev.db";
pub const PROD_DATABASE_FILE_NAME: &str = "unfold.db";
const DEV_CONFIG_FILE_NAME: &str = "config.dev.json";
const PROD_CONFIG_FILE_NAME: &str = "config.json";
const SIDEBAR_WIDTH_MIN: u16 = 180;
const SIDEBAR_WIDTH_MAX: u16 = 480;

// Web import constants
pub const WEB_IMPORT_USER_AGENT: &str = "UnfoldReaderImport/1.0";
pub const WEB_IMPORT_MAX_RESPONSE_BYTES: usize = 2 * 1024 * 1024;

pub fn database_file_name() -> &'static str {
    if cfg!(debug_assertions) {
        DEV_DATABASE_FILE_NAME
    } else {
        PROD_DATABASE_FILE_NAME
    }
}

pub fn database_path(base_dir: &Path) -> PathBuf {
    base_dir.join(database_file_name())
}

pub fn database_url(base_dir: &Path) -> String {
    format!("sqlite:{}", database_path(base_dir).display())
}

fn config_file_name() -> &'static str {
    if cfg!(debug_assertions) {
        DEV_CONFIG_FILE_NAME
    } else {
        PROD_CONFIG_FILE_NAME
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SidebarPosition {
    Left,
    Right,
}

impl Default for SidebarPosition {
    fn default() -> Self {
        Self::Left
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Light,
    Dark,
    System,
}

impl Default for ThemeMode {
    fn default() -> Self {
        Self::System
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarConfig {
    pub position: SidebarPosition,
    pub width: u16,
}

impl Default for SidebarConfig {
    fn default() -> Self {
        Self {
            position: SidebarPosition::default(),
            width: 196,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
struct LegacyFlatAppConfig {
    #[serde(rename = "sidebar.position")]
    sidebar_position: SidebarPosition,
    #[serde(rename = "sidebar.width")]
    sidebar_width: u16,
    theme: ThemeMode,
}

impl From<LegacyFlatAppConfig> for AppConfig {
    fn from(value: LegacyFlatAppConfig) -> Self {
        Self {
            sidebar: SidebarConfig {
                position: value.sidebar_position,
                width: value.sidebar_width,
            },
            theme: value.theme,
        }
    }
}

impl SidebarConfig {
    fn sanitize(self) -> Self {
        Self {
            position: self.position,
            width: self.width.clamp(SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub sidebar: SidebarConfig,
    pub theme: ThemeMode,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            sidebar: SidebarConfig::default(),
            theme: ThemeMode::default(),
        }
    }
}

impl AppConfig {
    fn sanitize(self) -> Self {
        Self {
            sidebar: self.sidebar.sanitize(),
            theme: self.theme,
        }
    }
}

fn app_config_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("failed to resolve app config directory: {error}"))?;

    fs::create_dir_all(&config_dir)
        .map_err(|error| format!("failed to create app config directory: {error}"))?;

    Ok(config_dir.join(config_file_name()))
}

fn read_config_file(path: &Path) -> Result<AppConfig, String> {
    let text = fs::read_to_string(path)
        .map_err(|error| format!("failed to read config file at {}: {error}", path.display()))?;

    if let Ok(config) = serde_json::from_str::<AppConfig>(&text) {
        return Ok(config.sanitize());
    }

    if let Ok(legacy) = serde_json::from_str::<LegacyFlatAppConfig>(&text) {
        return Ok(AppConfig::from(legacy).sanitize());
    }

    Err(format!("failed to parse config file at {}", path.display()))
}

fn write_config_file(path: &Path, config: &AppConfig) -> Result<(), String> {
    let serialized = serde_json::to_string_pretty(config)
        .map_err(|error| format!("failed to serialize config: {error}"))?;

    fs::write(path, serialized)
        .map_err(|error| format!("failed to write config file at {}: {error}", path.display()))
}

#[command]
pub fn get_config(app: AppHandle) -> Result<AppConfig, String> {
    let path = app_config_file_path(&app)?;

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    match read_config_file(&path) {
        Ok(config) => Ok(config),
        Err(error) => {
            eprintln!("{error}");
            Ok(AppConfig::default())
        }
    }
}

#[command]
pub fn set_config(app: AppHandle, config: AppConfig) -> Result<AppConfig, String> {
    let path = app_config_file_path(&app)?;
    let normalized = config.sanitize();
    write_config_file(&path, &normalized)?;
    Ok(normalized)
}

#[command]
pub fn reset_config(app: AppHandle) -> Result<AppConfig, String> {
    let path = app_config_file_path(&app)?;

    if path.exists() {
        fs::remove_file(&path)
            .map_err(|error| format!("failed to remove config file at {}: {error}", path.display()))?;
    }

    Ok(AppConfig::default())
}
