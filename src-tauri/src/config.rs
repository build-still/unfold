use std::path::{Path, PathBuf};

pub const DEV_DATABASE_FILE_NAME: &str = "unfold-dev.db";
pub const PROD_DATABASE_FILE_NAME: &str = "unfold.db";

// Web import constants
pub const WEB_IMPORT_USER_AGENT: &str = "UnfoldReaderImport/1.0 (+https://github.com/mathangik/unfold)";
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
