const RECENTLY_CREATED_NODE_TTL_MS = 1200;

const recentlyCreatedNodes = new Map<string, number>();

export function markNodeAsRecentlyCreated(nodeId: string): void {
  recentlyCreatedNodes.set(nodeId, Date.now());
}

export function consumeRecentlyCreatedNode(nodeId: string): boolean {
  const createdAt = recentlyCreatedNodes.get(nodeId);
  if (!createdAt) {
    return false;
  }

  const isFresh = Date.now() - createdAt <= RECENTLY_CREATED_NODE_TTL_MS;
  recentlyCreatedNodes.delete(nodeId);
  return isFresh;
}
