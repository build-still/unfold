export const paths = {
  space: {
    root: {
      path: '/',
      getHref: (spaceId: string) => `/space/${spaceId}`,
    },
    node: {
      path: '/space/:spaceId/node/:nodeId',
      getHref: (spaceId: string, nodeId: string) =>
        `/space/${spaceId}/node/${nodeId}`,
    },
    // Use this for sidebar click fallbacks when no node is selected yet.
    defaultNode: {
      path: '/space/:spaceId/node/:nodeId',
      getHref: (spaceId: string, nodeId: string) =>
        `/space/${spaceId}/node/${nodeId}`,
    },
  },
} as const;
