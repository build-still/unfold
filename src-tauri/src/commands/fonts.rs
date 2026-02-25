use font_kit::source::SystemSource;

#[tauri::command]
pub fn get_system_fonts() -> Result<Vec<String>, String> {
    let source = SystemSource::new();
    match source.all_families() {
        Ok(mut families) => {
            families.sort();
            families.dedup();
            Ok(families)
        }
        Err(e) => Err(e.to_string()),
    }
}
