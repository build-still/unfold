import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import * as db from '@/services/database';
import {
  getKeybindings,
  getLayoutSettings,
  saveKeybindings,
  updateLayoutSettings,
  type Keybindings,
} from '@/services/settings-store';
import { Layout } from '@/types/layout';
import { Node } from '@/types/sidebar';

export interface WorkspaceSpace {
  id: string;
  name: string;
  fileTree: Node[];
  pinnedNodes: Node[];
}

export interface WorkspaceSnapshot {
  spaces: WorkspaceSpace[];
}

interface AppApiError {
  message: string;
}

function toError(error: unknown): AppApiError {
  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Unknown error' };
}

function toPinnedNodes(rows: db.NodeRow[]): Node[] {
  return rows
    .filter((row) => row.is_pinned === 1)
    .map((row) => ({
      id: row.id,
      name: row.name,
      content: row.content ?? undefined,
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
      isPinned: true,
    }));
}

function updateNodeInTree(nodes: Node[], id: string, updater: (node: Node) => void): boolean {
  for (const node of nodes) {
    if (node.id === id) {
      updater(node);
      return true;
    }

    if (node.nodes && updateNodeInTree(node.nodes, id, updater)) {
      return true;
    }
  }

  return false;
}

function insertNodeInTree(nodes: Node[], parentId: string | null, node: Node): boolean {
  if (parentId === null) {
    nodes.push(node);
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    return true;
  }

  for (const currentNode of nodes) {
    if (currentNode.id === parentId) {
      if (!currentNode.nodes) {
        currentNode.nodes = [];
      }
      currentNode.nodes.push(node);
      currentNode.nodes.sort((a, b) => a.name.localeCompare(b.name));
      currentNode.isOpen = true;
      return true;
    }

    if (currentNode.nodes && insertNodeInTree(currentNode.nodes, parentId, node)) {
      return true;
    }
  }

  return false;
}

async function loadWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const spaceRows = await db.getSpaces();

  const spaces = await Promise.all(
    spaceRows.map(async (spaceRow) => {
      const nodeRows = await db.getNodesBySpace(spaceRow.id);

      return {
        id: spaceRow.id,
        name: spaceRow.name,
        fileTree: db.buildNodeTree(nodeRows),
        pinnedNodes: toPinnedNodes(nodeRows),
      };
    }),
  );

  return { spaces };
}

export const appApi = createApi({
  reducerPath: 'appApi',
  baseQuery: fakeBaseQuery<AppApiError>(),
  tagTypes: ['Workspace', 'Layout', 'Keybindings'],
  endpoints: (builder) => ({
    getWorkspace: builder.query<WorkspaceSnapshot, void>({
      queryFn: async () => {
        try {
          const data = await loadWorkspaceSnapshot();
          return { data };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      providesTags: [{ type: 'Workspace', id: 'ROOT' }],
    }),

    createSpace: builder.mutation<{ id: string }, { id: string; name?: string }>({
      queryFn: async ({ id, name }) => {
        try {
          const normalizedName = name?.trim() ? name.trim() : 'new Space';
          const existingSpaces = await db.getSpaces();

          await db.createSpace({
            id,
            name: normalizedName,
            sort_order: existingSpaces.length,
          });

          return { data: { id } };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      async onQueryStarted({ id, name }, { dispatch, queryFulfilled }) {
        const normalizedName = name?.trim() ? name.trim() : 'new Space';
        const patchResult = dispatch(
          appApi.util.updateQueryData('getWorkspace', undefined, (draft) => {
            const alreadyExists = draft.spaces.some((space) => space.id === id);
            if (alreadyExists) {
              return;
            }

            draft.spaces.push({
              id,
              name: normalizedName,
              fileTree: [],
              pinnedNodes: [],
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [{ type: 'Workspace', id: 'ROOT' }],
    }),

    renameSpace: builder.mutation<void, { id: string; name: string }>({
      queryFn: async ({ id, name }) => {
        try {
          await db.updateSpace(id, name.trim());
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      invalidatesTags: [{ type: 'Workspace', id: 'ROOT' }],
    }),

    deleteSpace: builder.mutation<void, { id: string }>({
      queryFn: async ({ id }) => {
        try {
          await db.deleteSpace(id);
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      invalidatesTags: [{ type: 'Workspace', id: 'ROOT' }],
    }),

    addNode: builder.mutation<
      { id: string },
      { id: string; spaceId: string; parentId: string | null }
    >({
      queryFn: async ({ id, spaceId, parentId }) => {
        try {
          await db.createNode({
            id,
            space_id: spaceId,
            parent_id: parentId,
            name: '',
            content: '',
            is_open: 0,
          });

          return { data: { id } };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      async onQueryStarted({ id, spaceId, parentId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          appApi.util.updateQueryData('getWorkspace', undefined, (draft) => {
            const space = draft.spaces.find((item) => item.id === spaceId);
            if (!space) {
              return;
            }

            insertNodeInTree(space.fileTree, parentId, {
              id,
              name: '',
              content: '',
              isOpen: false,
              isPinned: false,
              nodes: [],
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    updateNodeContent: builder.mutation<void, { id: string; content: string }>({
      queryFn: async ({ id, content }) => {
        try {
          await db.updateNodeContent(id, content);
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      async onQueryStarted({ id, content }, { dispatch, queryFulfilled }) {
        const updatedAt = new Date().toISOString();
        const patchResult = dispatch(
          appApi.util.updateQueryData('getWorkspace', undefined, (draft) => {
            draft.spaces.forEach((space) => {
              if (updateNodeInTree(space.fileTree, id, (node) => {
                node.content = content;
                node.updatedAt = updatedAt;
              })) {
                space.pinnedNodes.forEach((node) => {
                  if (node.id === id) {
                    node.content = content;
                    node.updatedAt = updatedAt;
                  }
                });
              }
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    renameNode: builder.mutation<void, { id: string; name: string }>({
      queryFn: async ({ id, name }) => {
        try {
          await db.updateNode(id, { name: name.trim() });
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      async onQueryStarted({ id, name }, { dispatch, queryFulfilled }) {
        const normalizedName = name.trim();
        const patchResult = dispatch(
          appApi.util.updateQueryData('getWorkspace', undefined, (draft) => {
            draft.spaces.forEach((space) => {
              if (updateNodeInTree(space.fileTree, id, (node) => {
                node.name = normalizedName;
              })) {
                space.pinnedNodes.forEach((node) => {
                  if (node.id === id) {
                    node.name = normalizedName;
                  }
                });
              }
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    toggleNodeOpen: builder.mutation<void, { id: string; isOpen: boolean }>({
      queryFn: async ({ id, isOpen }) => {
        try {
          await db.toggleNodeOpen(id, isOpen);
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      async onQueryStarted({ id, isOpen }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          appApi.util.updateQueryData('getWorkspace', undefined, (draft) => {
            draft.spaces.forEach((space) => {
              updateNodeInTree(space.fileTree, id, (node) => {
                node.isOpen = isOpen;
              });
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    toggleNodePinned: builder.mutation<void, { id: string; isPinned: boolean }>({
      queryFn: async ({ id, isPinned }) => {
        try {
          await db.toggleNodePinned(id, isPinned);
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      invalidatesTags: [{ type: 'Workspace', id: 'ROOT' }],
    }),

    deleteNode: builder.mutation<void, { id: string }>({
      queryFn: async ({ id }) => {
        try {
          await db.deleteNode(id);
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      invalidatesTags: [{ type: 'Workspace', id: 'ROOT' }],
    }),

    getLayout: builder.query<Layout, void>({
      queryFn: async () => {
        try {
          const layout = await getLayoutSettings();
          return { data: layout };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      providesTags: [{ type: 'Layout', id: 'ROOT' }],
    }),

    updateLayout: builder.mutation<Layout, Partial<Layout>>({
      queryFn: async (updates) => {
        try {
          const layout = await updateLayoutSettings(updates);
          return { data: layout };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      async onQueryStarted(updates, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          appApi.util.updateQueryData('getLayout', undefined, (draft) => {
            Object.assign(draft, updates);
          }),
        );

        try {
          const { data } = await queryFulfilled;
          if (data) {
            dispatch(
              appApi.util.updateQueryData('getLayout', undefined, (draft) => {
                Object.assign(draft, data);
              }),
            );
          }
        } catch {
          patchResult.undo();
        }
      },
    }),

    getKeybindings: builder.query<Keybindings, void>({
      queryFn: async () => {
        try {
          const keybindings = await getKeybindings();
          return { data: keybindings };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      providesTags: [{ type: 'Keybindings', id: 'ROOT' }],
    }),

    updateKeybindings: builder.mutation<void, Keybindings>({
      queryFn: async (keybindings) => {
        try {
          await saveKeybindings(keybindings);
          return { data: undefined };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      invalidatesTags: [{ type: 'Keybindings', id: 'ROOT' }],
    }),
  }),
});

export const {
  useGetWorkspaceQuery,
  useCreateSpaceMutation,
  useRenameSpaceMutation,
  useDeleteSpaceMutation,
  useAddNodeMutation,
  useUpdateNodeContentMutation,
  useRenameNodeMutation,
  useToggleNodeOpenMutation,
  useToggleNodePinnedMutation,
  useDeleteNodeMutation,
  useGetLayoutQuery,
  useUpdateLayoutMutation,
  useGetKeybindingsQuery,
  useUpdateKeybindingsMutation,
} = appApi;
