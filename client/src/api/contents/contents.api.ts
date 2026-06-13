import type {
  GetNodeResponse,
  NodeItem,
  TreeNode,
} from "../../features/dashboard/types";
import { userStore } from "../../store/userStore";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api";

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    userStore.getState().clearUser();
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request Failed");
  }
  return data.data;
}

export async function getTree(): Promise<TreeNode> {
  const data = request<TreeNode>("/tree");
  return data;
}

export async function getNode(
  id: string,
  signal?: AbortSignal,
): Promise<GetNodeResponse> {
  const data = request<GetNodeResponse>(`/nodes/${id}`, { signal });
  return data;
}

export async function createFolder(
  name: string,
  parentId: string,
): Promise<NodeItem> {
  const options = {
    method: "POST",
    body: JSON.stringify({ name, parentId, type: "FOLDER" }),
  };
  const data = request<NodeItem>("/nodes", options);
  return data;
}

export async function createTextFile(
  name: string,
  content: string,
  parentId: string,
): Promise<NodeItem> {
  const options = {
    method: "POST",
    body: JSON.stringify({ name, content, parentId, type: "FILE" }),
  };

  const data = request<NodeItem>("/nodes", options);
  return data;
}

export async function renameNode(id: string, name: string, content?: string) {
  const options = { method: "PATCH", body: JSON.stringify({ name, content }) };
  const data = request<NodeItem>(`/nodes/${id}`, options);
  return data;
}

export async function searchNodes(query: string): Promise<NodeItem[]> {
  const data = request<NodeItem[]>(`/search?q=${encodeURIComponent(query)}`);
  return data;
}

export async function deleteNode(id: string) {
  const options = { method: "DELETE" };

  const data = request<NodeItem>(`/nodes/${id}`, options);
  return data;
}

export async function uploadBinaryFile(
  file: File,
  parentId: string,
): Promise<NodeItem> {
  const form = new FormData();

  form.append("file", file);
  form.append("parentId", parentId);

  const res = await fetch(`${backendUrl}/nodes/upload`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    userStore.getState().clearUser();
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Failed to upload");
  }

  return data.data;
}

export function getRawNodeUrl(id: string) {
  return `${backendUrl}/nodes/${id}/raw`;
}
