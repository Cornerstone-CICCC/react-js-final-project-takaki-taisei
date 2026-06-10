// The two kinds of node in the pseudo file system.
export const NodeType = {
  FILE: 'FILE',
  FOLDER: 'FOLDER',
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

// Fixed id of the single root folder (seeded once). Everything lives under it.
export const ROOT_ID = 'root';
