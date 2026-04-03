use crate::helpers::nodes_helpers::{
    delete_nodes_batch, get_ordered_node_ids, node_exists, node_exists_pool,
};
use crate::models::nodes::{
    ApplySpaceSnapshotRequest, CreateNodeRequest, DeleteNodesRequest, FlatNode, MoveNodesRequest,
    MoveNodesUnpinnedRequest, SetPinnedRequest, SpaceNotesResponse, UpdateNodeRequest,
};
use sqlx::Row;
use sqlx::SqlitePool;
use std::collections::HashSet;
use tauri::{command, AppHandle, Manager};
use uuid::Uuid;

fn pool(app: &AppHandle) -> SqlitePool {
    app.state::<SqlitePool>().inner().clone()
}

fn row_to_flat(row: &sqlx::sqlite::SqliteRow) -> Result<FlatNode, sqlx::Error> {
    Ok(FlatNode {
        id: row.try_get(0)?,
        space_id: row.try_get(1)?,
        parent_id: row.try_get(2)?,
        name: row.try_get(3)?,
        content: row.try_get(4)?,
        sort_order: row.try_get(5)?,
        is_pinned: row.try_get::<i64, _>(6)? != 0,
    })
}

async fn ensure_seed_space(pool: &SqlitePool, space_id: &str) -> Result<(), String> {
    let exists: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM spaces WHERE id = ?1")
        .bind(space_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    if exists == 0 {
        sqlx::query("INSERT INTO spaces (id, name, sort_order) VALUES (?1, 'mine', 0)")
            .bind(space_id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

async fn seed_if_empty(pool: &SqlitePool, space_id: &str) -> Result<(), String> {
    ensure_seed_space(pool, space_id).await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM nodes WHERE space_id = ?1")
        .bind(space_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    if count == 0 {
        let id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO nodes (id, space_id, parent_id, name, content, is_pinned, sort_order)
             VALUES (?1, ?2, NULL, 'Welcome', NULL, 0, 0)",
        )
        .bind(&id)
        .bind(space_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

async fn get_parent(
    pool: &SqlitePool,
    space_id: &str,
    node_id: &str,
) -> Result<Option<String>, String> {
    sqlx::query_scalar(
        "SELECT parent_id FROM nodes WHERE id = ?1 AND space_id = ?2",
    )
    .bind(node_id)
    .bind(space_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())
}

/// True if `node_id` is `ancestor_id` or lies under it (walk upward from `node_id`).
async fn is_descendant_of(
    pool: &SqlitePool,
    space_id: &str,
    mut node_id: String,
    ancestor_id: &str,
) -> Result<bool, String> {
    let mut steps = 0;
    loop {
        if node_id == ancestor_id {
            return Ok(true);
        }
        match get_parent(pool, space_id, &node_id).await? {
            None => return Ok(false),
            Some(p) => {
                node_id = p;
                steps += 1;
                if steps > 100_000 {
                    return Err("node tree depth exceeded".into());
                }
            }
        }
    }
}

#[command]
pub async fn nodes_list(app: AppHandle, space_id: String) -> Result<SpaceNotesResponse, String> {
    let pool = pool(&app);
    seed_if_empty(&pool, &space_id).await?;
    let rows = sqlx::query(
        "SELECT id, space_id, parent_id, name, content, sort_order, is_pinned
         FROM nodes WHERE space_id = ?1
         ORDER BY parent_id, sort_order, name",
    )
    .bind(&space_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;
    let flat: Vec<FlatNode> = rows
        .iter()
        .map(|r| row_to_flat(r).map_err(|e| e.to_string()))
        .collect::<Result<_, _>>()?;
    Ok(SpaceNotesResponse { nodes: flat })
}

#[command]
pub async fn nodes_create(app: AppHandle, request: CreateNodeRequest) -> Result<FlatNode, String> {
    let pool = pool(&app);
    ensure_seed_space(&pool, &request.space_id).await?;
    if let Some(ref pid) = request.parent_id {
        if !node_exists_pool(&pool, pid, &request.space_id).await? {
            return Err("Parent node not found".into());
        }
    }
    let id = Uuid::new_v4().to_string();
    let max_so: Option<i64> = if let Some(ref pid) = request.parent_id {
        sqlx::query_scalar(
            "SELECT MAX(sort_order) FROM nodes WHERE space_id = ?1 AND parent_id = ?2",
        )
        .bind(&request.space_id)
        .bind(pid)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
    } else {
        sqlx::query_scalar(
            "SELECT MAX(sort_order) FROM nodes WHERE space_id = ?1 AND parent_id IS NULL",
        )
        .bind(&request.space_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
    };
    let sort_order = max_so.unwrap_or(-1) + 1;
    sqlx::query(
        "INSERT INTO nodes (id, space_id, parent_id, name, content, is_pinned, sort_order)
         VALUES (?1, ?2, ?3, ?4, NULL, 0, ?5)",
    )
    .bind(&id)
    .bind(&request.space_id)
    .bind(&request.parent_id)
    .bind(&request.name)
    .bind(sort_order)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;
    let row = sqlx::query(
        "SELECT id, space_id, parent_id, name, content, sort_order, is_pinned FROM nodes WHERE id = ?1",
    )
    .bind(&id)
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;
    row_to_flat(&row).map_err(|e| e.to_string())
}

#[command]
pub async fn nodes_update(app: AppHandle, request: UpdateNodeRequest) -> Result<FlatNode, String> {
    let pool = pool(&app);
    if !node_exists_pool(&pool, &request.id, &request.space_id).await? {
        return Err("Node not found".into());
    }
    if let Some(ref name) = request.name {
        sqlx::query("UPDATE nodes SET name = ?1 WHERE id = ?2 AND space_id = ?3")
            .bind(name)
            .bind(&request.id)
            .bind(&request.space_id)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;
    }
    let row = sqlx::query(
        "SELECT id, space_id, parent_id, name, content, sort_order, is_pinned FROM nodes WHERE id = ?1",
    )
    .bind(&request.id)
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;
    row_to_flat(&row).map_err(|e| e.to_string())
}

#[command]
pub async fn nodes_delete(app: AppHandle, request: DeleteNodesRequest) -> Result<(), String> {
    let pool = pool(&app);
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    delete_nodes_batch(&mut tx, &request.space_id, &request.node_ids).await?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn nodes_set_pinned(app: AppHandle, request: SetPinnedRequest) -> Result<(), String> {
    let pool = pool(&app);
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    println!("request: {:?}", request);
    for id in &request.node_ids {
        if !node_exists(&mut tx, id, &request.space_id).await? {
            return Err(format!("Node {} not found", id));
        }
        if request.is_pinned {
            sqlx::query(
                "UPDATE nodes SET is_pinned = 1 WHERE id = ?1 AND space_id = ?2",
            )
            .bind(id)
            .bind(&request.space_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        println!("node {} pinned", id);
        } else {
            sqlx::query("UPDATE nodes SET is_pinned = 0 WHERE id = ?1 AND space_id = ?2")
                .bind(id)
                .bind(&request.space_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    let rows = sqlx::query(
        "SELECT id, space_id, parent_id, name, content, sort_order, is_pinned 
         FROM nodes 
         WHERE space_id = ?1  AND is_pinned = 1
         ORDER BY sort_order ASC, name ASC",
    )
    .bind(&request.space_id)
    .fetch_all(&pool) 
    .await
    .map_err(|e| e.to_string())?;
    
    let nodes: Vec<FlatNode> = rows
    .iter()
    .map(|r| row_to_flat(r).map_err(|e| e.to_string()))
    .collect::<Result<_, _>>()?;    
    println!("nodes: {:?}", nodes.iter().map(|n| n.id.clone()).collect::<Vec<String>>());
    Ok(())
}

async fn move_nodes_inner(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    space_id: &str,
    node_ids: &[String],
    new_parent_id: Option<String>,
) -> Result<(), String> {
    if node_ids.is_empty() {
        return Ok(());
    }
    let moved: HashSet<String> = node_ids.iter().cloned().collect();

    for id in node_ids {
        if !node_exists(tx, id, space_id).await? {
            return Err(format!("Node {} not found", id));
        }
    }

    let mut old_parents: HashSet<Option<String>> = HashSet::new();
    for id in node_ids {
        let pid: Option<String> = sqlx::query_scalar(
            "SELECT parent_id FROM nodes WHERE id = ?1 AND space_id = ?2",
        )
        .bind(id)
        .bind(space_id)
        .fetch_one(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;
        old_parents.insert(pid);
    }

    let new_parent = new_parent_id.clone();

    let mut siblings: Vec<String> = get_ordered_node_ids(tx, space_id, new_parent.as_deref()).await?;

    siblings.retain(|id| !moved.contains(id));

    let insert_idx = siblings.len();

    let mut new_order: Vec<String> = Vec::new();
    new_order.extend(siblings.iter().take(insert_idx).cloned());
    new_order.extend(node_ids.iter().cloned());
    new_order.extend(siblings.iter().skip(insert_idx).cloned());

    for (i, nid) in new_order.iter().enumerate() {
        sqlx::query(
            "UPDATE nodes SET parent_id = ?1, sort_order = ?2 WHERE id = ?3 AND space_id = ?4",
        )
        .bind(&new_parent)
        .bind(i as i64)
        .bind(nid)
        .bind(space_id)
        .execute(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    for op in old_parents {
        if new_parent == op {
            continue;
        }
        renumber_children_tx(tx, space_id, op.as_deref()).await?;
    }

    Ok(())
}

#[command]
pub async fn nodes_move(app: AppHandle, request: MoveNodesRequest) -> Result<(), String> {
    if request.node_ids.is_empty() {
        return Ok(());
    }
    let pool = pool(&app);
    let moved: HashSet<String> = request.node_ids.iter().cloned().collect();

    if let Some(np) = &request.new_parent_id {
        if moved.contains(np) {
            return Err("Cannot move a node into itself".into());
        }
        if !node_exists_pool(&pool, np, &request.space_id).await? {
            return Err("New parent not found".into());
        }
        for mid in &request.node_ids {
            if is_descendant_of(&pool, &request.space_id, np.clone(), mid).await? {
                return Err("Cannot reparent into a descendant of a moved node".into());
            }
        }
    }

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    move_nodes_inner(
        &mut tx,
        &request.space_id,
        &request.node_ids,
        request.new_parent_id.clone(),
    )
    .await?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// Unpin nodes, then move them under `new_parent_id` in one transaction.
#[command]
pub async fn nodes_move_unpinned(
    app: AppHandle,
    request: MoveNodesUnpinnedRequest,
) -> Result<(), String> {
    if request.node_ids.is_empty() {
        return Ok(());
    }
    let pool = pool(&app);
    let moved: HashSet<String> = request.node_ids.iter().cloned().collect();

    if let Some(np) = &request.new_parent_id {
        if moved.contains(np) {
            return Err("Cannot move a node into itself".into());
        }
        if !node_exists_pool(&pool, np, &request.space_id).await? {
            return Err("New parent not found".into());
        }
        for mid in &request.node_ids {
            if is_descendant_of(&pool, &request.space_id, np.clone(), mid).await? {
                return Err("Cannot reparent into a descendant of a moved node".into());
            }
        }
    }

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for id in &request.node_ids {
        if !node_exists(&mut tx, id, &request.space_id).await? {
            return Err(format!("Node {} not found", id));
        }
        sqlx::query("UPDATE nodes SET is_pinned = 0 WHERE id = ?1 AND space_id = ?2")
            .bind(id)
            .bind(&request.space_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    move_nodes_inner(
        &mut tx,
        &request.space_id,
        &request.node_ids,
        request.new_parent_id.clone(),
    )
    .await?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// Restore all listed nodes to match a prior `nodes_list` snapshot (used for undo/redo).
#[command]
pub async fn nodes_apply_space_snapshot(
    app: AppHandle,
    request: ApplySpaceSnapshotRequest,
) -> Result<(), String> {
    let pool = pool(&app);
    for n in &request.nodes {
        if n.space_id != request.space_id {
            return Err("Snapshot node space_id mismatch".into());
        }
    }

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    sqlx::query("PRAGMA defer_foreign_keys = ON")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if request.nodes.is_empty() {
        sqlx::query("DELETE FROM nodes WHERE space_id = ?1")
            .bind(&request.space_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    } else {
        let placeholders = (0..request.nodes.len())
            .map(|_| "?")
            .collect::<Vec<_>>()
            .join(", ");

        let query_str = format!(
            "DELETE FROM nodes WHERE space_id = ? AND id NOT IN ({})",
            placeholders
        );

        let mut delete_query = sqlx::query(&query_str).bind(&request.space_id);
        for node in &request.nodes {
            delete_query = delete_query.bind(&node.id);
        }

        delete_query
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    for n in &request.nodes {
        sqlx::query(
            "INSERT INTO nodes (id, space_id, parent_id, name, content, is_pinned, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(id) DO UPDATE SET
               space_id = excluded.space_id,
               parent_id = excluded.parent_id,
               name = excluded.name,
               content = excluded.content,
               is_pinned = excluded.is_pinned,
               sort_order = excluded.sort_order",
        )
        .bind(&n.id)
        .bind(&request.space_id)
        .bind(&n.parent_id)
        .bind(&n.name)
        .bind(&n.content)
        .bind(if n.is_pinned { 1 } else { 0 })
        .bind(n.sort_order)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

async fn renumber_children_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    space_id: &str,
    parent_id: Option<&str>,
) -> Result<(), String> {
    let ids: Vec<String> = get_ordered_node_ids(tx, space_id, parent_id).await?;
    for (i, id) in ids.iter().enumerate() {
        sqlx::query("UPDATE nodes SET sort_order = ?1 WHERE id = ?2 AND space_id = ?3")
            .bind(i as i64)
            .bind(id.as_str())
            .bind(space_id)
            .execute(&mut **tx)
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
