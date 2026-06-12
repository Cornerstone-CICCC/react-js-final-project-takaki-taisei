// Clicks this item => fetch folders/items with this parentId

import { useState } from "react";
import type { TreeNode } from "../types";
import { ChevronRight, Folder, File } from "lucide-react";

type Props = {
  folder: TreeNode;
  currentFolderId: string | null;
  onFolderClick: (id: string) => void;
  depth: number;
};

function DashboardSideBarItem({
  folder,
  currentFolderId,
  onFolderClick,
  depth,
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const hasChildren =
    folder.children &&
    folder.children.length > 0 &&
    folder.children.some((child) => child.type === "FOLDER");
  const isActive = currentFolderId === folder.id;

  return (
    <div>
      <div
        className="flex items-center"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-8 w-6 items-center justify-center text-slate-400"
        >
          {hasChildren ? (
            <ChevronRight
              size={16}
              className={
                isOpen
                  ? "rotate-90 transition-transform"
                  : "transition-transform"
              }
            />
          ) : (
            <span className="w-4" />
          )}
        </button>

        {/* This button is actual folder  */}
        <button
          type="button"
          onClick={() => {
            folder.type === "FOLDER" && onFolderClick(folder.id);
          }}
          className={`flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
            isActive
              ? "bg-blue-50 font-medium text-blue-700"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {folder.type === "FOLDER" ? <Folder size={16} /> : <File size={16} />}
          <span className="truncate w-40">{folder.name}</span>
        </button>
      </div>

      {isOpen &&
        hasChildren &&
        folder.children
          .filter((f) => f.type === "FOLDER")
          .map((folder) => (
            <DashboardSideBarItem
              key={folder.id}
              folder={folder}
              onFolderClick={onFolderClick}
              depth={depth + 1}
              currentFolderId={currentFolderId}
            />
          ))}
    </div>
  );
}

export default DashboardSideBarItem;
