export type NodeType = "FILE" | "FOLDER";

export type BreadCrumb = { id: string; name: string };

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
  path?: BreadCrumb[];
};

export type GetNodeResponse = NodeItem & {
  path: BreadCrumb[];
  children?: NodeItem[];
};

export type TreeNode = NodeItem & { children: TreeNode[] };

export type SortOption = "newest" | "name" | "size";

export type ViewMode = "grid" | "list";

// examples
// const tree: TreeNode = {
//   id: "root",
//   name: "VaultBox Root",
//   type: "folder",
//   content: null,
//   mimeType: null,
//   size: null,
//   parentId: null,
//   createdAt: "2026-06-10T10:00:00.000Z",
//   updatedAt: "2026-06-10T10:00:00.000Z",
//   children: [
//     {
//       id: "folder_1",
//       name: "Documents",
//       type: "folder",
//       content: null,
//       mimeType: null,
//       size: null,
//       parentId: "root",
//       createdAt: "2026-06-10T10:00:00.000Z",
//       updatedAt: "2026-06-10T10:00:00.000Z",
//       children: [
//         {
//           id: "file_1",
//           name: "resume.pdf",
//           type: "file",
//           content: null,
//           mimeType: "application/pdf",
//           size: 240000,
//           parentId: "folder_1",
//           isBinary: true,
//           rawUrl: "https://storage.example.com/resume.pdf",
//           createdAt: "2026-06-10T10:02:00.000Z",
//           updatedAt: "2026-06-10T10:02:00.000Z",
//           children: [],
//         },
//         {
//           id: "file_2",
//           name: "notes.txt",
//           type: "file",
//           content: "Today I learned how tree structures work.",
//           mimeType: "text/plain",
//           size: 42,
//           parentId: "folder_1",
//           createdAt: "2026-06-10T10:03:00.000Z",
//           updatedAt: "2026-06-10T10:03:00.000Z",
//           children: [],
//         },
//       ],
//     },
//     {
//       id: "folder_2",
//       name: "Images",
//       type: "folder",
//       content: null,
//       mimeType: null,
//       size: null,
//       parentId: "root",
//       createdAt: "2026-06-10T10:01:00.000Z",
//       updatedAt: "2026-06-10T10:01:00.000Z",
//       children: [
//         {
//           id: "file_3",
//           name: "profile.png",
//           type: "file",
//           content: null,
//           mimeType: "image/png",
//           size: 89000,
//           parentId: "folder_2",
//           isBinary: true,
//           rawUrl: "https://storage.example.com/profile.png",
//           createdAt: "2026-06-10T10:04:00.000Z",
//           updatedAt: "2026-06-10T10:04:00.000Z",
//           children: [],
//         },
//       ],
//     },
//     {
//       id: "file_4",
//       name: "todo.txt",
//       type: "file",
//       content: "Build VaultBox dashboard",
//       mimeType: "text/plain",
//       size: 24,
//       parentId: "root",
//       createdAt: "2026-06-10T10:05:00.000Z",
//       updatedAt: "2026-06-10T10:05:00.000Z",
//       children: [],
//     },
//   ],
// };
