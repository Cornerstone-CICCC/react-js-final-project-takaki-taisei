// The two kinds of node in the pseudo file system.
export const NodeType = { FILE: "FILE", FOLDER: "FOLDER" } as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

// Public API alias resolved to the authenticated user's generated root folder id.
export const ROOT_ID = "root";
