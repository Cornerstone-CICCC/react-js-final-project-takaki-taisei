import type { FolderItem } from "../types";
import DashboardSideBarItem from "./DashboardSideBarItem";

type Props = { folders: FolderItem[] };

function DashboardSideBar({ folders }: Props) {
  return (
    <div>
      {folders.map((f) => (
        <DashboardSideBarItem folder={f} />
      ))}
    </div>
  );
}

export default DashboardSideBar;
