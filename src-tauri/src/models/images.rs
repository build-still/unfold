use serde::{Deserialize, Serialize};

/** Request to upload an image file.
 *
 * Contains base64-encoded image data that will be decoded,
 * stored on disk, and registered in the database.
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct UploadImageRequest {
    pub note_id: String,
    pub file_name: String,
    pub base64_data: String,
    pub mime_type: String,
    pub size: u64,
}

/** Response after successfully uploading an image.
 *
 * Contains the unique attachment ID, file path, and size.
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct UploadImageResponse {
    pub id: String,
    pub path: String,
    pub size: u64,
}

/** Request to save a PDF file via the system's save dialog.
 *
 * Contains the PDF binary data and suggested filename.
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct SavePdfRequest {
    pub suggested_name: String,
    pub pdf_bytes: Vec<u8>,
}

/** Request to save an image file via the system's save dialog.
 *
 * Supports sourcing from either an existing attachment ID or a remote HTTPS URL.
 * Suggested filename is used as the default in the save dialog.
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct SaveImageRequest {
    pub suggested_name: String,
    pub source_url: Option<String>,
    pub attachment_id: Option<String>,
}
