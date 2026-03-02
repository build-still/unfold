use reqwest::Url;

/** Normalizes and validates a URL for web content fetching.
 *
 * Adds https:// prefix if no scheme is provided.
 * Only accepts http and https schemes.
 */
pub fn normalize_and_validate_url(input: &str) -> Result<Url, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("URL is required.".to_string());
    }

    let candidate = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else {
        format!("https://{}", trimmed)
    };

    let parsed = Url::parse(&candidate).map_err(|_| "Invalid URL format.".to_string())?;

    match parsed.scheme() {
        "http" | "https" => Ok(parsed),
        _ => Err("Only http:// and https:// URLs are supported.".to_string()),
    }
}

/** Normalizes and validates a URL for external linking.
 *
 * Adds https:// prefix if no scheme is provided.
 * Accepts http, https, mailto, and tel schemes.
 */
pub fn normalize_and_validate_external_url(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("URL is required.".to_string());
    }

    let candidate = if trimmed.starts_with("http://")
        || trimmed.starts_with("https://")
        || trimmed.starts_with("mailto:")
        || trimmed.starts_with("tel:")
    {
        trimmed.to_string()
    } else {
        format!("https://{}", trimmed)
    };

    let parsed = Url::parse(&candidate).map_err(|_| "Invalid URL format.".to_string())?;

    match parsed.scheme() {
        "http" | "https" | "mailto" | "tel" => Ok(parsed.to_string()),
        _ => Err("Only http(s), mailto, and tel URLs are supported.".to_string()),
    }
}
