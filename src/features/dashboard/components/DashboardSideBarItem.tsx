// Clicks this item => fetch folders/items with this parentId

import { useState } from "react";
import type { FolderItem } from "../types";
import { ChevronRight, Folder } from "lucide-react";

type Props = {
  folder: FolderItem;
  folders: FolderItem[];
  currentFolderId: string | null;
  onFolderClick: (id: string | null) => void;
  depth: number;
};

function DashboardSideBarItem({
  folder,
  folders,
  currentFolderId,
  onFolderClick,
  depth,
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // find all folders whose parent id matches with this folder
  const childFolders = folders.filter(
    (folder) => folder.parentId === folder.id,
  );

  const hasChildren = childFolders.length > 0;
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
          onClick={() => onFolderClick(folder.id)}
          className={`flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
            isActive
              ? "bg-blue-50 font-medium text-blue-700"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Folder size={16} />
          <span className="truncate">{folder.name}</span>
        </button>
      </div>

      {isOpen &&
        childFolders.map((folder) => (
          <DashboardSideBarItem
            folder={folder}
            folders={folders}
            onFolderClick={onFolderClick}
            depth={depth + 1}
            currentFolderId={currentFolderId}
          />
        ))}
    </div>
  );
}

export default DashboardSideBarItem;
