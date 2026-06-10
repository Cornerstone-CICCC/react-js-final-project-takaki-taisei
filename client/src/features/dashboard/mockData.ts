import type { FileItem, FolderItem } from "./types";

export const mockFolders: FolderItem[] = [
  {
    id: "folder_documents",
    name: "Documents",
    parentId: null,
    createdAt: "2026-06-01",
    updatedAt: "2026-06-01",
  },
  {
    id: "folder_images",
    name: "Images",
    parentId: null,
    createdAt: "2026-06-01",
    updatedAt: "2026-06-01",
  },
  {
    id: "folder_videos",
    name: "Videos",
    parentId: null,
    createdAt: "2026-06-01",
    updatedAt: "2026-06-01",
  },
  {
    id: "folder_school",
    name: "School",
    parentId: "folder_documents",
    createdAt: "2026-06-02",
    updatedAt: "2026-06-02",
  },
];

export const mockFiles: FileItem[] = [
  {
    id: "file_assignment",
    name: "assignment.pdf",
    mimeType: "application/pdf",
    size: 120_000,
    parentId: "folder_school",
    createdAt: "2026-06-03",
    updatedAt: "2026-06-03",
  },
  {
    id: "file_profile",
    name: "profile.png",
    mimeType: "image/png",
    size: 280_000,
    parentId: "folder_images",
    createdAt: "2026-06-03",
    updatedAt: "2026-06-03",
  },
  {
    id: "file_demo",
    name: "demo.mp4",
    mimeType: "video/mp4",
    size: 4_200_000,
    parentId: "folder_videos",
    createdAt: "2026-06-04",
    updatedAt: "2026-06-04",
  },
];
