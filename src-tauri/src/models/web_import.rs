use serde::{Deserialize, Serialize};

/** Response from fetching a website's HTML content.
 * 
 * Contains the parsed HTML and the final URL after any redirects.
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct WebsiteHtmlResponse {
    /** The HTML content of the website */
    pub html: String,
    /** The final URL after following redirects */
    pub final_url: String,
}
