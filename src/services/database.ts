import Database from "@tauri-apps/plugin-sql";
import { appDataDir, join } from "@tauri-apps/api/path";
import { Node } from "../types/sidebar";
import { getDatabaseFileName } from "@/config/database";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    const dbName = getDatabaseFileName();
    const dataDir = await appDataDir();
    const dbPath = await join(dataDir, dbName);
    const dbUrl = `sqlite:${dbPath}`;
    db = await Database.load(dbUrl);
  }
  return db;
}

export interface SpaceRow {
  id: string;
  name: string;
  sort_order: number;
}

export interface NodeRow {
  id: string;
  space_id: string;
  parent_id: string | null;
  name: string;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_open: number;
  sort_order: number;
  is_pinned: number;
}

export async function getSpaces(): Promise<SpaceRow[]> {
  const database = await getDb();
  return await database.select<SpaceRow[]>("SELECT * FROM spaces ORDER BY sort_order");
}

export async function createSpace(space: SpaceRow): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT INTO spaces (id, name, sort_order) VALUES ($1, $2, $3)",
    [space.id, space.name, space.sort_order]
  );
}

export async function updateSpace(id: string, name: string): Promise<void> {
  const database = await getDb();
  await database.execute("UPDATE spaces SET name = $1 WHERE id = $2", [name, id]);
}

export async function deleteSpace(id: string): Promise<void> {
  const database = await getDb();
  // Delete all nodes in this space first
  await database.execute("DELETE FROM nodes WHERE space_id = $1", [id]);
  // Then delete the space
  await database.execute("DELETE FROM spaces WHERE id = $1", [id]);
}

export async function getNodesBySpace(spaceId: string): Promise<NodeRow[]> {
  const database = await getDb();
  return await database.select<NodeRow[]>(
    "SELECT * FROM nodes WHERE space_id = $1 ORDER BY sort_order",
    [spaceId]
  );
}

export async function createNode(node: {
  id: string;
  space_id: string;
  parent_id: string | null;
  name: string;
  content: string | null;
  is_open: number;
  is_pinned?: number;
}): Promise<void> {
  const database = await getDb();
  
  // Get max sort_order for this parent/space
  const maxOrderResult = await database.select<Array<{ max_order: number | null }>>(
    node.parent_id
      ? "SELECT MAX(sort_order) as max_order FROM nodes WHERE parent_id = $1"
      : "SELECT MAX(sort_order) as max_order FROM nodes WHERE space_id = $1 AND parent_id IS NULL",
    [node.parent_id || node.space_id]
  );
  const sortOrder = (maxOrderResult[0]?.max_order ?? -1) + 1;
  
  await database.execute(
    "INSERT INTO nodes (id, space_id, parent_id, name, content, is_open, sort_order, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [
      node.id,
      node.space_id,
      node.parent_id,
      node.name,
      node.content,
      node.is_open,
      sortOrder,
      node.is_pinned ?? 0,
    ]
  );
}

export async function updateNode(
  id: string,
  updates: Partial<{
    name: string;
    content: string;
    is_open: number;
  }>
): Promise<void> {
  const database = await getDb();
  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (updates.name !== undefined) {
    fields.push("name = $" + (values.length + 1));
    values.push(updates.name);
  }
  if (updates.content !== undefined) {
    fields.push("content = $" + (values.length + 1));
    values.push(updates.content);
  }
  if (updates.is_open !== undefined) {
    fields.push("is_open = $" + (values.length + 1));
    values.push(updates.is_open);
  }

  if (fields.length === 0) return;

  values.push(id);
  await database.execute(
    `UPDATE nodes SET ${fields.join(", ")} WHERE id = $${values.length}`,
    values
  );
}

export async function updateNodeContent(
  id: string,
  content: string,
  name?: string
): Promise<void> {
  const database = await getDb();
  if (name !== undefined) {
    await database.execute(
      "UPDATE nodes SET content = $1, name = $2 WHERE id = $3",
      [content, name, id]
    );
  } else {
    await database.execute(
      "UPDATE nodes SET content = $1 WHERE id = $2",
      [content, id]
    );
  }
}

export async function toggleNodeOpen(id: string, isOpen: boolean): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE nodes SET is_open = $1 WHERE id = $2",
    [isOpen ? 1 : 0, id]
  );
}

export async function toggleNodePinned(id: string, isPinned: boolean): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE nodes SET is_pinned = $1 WHERE id = $2",
    [isPinned ? 1 : 0, id]
  );
}

export async function getPinnedNodes(spaceId: string): Promise<NodeRow[]> {
  const database = await getDb();
  return await database.select<NodeRow[]>(
    "SELECT * FROM nodes WHERE space_id = $1 AND is_pinned = 1 ORDER BY name",
    [spaceId]
  );
}

export async function deleteNode(id: string): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM nodes WHERE id = $1", [id]);
}

export async function deleteNodeAndChildren(id: string): Promise<void> {
  const database = await getDb();
  // This is a simplified version - you might need a recursive CTE for proper deletion
  await database.execute("DELETE FROM nodes WHERE id = $1 OR parent_id = $1", [id]);
}

// Sort nodes alphabetically by name
function sortNodesByName(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
}

// Recursively sort all nodes in the tree
function sortTreeRecursively(nodes: Node[]): Node[] {
  return sortNodesByName(nodes).map(node => {
    if (node.nodes && node.nodes.length > 0) {
      return { ...node, nodes: sortTreeRecursively(node.nodes) };
    }
    return node;
  });
}

export function buildNodeTree(rows: NodeRow[]): Node[] {
  const nodeMap = new Map<string, Node>();
  const rootNodes: Node[] = [];

  // First pass: create all nodes without children arrays
  for (const row of rows) {
    nodeMap.set(row.id, {
      id: row.id,
      name: row.name,
      content: row.content || undefined,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
      isOpen: Boolean(row.is_open),
      isPinned: Boolean(row.is_pinned),
    });
  }

  // Second pass: build tree structure and add nodes arrays only to parents
  for (const row of rows) {
    const node = nodeMap.get(row.id)!;
    if (row.parent_id) {
      const parent = nodeMap.get(row.parent_id);
      if (parent) {
        // Initialize nodes array on parent if it doesn't exist
        if (!parent.nodes) {
          parent.nodes = [];
        }
        parent.nodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  // Always sort the tree alphabetically by name to ensure consistent ordering
  return sortTreeRecursively(rootNodes);
}
