use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlatNode {
    pub id: String,
    pub space_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub sort_order: i64,
    pub is_pinned: bool,
    pub is_open: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNodeRequest {
    pub space_id: String,
    pub parent_id: Option<String>,
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNodeRequest {
    pub space_id: String,
    pub id: String,
    pub name: Option<String>,
    pub is_open: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveNodesRequest {
    pub space_id: String,
    pub node_ids: Vec<String>,
    pub new_parent_id: Option<String>,
    /// If set, insert moved block before this sibling (must share `new_parent_id`).
    pub insert_before_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteNodesRequest {
    pub space_id: String,
    pub node_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetPinnedRequest {
    pub space_id: String,
    pub node_ids: Vec<String>,
    pub is_pinned: bool,
}
