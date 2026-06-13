import type { NodeItem, TreeNode } from "../types";

export function flattenFolders(tree: TreeNode): NodeItem[] {
  const folders: NodeItem[] = [];

  function walk(node: TreeNode) {
    if (node.type === "FOLDER") {
      folders.push(node);
    }

    (node.children ?? []).forEach(walk);
  }

  walk(tree);

  return folders;
}
