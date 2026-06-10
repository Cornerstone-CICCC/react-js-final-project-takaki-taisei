import { useState } from "react";
import type { SortOption, ViewMode } from "../features/dashboard/types";
import { mockFiles, mockFolders } from "../features/dashboard/mockData";
import DashboardSideBar from "../features/dashboard/components/DashboardSideBar";

function Dashboard() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const displayFolders = mockFolders.filter(
    (folder) => folder.parentId === currentFolderId,
  );

  const displayFiles = mockFiles.filter(
    (file) => file.parentId === currentFolderId,
  );

  function onFolderClick(id: string | null) {
    setCurrentFolderId(id);
  }

  return (
    <div>
      <DashboardSideBar
        folders={mockFolders}
        onFolderClick={onFolderClick}
        currentFolderId={currentFolderId}
      />
      <main></main>
    </div>
  );
}

export default Dashboard;
