use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlatNode {
    pub id: String,
    pub space_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub content: Option<String>,
    pub sort_order: i64,
    pub is_pinned: bool,
}

/// All nodes in a space (flat rows, same shape as the DB).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpaceNotesResponse {
    pub nodes: Vec<FlatNode>,
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
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveNodesRequest {
    pub space_id: String,
    pub node_ids: Vec<String>,
    pub new_parent_id: Option<String>,
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

/// Unpin then move in one SQLite transaction (DnD to tree).
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveNodesUnpinnedRequest {
    pub space_id: String,
    pub node_ids: Vec<String>,
    pub new_parent_id: Option<String>,
    pub insert_before_id: Option<String>,
}

/// Replace node rows for a space to match a previous `nodes_list` snapshot (undo/redo).
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplySpaceSnapshotRequest {
    pub space_id: String,
    pub nodes: Vec<FlatNode>,
}
