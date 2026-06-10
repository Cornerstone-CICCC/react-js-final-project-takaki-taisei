import type { FolderItem } from "../types";
import DashboardSideBarItem from "./DashboardSideBarItem";

type Props = {
  folders: FolderItem[];
  currentFolderId: string | null;
  onFolderClick: (id: string | null) => void;
};

function DashboardSideBar({ folders, onFolderClick, currentFolderId }: Props) {
  const rootFolders = folders.filter((f) => f.parentId === null);

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <div className="mb-6">
        <p className="text-lg font-semibold text-slate-900">VaultBox</p>
        <p className="text-sm text-slate-500">Your secure drive</p>
      </div>
      <button type="button" onClick={() => onFolderClick(null)}>
        My Drive
      </button>
      {rootFolders.map((f) => (
        <DashboardSideBarItem
          folder={f}
          folders={folders}
          currentFolderId={currentFolderId}
          onFolderClick={onFolderClick}
          depth={0}
        />
      ))}
    </aside>
  );
}

export default DashboardSideBar;
