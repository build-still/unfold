use tauri::Manager;

mod commands;
mod config;
mod db;
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
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");

            std::fs::create_dir_all(&app_data_dir).ok();

            let db_path = config::database_path(&app_data_dir);
            let db_url = config::database_url(&app_data_dir);

            eprintln!("Using database: {}", db_url);
            println!("Database path: {}", db_path.display());

            let pool = tauri::async_runtime::block_on(async {
                let pool = db::create_pool(app.handle()).await?;
                sqlx::migrate!("./migrations")
                    .run(&pool)
                    .await
                    .map_err(|e| e.to_string())?;
                db::ensure_nodes_schema(&pool).await?;
                Ok::<_, String>(pool)
            })?;

            app.manage(pool);

            let plugin = tauri_plugin_sql::Builder::default().build();
            app.handle().plugin(plugin)?;

            let main_window = app
                .get_webview_window("main")
                .expect("no main window");
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(550));
                main_window.maximize().unwrap();
                main_window.show().unwrap();
                main_window.set_focus().unwrap();
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
            commands::nodes_list,
            commands::nodes_create,
            commands::nodes_update,
            commands::nodes_move,
            commands::nodes_delete,
            commands::nodes_set_pinned,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
