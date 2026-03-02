import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { EditorSkeleton } from '@/components/editor/editor-skeleton';
import FullPageEditor from '@/components/editor/full-page-editor';
import { IndexPage } from '@/components/index/index-page';
import { WorkspaceSkeleton } from '@/components/skeletons/workspace-skeleton';
import { findFirstFileId, findNodeById } from '@/lib/file-tree';
import { resolveInitialSpaceId } from '@/lib/space-selection';
import EditorLayout from '@/layout/editor-layout';
import type { AppStore } from '@/store';
import { appApi, type WorkspaceSnapshot, type WorkspaceSpace } from '@/store/api/app-api';
import { selectActiveSpaceId, selectPendingFileId } from '@/store/selectors';
import { setActiveSpaceId } from '@/store/slices/ui-slice';
import { getLastOpenedFile, setLastOpenedFile } from '@/utils/last-opened';

interface RouterContext {
  store: AppStore;
}

let workspaceSubscription:
  | {
    unwrap: () => Promise<WorkspaceSnapshot>;
  }
  | null = null;

function ensureWorkspaceSubscription(store: AppStore) {
  if (workspaceSubscription) {
    return workspaceSubscription;
  }

  workspaceSubscription = store.dispatch(appApi.endpoints.getWorkspace.initiate());
  return workspaceSubscription;
}

async function ensureWorkspaceSelection(store: AppStore): Promise<{
  workspace: WorkspaceSnapshot;
  resolvedActiveSpaceId: string;
}> {
  const workspace = await ensureWorkspaceSubscription(store).unwrap();
  const currentActiveSpaceId = selectActiveSpaceId(store.getState());
  const resolvedActiveSpaceId = resolveInitialSpaceId(workspace.spaces, currentActiveSpaceId);

  if (resolvedActiveSpaceId !== currentActiveSpaceId) {
    store.dispatch(setActiveSpaceId(resolvedActiveSpaceId));
  }

  return { workspace, resolvedActiveSpaceId };
}

function resolvePreferredFileId(space: WorkspaceSpace): string | null {
  const lastOpenedFileId = getLastOpenedFile(space.id);

  if (lastOpenedFileId && findNodeById(space.fileTree, lastOpenedFileId)) {
    return lastOpenedFileId;
  }

  return findFirstFileId(space.fileTree);
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  loader: async ({ context }) => {
    await ensureWorkspaceSelection(context.store);
  },
  pendingComponent: WorkspaceSkeleton,
  component: () => (
    <EditorLayout>
      <Outlet />
    </EditorLayout>
  ),
  notFoundComponent: IndexPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: async ({ context }) => {
    const { workspace, resolvedActiveSpaceId } = await ensureWorkspaceSelection(context.store);

    if (!resolvedActiveSpaceId) {
      return;
    }

    const targetSpace = workspace.spaces.find((space) => space.id === resolvedActiveSpaceId);
    if (!targetSpace) {
      return;
    }

    const targetFileId = resolvePreferredFileId(targetSpace);
    if (targetFileId) {
      throw redirect({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId: targetSpace.id, fileId: targetFileId },
        replace: true,
      });
    }

    throw redirect({
      to: '/spaces/$spaceId',
      params: { spaceId: targetSpace.id },
      replace: true,
    });
  },
  component: IndexPage,
});

const spaceIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'spaces/$spaceId',
  loader: async ({ context, params }) => {
    const { workspace, resolvedActiveSpaceId } = await ensureWorkspaceSelection(context.store);
    const requestedSpace = workspace.spaces.find((space) => space.id === params.spaceId);

    if (!requestedSpace) {
      const fallbackSpaceId = resolvedActiveSpaceId || workspace.spaces[0]?.id;
      if (!fallbackSpaceId) {
        throw redirect({ to: '/', replace: true });
      }

      throw redirect({
        to: '/spaces/$spaceId',
        params: { spaceId: fallbackSpaceId },
        replace: true,
      });
    }

    const currentActiveSpaceId = selectActiveSpaceId(context.store.getState());
    if (currentActiveSpaceId !== requestedSpace.id) {
      context.store.dispatch(setActiveSpaceId(requestedSpace.id));
    }

    const targetFileId = resolvePreferredFileId(requestedSpace);
    if (!targetFileId) {
      return;
    }

    throw redirect({
      to: '/spaces/$spaceId/files/$fileId',
      params: { spaceId: requestedSpace.id, fileId: targetFileId },
      replace: true,
    });
  },
  pendingComponent: WorkspaceSkeleton,
  component: IndexPage,
});

const fileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'spaces/$spaceId/files/$fileId',
  loader: async ({ context, params }) => {
    const { workspace, resolvedActiveSpaceId } = await ensureWorkspaceSelection(context.store);
    const requestedSpace = workspace.spaces.find((space) => space.id === params.spaceId);

    if (!requestedSpace) {
      const fallbackSpaceId = resolvedActiveSpaceId || workspace.spaces[0]?.id;
      if (!fallbackSpaceId) {
        throw redirect({ to: '/', replace: true });
      }

      throw redirect({
        to: '/spaces/$spaceId',
        params: { spaceId: fallbackSpaceId },
        replace: true,
      });
    }

    const currentActiveSpaceId = selectActiveSpaceId(context.store.getState());
    if (currentActiveSpaceId !== requestedSpace.id) {
      context.store.dispatch(setActiveSpaceId(requestedSpace.id));
    }

    const pendingFileId = selectPendingFileId(context.store.getState());
    if (pendingFileId && pendingFileId === params.fileId) {
      return;
    }

    if (findNodeById(requestedSpace.fileTree, params.fileId)) {
      setLastOpenedFile(requestedSpace.id, params.fileId);
      return;
    }

    const targetFileId = resolvePreferredFileId(requestedSpace);
    if (targetFileId) {
      throw redirect({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId: requestedSpace.id, fileId: targetFileId },
        replace: true,
      });
    }

    throw redirect({
      to: '/spaces/$spaceId',
      params: { spaceId: requestedSpace.id },
      replace: true,
    });
  },
  pendingComponent: EditorSkeleton,
  component: FullPageEditor,
});

const routeTree = rootRoute.addChildren([indexRoute, spaceIndexRoute, fileRoute]);

export const router = createRouter({
  routeTree,
  context: {
    store: undefined!,
  },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
