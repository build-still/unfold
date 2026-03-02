use crate::config;
use crate::models::images::{SaveImageRequest, SavePdfRequest, UploadImageRequest, UploadImageResponse};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, command};
use tauri_plugin_dialog::{DialogExt, FilePath};
use uuid::Uuid;

fn resolve_database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    Ok(config::database_path(&app_data_dir))
}

/** Uploads an image file to the app's local data directory.
 *
 * Base64-decodes the image data, generates a unique filename using UUID,
 * writes it to disk, and stores metadata in the database.
 */
#[command]
pub async fn upload_image(
    app: AppHandle,
    request: UploadImageRequest,
) -> Result<UploadImageResponse, String> {
    // Decode base64 data
    use base64::Engine;
    let image_data = base64::engine::general_purpose::STANDARD
        .decode(&request.base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Get app local data directory
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Create images directory if it doesn't exist
    let images_dir = app_data_dir.join("images");
    fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Failed to create images directory: {}", e))?;

    // Generate unique filename using UUID
    let file_extension = get_extension_from_mime(&request.mime_type);
    let unique_filename = format!("{}.{}", Uuid::new_v4(), file_extension);
    let file_path = images_dir.join(&unique_filename);

    // Write image data to file
    fs::write(&file_path, &image_data).map_err(|e| format!("Failed to write image file: {}", e))?;

    let attachment_id = Uuid::new_v4().to_string();
    let file_path_str = file_path
        .to_str()
        .ok_or("Failed to convert path to string")?
        .to_string();

    // Store metadata in database
    store_image_metadata(
        &app,
        &attachment_id,
        &request.note_id,
        &unique_filename,
        &file_path_str,
        request.size,
        &request.mime_type,
    )
    .await?;

    Ok(UploadImageResponse {
        id: attachment_id,
        path: file_path_str,
        size: request.size,
    })
}

/** Retrieves the file path of an image from the database by attachment ID. */
#[command]
pub async fn get_image(app: AppHandle, attachment_id: String) -> Result<String, String> {
    let db_path = resolve_database_path(&app)?;

    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT file_path FROM images WHERE id = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let path: String = stmt
        .query_row([&attachment_id], |row| row.get(0))
        .map_err(|e| format!("Failed to get image: {}", e))?;

    Ok(path)
}

/** Deletes an image from both the database and the file system. */
#[command]
pub async fn delete_image(app: AppHandle, attachment_id: String) -> Result<(), String> {
    let db_path = resolve_database_path(&app)?;

    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Get file path before deleting from DB
    let mut stmt = conn
        .prepare("SELECT file_path FROM images WHERE id = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let path: String = stmt
        .query_row([&attachment_id], |row| row.get(0))
        .map_err(|e| format!("Failed to get image: {}", e))?;

    // Delete from database
    conn.execute("DELETE FROM images WHERE id = ?1", [&attachment_id])
        .map_err(|e| format!("Failed to delete from database: {}", e))?;

    // Delete physical file
    fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))?;

    Ok(())
}

/** Stores image metadata in the database (internal helper). */
async fn store_image_metadata(
    app: &AppHandle,
    id: &str,
    note_id: &str,
    filename: &str,
    file_path: &str,
    size: u64,
    mime_type: &str,
) -> Result<(), String> {
    let db_path = resolve_database_path(app)?;

    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    conn.execute(
        "INSERT INTO images (id, note_id, filename, file_path, size, mime_type, created_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))",
        rusqlite::params![
            id,
            note_id,
            filename,
            file_path,
            size.to_string(),
            mime_type
        ],
    )
    .map_err(|e| format!("Failed to insert image metadata: {}", e))?;

    Ok(())
}



fn get_extension_from_mime(mime_type: &str) -> &str {
    match mime_type {
        "image/jpeg" => "jpg",
        "image/jpg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp",
        "image/svg+xml" => "svg",
        "image/bmp" => "bmp",
        "image/tiff" => "tiff",
        _ => "jpg",
    }
}





/** Opens a save dialog and writes a PDF file to the selected location. */
#[command]
pub async fn save_pdf_file(app: AppHandle, request: SavePdfRequest) -> Result<(), String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("PDF Document", &["pdf"])
        .set_file_name(&request.suggested_name)
        .blocking_save_file();

    let Some(chosen) = file_path else {
        // User canceled save dialog.
        return Ok(());
    };

    let path = match chosen {
        FilePath::Path(path) => path,
        FilePath::Url(url) => url
            .to_file_path()
            .map_err(|_| "Failed to resolve selected file path.".to_string())?,
    };

    fs::write(&path, &request.pdf_bytes).map_err(|e| format!("Failed to write PDF file: {}", e))?;

    Ok(())
}

/** Opens a save dialog and writes an image file to the selected location.
 * 
 * Can source the image from:
 * - An existing attachment ID (retrieves from app storage)
 * - A remote HTTPS URL (downloads the image)
 */
#[command]
pub async fn save_image_file(app: AppHandle, request: SaveImageRequest) -> Result<(), String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter(
            "Image",
            &["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "tiff"],
        )
        .set_file_name(&request.suggested_name)
        .blocking_save_file();

    let Some(chosen) = file_path else {
        // User canceled save dialog.
        return Ok(());
    };

    let path = match chosen {
        FilePath::Path(path) => path,
        FilePath::Url(url) => url
            .to_file_path()
            .map_err(|_| "Failed to resolve selected file path.".to_string())?,
    };

    let image_bytes = if let Some(attachment_id) = request
        .attachment_id
        .as_ref()
        .map(|id| id.trim())
        .filter(|id| !id.is_empty())
    {
        let source_path = get_image(app.clone(), attachment_id.to_string()).await?;
        fs::read(source_path).map_err(|e| format!("Failed to read source image file: {}", e))?
    } else if let Some(source_url) = request
        .source_url
        .as_ref()
        .map(|url| url.trim())
        .filter(|url| !url.is_empty())
    {
        if !(source_url.starts_with("http://") || source_url.starts_with("https://")) {
            return Err("Image source cannot be downloaded directly.".into());
        }

        let response = reqwest::get(source_url)
            .await
            .map_err(|e| format!("Failed to fetch image source: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Failed to fetch image source: HTTP {}",
                response.status()
            ));
        }

        response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read image response bytes: {}", e))?
            .to_vec()
    } else {
        return Err("No image source provided.".into());
    };

    fs::write(&path, image_bytes).map_err(|e| format!("Failed to write image file: {}", e))?;

    Ok(())
}
