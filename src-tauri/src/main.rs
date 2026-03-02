use tauri::Manager;

mod commands;
mod config;
mod migrations;
mod models;
mod utils;

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
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let start = std::time::Instant::now();

            let migrations = migrations::get_migrations();
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");

            // Create app data dir if it doesn't exist
            std::fs::create_dir_all(&app_data_dir).ok();

            let db_path = config::database_path(&app_data_dir);
            let db_url = config::database_url(&app_data_dir);

            // Log the database path
            eprintln!("Using database: {}", db_url);
            println!("Database path: {}", db_path.display());

            let plugin = tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, migrations)
                .build();

            app.handle().plugin(plugin)?;

            // Grab both windows before moving them into the background thread.
            let splash_window = app
                .get_webview_window("splashscreen")
                .expect("no splashscreen window");
            let main_window = app
                .get_webview_window("main")
                .expect("no main window");
            std::thread::spawn(move || {
                const MIN_SPLASH_MS: u128 = 2700;
                let elapsed_ms = start.elapsed().as_millis();
                if elapsed_ms < MIN_SPLASH_MS {
                    std::thread::sleep(std::time::Duration::from_millis(
                        (MIN_SPLASH_MS - elapsed_ms) as u64,
                    ));
                }
                splash_window
                    .eval("document.body.classList.add('is-exiting')")
                    .unwrap();
                std::thread::sleep(std::time::Duration::from_millis(550));
                main_window.maximize().unwrap();
                main_window.show().unwrap();
                main_window.set_focus().unwrap();
                splash_window.close().unwrap();
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::upload_image,
            commands::get_image,
            commands::delete_image,
            commands::save_pdf_file,
            commands::save_image_file,
            commands::fetch_website_html,
            commands::open_external_url,
            commands::get_system_fonts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
