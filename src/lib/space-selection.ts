interface SpaceLike {
  id: string;
  name: string;
}

export function resolveInitialSpaceId(spaces: SpaceLike[], preferredId: string): string {
  if (spaces.length === 0) {
    return '';
  }

  if (preferredId && spaces.some((space) => space.id === preferredId)) {
    return preferredId;
  }

  const mineSpace = spaces.find((space) => space.name === 'mine');
  return mineSpace?.id ?? spaces[0].id;
}
