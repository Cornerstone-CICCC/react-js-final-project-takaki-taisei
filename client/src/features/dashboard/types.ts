export type NodeType = "file" | "folder";

export type NodeItem = {
  id: string;
  name: string;
  type: NodeType;
  content: string | null;
  mimeType: string | null;
  size: number | null;
  parentId: string | null;
  isBinary?: boolean;
  rawUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type BreadCrumb = { id: string; name: string };

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "updated-asc"
  | "updated-desc";

export type ViewMode = "grid" | "list";
