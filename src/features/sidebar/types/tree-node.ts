/** Hierarchical node for the notes outline (includes pinned nodes under their parent). */
export type TreeNode = {
  id: string;
  title: string;
  sortOrder: number;
  children: TreeNode[];
};
