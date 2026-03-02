use crate::config::{WEB_IMPORT_MAX_RESPONSE_BYTES, WEB_IMPORT_USER_AGENT};
use crate::models::WebsiteHtmlResponse;
use crate::utils::{normalize_and_validate_external_url, normalize_and_validate_url};
use reqwest::Client;
use std::time::Duration;
use tauri::{command, AppHandle};
use tauri_plugin_opener::OpenerExt;

/** Opens an external URL in the system's default browser.
 *
 * Supports http, https, mailto, and tel URLs.
 */
#[command]
pub async fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    let sanitized_url = normalize_and_validate_external_url(&url)?;

    app.opener().open_url(&sanitized_url, None::<&str>).map_err(|error| format!("Failed to open URL: {error}"))?;

    Ok(())
}

/** Fetches the HTML content of a website.
 *
 * - Follows HTTP redirects (max 10)
 * - Enforces maximum response size (2 MB)
 * - Sets standard browser headers
 * - Returns the final URL after redirects
 */
#[command]
pub async fn fetch_website_html(url: String) -> Result<WebsiteHtmlResponse, String> {
    let parsed_url = normalize_and_validate_url(&url)?;

    let client = Client::builder()
        .timeout(Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|error| format!("Failed to initialize HTTP client: {error}"))?;

    let response = client
        .get(parsed_url)
        .header(reqwest::header::USER_AGENT, WEB_IMPORT_USER_AGENT)
        .header(
            reqwest::header::ACCEPT,
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        )
        .header(reqwest::header::ACCEPT_LANGUAGE, "en-US,en;q=0.9")
        .send()
        .await
        .map_err(|error| format!("Failed to fetch website: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Website responded with HTTP status {}.",
            response.status()
        ));
    }

    if let Some(content_length) = response.content_length() {
        if content_length as usize > WEB_IMPORT_MAX_RESPONSE_BYTES {
            return Err(format!(
                "Website is too large to import (max {} MB).",
                WEB_IMPORT_MAX_RESPONSE_BYTES / (1024 * 1024)
            ));
        }
    }

    let final_url = response.url().to_string();
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Failed to read website response body: {error}"))?;

    if bytes.len() > WEB_IMPORT_MAX_RESPONSE_BYTES {
        return Err(format!(
            "Website is too large to import (max {} MB).",
            WEB_IMPORT_MAX_RESPONSE_BYTES / (1024 * 1024)
        ));
    }

    let html = String::from_utf8_lossy(&bytes).to_string();

    if html.trim().is_empty() {
        return Err("Website returned empty content.".to_string());
    }

    Ok(WebsiteHtmlResponse { html, final_url })
}
