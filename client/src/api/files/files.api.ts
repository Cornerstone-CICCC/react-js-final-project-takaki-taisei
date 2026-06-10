import { mockFiles, mockFolders } from "../../features/dashboard/mockData";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function getAllFolders() {
  // replace with real fetch to backend
  return mockFolders;
}

export async function getAllFiles() {
  // replace with real fetch to backend
  return mockFiles;
}

export async function getFolderById(id: string) {
  // replace with real backend

  const folder = mockFolders.find((f) => f.id === id);

  if (!folder) {
    throw new Error("No folder found");
  }

  return folder;
}

export async function getFileById(id: string) {
  const file = mockFiles.find((f) => f.id === id);
  if (!file) {
    throw new Error("No file found");
  }

  return file;
}
