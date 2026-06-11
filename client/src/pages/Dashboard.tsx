// - Set the current Id
// - fetch nodes that have parent id of the current id
// - set currentFolderId
// - main page displays the contents whose parent id matches with the currentFolderId
// - Whenever user clicks folder, change the currentFolder id to that folder.id
// - Whenever currentFolderId changes, it fetches the contents

import { useEffect, useState } from "react";
import {
  type TreeNode,
  type BreadCrumb,
  type NodeItem,
  type SortOption,
  type ViewMode,
} from "../features/dashboard/types";

import DashboardSideBar from "../features/dashboard/components/DashboardSideBar";
import { getNode, getTree } from "../api/contents/contents.api";
import Spinner from "../components/Spinner";

import FolderCard from "../features/dashboard/components/FolderCard";
import DashboardHeader from "../components/DashboardHeader";
import FileCard from "../features/dashboard/components/FileCard";
import { ArrowDown, FolderPlus, Grid2x2, List, Upload } from "lucide-react";
import BreadCrumbComponent from "../features/dashboard/components/BreadCrumbComponent";
import { toast } from "sonner";

function Dashboard() {
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [currentFolderName, setCurrentFolderName] = useState<string>("Root");
  const [children, setChildren] = useState<NodeItem[]>([]);
  const [breadCrumbs, setBreadCrumbs] = useState<BreadCrumb[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [tree, setTree] = useState<TreeNode | null>(null);

  // const [searchQuery, setSearchQuery] = useState<string>("");
  // const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const allFolders = children.filter((node) => node.type === "FOLDER");
  const allFiles = children.filter((node) => node.type === "FILE");

  function onFolderClick(id: string) {
    setCurrentFolderId(id);
  }

  // Fetch nodes everytime currentId changes
  useEffect(() => {
    async function getNodes() {
      try {
        setIsLoading(true);
        const node = await getNode(currentFolderId);

        node.children && setChildren(node.children);
        setBreadCrumbs(node.path);
        setCurrentFolderName(node.name);
        console.log(breadCrumbs);
      } catch (e) {
        toast.error("Failed to fetch nodes");
      } finally {
        setIsLoading(false);
      }
    }

    getNodes();
  }, [currentFolderId]);

  // fetch tree onec on load
  useEffect(() => {
    async function fetchTree() {
      try {
        const tree = await getTree();
        setTree(tree);
      } catch (e) {
        console.error("Failed to fetch tree:", e);
      }
    }

    fetchTree();
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <DashboardHeader />
      <DashboardSideBar
        folder={tree}
        onFolderClick={onFolderClick}
        currentFolderId={currentFolderId}
      />
      <main className="flex-1 ml-0 lg:ml-[280px] overflow-y-auto bg-background p-margin-desktop">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
          {/* bread crumbs */}
          <div>
            {/* Breadcrumbs */}
            <BreadCrumbComponent
              breadCrumbs={breadCrumbs}
              onClick={setCurrentFolderId}
              currentFolderId={currentFolderId}
            />
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {currentFolderName.toUpperCase()}
            </h1>
            <p className="text-body-md text-on-surface-variant">12 items</p>
          </div>
          <div className="flex items-center gap-sm">
            <button className="flex items-center gap-2 px-lg py-sm bg-surface-container text-primary font-label-md rounded-xl hover:bg-surface-container-high transition-all active:scale-95">
              <FolderPlus className="material-symbols-outlined" />
              New Folder
            </button>
            <button className="flex items-center gap-2 px-lg py-sm bg-primary text-on-primary font-label-md rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95">
              <Upload className="material-symbols-outlined" />
              Upload
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-lg bg-surface-container-lowest p-sm rounded-2xl shadow-sm">
          <div className="flex items-center gap-md">
            <div className="relative">
              <select className="appearance-none bg-surface-container-low border-none rounded-lg pl-3 pr-8 py-2 text-label-md font-label-md text-on-surface-variant cursor-pointer focus:ring-0">
                <option>Sort: Newest</option>
                <option>Sort: Name</option>
                <option>Sort: Size</option>
              </select>

              <ArrowDown className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-sm" />
            </div>
          </div>
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
            <button
              className={`${viewMode === "grid" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high "} p-1.5 rounded-md   shadow-sm transition-all`}
              id="grid-toggle"
              onClick={() => setViewMode("grid")}
            >
              <Grid2x2 className="material-symbols-outlined text-md" />
            </button>
            <button
              className={`${viewMode === "list" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high "} p-1.5 rounded-md   shadow-sm transition-all`}
              id="list-toggle"
              onClick={() => setViewMode("list")}
            >
              <List className="material-symbols-outlined text-md" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-lg">
          <div className="col-span-full mb-2">
            <h3 className="text-label-md font-label-md text-outline uppercase tracking-wider">
              Folders
            </h3>
          </div>
          {/* Folder cards render here */}
          {allFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              name={folder.name}
              size={folder.size}
              setCurrentFolderId={setCurrentFolderId}
              id={folder.id}
            />
          ))}

          <div className="col-span-full mt-xl mb-2">
            <h3 className="text-label-md font-label-md text-outline uppercase tracking-wider">
              Files
            </h3>
          </div>
          {/* File Card renders here */}
          {allFiles.map((file) => (
            <FileCard
              key={file.id}
              name={file.name}
              size={file.size}
              updatedAt={file.updatedAt}
            />
          ))}
          <div className="group bg-surface-container-lowest p-0 rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full">
            <div className="aspect-video bg-surface-container-low flex items-center justify-center">
              <span
                className="material-symbols-outlined text-4xl text-outline"
                data-icon="article"
              >
                article
              </span>
            </div>
            <div className="p-md">
              <h4 className="font-label-md text-label-md text-on-surface truncate">
                requirements.txt
              </h4>
              <div className="flex justify-between items-center mt-1">
                <p className="text-label-sm text-outline">12 KB</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  1w ago
                </span>
              </div>
            </div>
          </div>
          <div className="group bg-surface-container-lowest p-0 rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full">
            <div className="aspect-video bg-surface-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-4xl text-primary/40"
                data-icon="description"
              >
                description
              </span>
            </div>
            <div className="p-md">
              <h4 className="font-label-md text-label-md text-on-surface truncate">
                final-report.docx
              </h4>
              <div className="flex justify-between items-center mt-1">
                <p className="text-label-sm text-outline">2.4 MB</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  2w ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
