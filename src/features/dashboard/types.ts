export type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FileItem = {
  id: string;
  name: string;
  parentId: string | null;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
};

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "updated-asc"
  | " updated-desc";

export type ViewMode = "grid" | "list";
