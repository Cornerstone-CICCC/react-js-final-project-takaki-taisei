import { HardDrive } from "lucide-react";
import type { TreeNode } from "../types";
import DashboardSideBarItem from "./DashboardSideBarItem";

type Props = {
  folder: TreeNode | null;
  currentFolderId: string | null;
  onFolderClick: (id: string) => void;
};

function DashboardSideBar({ folder, onFolderClick, currentFolderId }: Props) {
  return (
    <aside className="hidden lg:flex flex-col gap-sm p-md w-[280px] h-full bg-surface border-r border-outline-variant fixed left-0 top-16">
      <div className="mb-6">
        <p className="text-lg font-semibold text-slate-900">VaultBox</p>
        <p className="text-sm text-slate-500">Your secure drive</p>
      </div>
      <button
        type="button"
        onClick={() => onFolderClick("root")}
        className="flex items-center gap-md bg-primary-container text-on-primary-container rounded-lg px-md py-sm transition-all"
      >
        <HardDrive />
        My Drive
      </button>
      {folder?.children.map((f) => (
        <DashboardSideBarItem
          folder={f}
          currentFolderId={currentFolderId}
          onFolderClick={onFolderClick}
          depth={0}
        />
      ))}
    </aside>
  );
}

export default DashboardSideBar;
