use tauri::Manager;

mod commands;
mod migrations;

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let migrations = migrations::get_migrations();
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");

            // Create app data dir if it doesn't exist
            std::fs::create_dir_all(&app_data_dir).ok();

            // Use different database paths for dev and production builds
            let db_name = if cfg!(debug_assertions) {
                "unfold-dev.db"
            } else {
                "unfold.db"
            };

            let db_path = app_data_dir.join(db_name);
            let db_url = format!("sqlite:{}", db_path.display());

            // Log the database path
            eprintln!("Using database: {}", db_url);
            println!("Database path: {}", db_path.display());

            let plugin = tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, migrations)
                .build();

            app.handle().plugin(plugin)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::upload_image,
            commands::get_image,
            commands::delete_image,
            commands::check_database_schema,
            commands::check_nodes_schema,
            commands::repair_nodes_schema,
            commands::save_pdf_file,
            commands::save_image_file,
            commands::fetch_website_html,
            commands::open_external_url,
            commands::get_system_fonts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
