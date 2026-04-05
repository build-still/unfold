use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{command, AppHandle, Manager};

const DEV_KEYBINDINGS_FILE_NAME: &str = "keybindings.dev.json";
const PROD_KEYBINDINGS_FILE_NAME: &str = "keybindings.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct KeybindingsConfig {
    #[serde(rename = "sidebar.toggle")]
    #[serde(alias = "toggleSidebar")]
    pub toggle_sidebar: String,
    #[serde(rename = "file.new")]
    pub file_new: String,
    #[serde(rename = "search.focus")]
    #[serde(alias = "focusSearch")]
    pub focus_search: String,
}

impl Default for KeybindingsConfig {
    fn default() -> Self {
        Self {
            toggle_sidebar: "cmd+b".to_string(),
            file_new: "cmd+n".to_string(),
            focus_search: "cmd+k".to_string(),
        }
    }
}

fn sanitize_chord(value: String, fallback: &str) -> String {
    let normalized = value.trim().to_lowercase();
    if normalized.is_empty() {
        fallback.to_string()
    } else {
        normalized
    }
}

impl KeybindingsConfig {
    fn sanitize(self) -> Self {
        let defaults = Self::default();

        Self {
            toggle_sidebar: sanitize_chord(self.toggle_sidebar, &defaults.toggle_sidebar),
            file_new: sanitize_chord(self.file_new, &defaults.file_new),
            focus_search: sanitize_chord(self.focus_search, &defaults.focus_search),
        }
    }
}

fn keybindings_file_name() -> &'static str {
    if cfg!(debug_assertions) {
        DEV_KEYBINDINGS_FILE_NAME
    } else {
        PROD_KEYBINDINGS_FILE_NAME
    }
}

fn keybindings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("failed to resolve app config directory: {error}"))?;

    fs::create_dir_all(&config_dir)
        .map_err(|error| format!("failed to create app config directory: {error}"))?;

    Ok(config_dir.join(keybindings_file_name()))
}

fn read_keybindings_file(path: &Path) -> Result<KeybindingsConfig, String> {
    let text = fs::read_to_string(path).map_err(|error| {
        format!(
            "failed to read keybindings file at {}: {error}",
            path.display()
        )
    })?;

    serde_json::from_str::<KeybindingsConfig>(&text)
        .map(KeybindingsConfig::sanitize)
        .map_err(|error| {
            format!(
                "failed to parse keybindings file at {}: {error}",
                path.display()
            )
        })
}

fn write_keybindings_file(path: &Path, keybindings: &KeybindingsConfig) -> Result<(), String> {
    let serialized = serde_json::to_string_pretty(keybindings)
        .map_err(|error| format!("failed to serialize keybindings: {error}"))?;

    fs::write(path, serialized).map_err(|error| {
        format!(
            "failed to write keybindings file at {}: {error}",
            path.display()
        )
    })
}

#[command]
pub fn get_keybindings(app: AppHandle) -> Result<KeybindingsConfig, String> {
    let path = keybindings_file_path(&app)?;

    if !path.exists() {
        return Ok(KeybindingsConfig::default());
    }

    match read_keybindings_file(&path) {
        Ok(keybindings) => Ok(keybindings),
        Err(error) => {
            eprintln!("{error}");
            Ok(KeybindingsConfig::default())
        }
    }
}

#[command]
pub fn set_keybindings(
    app: AppHandle,
    keybindings: KeybindingsConfig,
) -> Result<KeybindingsConfig, String> {
    let path = keybindings_file_path(&app)?;
    let normalized = keybindings.sanitize();

    write_keybindings_file(&path, &normalized)?;
    Ok(normalized)
}

#[command]
pub fn reset_keybindings(app: AppHandle) -> Result<KeybindingsConfig, String> {
    let path = keybindings_file_path(&app)?;

    if path.exists() {
        fs::remove_file(&path).map_err(|error| {
            format!(
                "failed to remove keybindings file at {}: {error}",
                path.display()
            )
        })?;
    }

    Ok(KeybindingsConfig::default())
}
