export const nodeQueryKeys = {
  all: ['nodes'] as const,
  space: (spaceId: string) => [...nodeQueryKeys.all, spaceId] as const,
};
