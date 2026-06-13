// - Set the current Id
// - fetch nodes that have parent id of the current id
// - set currentFolderId
// - main page displays the contents whose parent id matches with the currentFolderId
// - Whenever user clicks folder, change the currentFolder id to that folder.id
// - Whenever currentFolderId changes, it fetches the contents

import { useEffect, useRef, useState } from "react";
import {
  type TreeNode,
  type BreadCrumb,
  type NodeItem,
  type SortOption,
  type ViewMode,
} from "../features/dashboard/types";

import DashboardSideBar from "../features/dashboard/components/DashboardSideBar";
import {
  deleteNode,
  getNode,
  getTree,
  renameNode,
  searchNodes,
  uploadBinaryFile,
} from "../api/contents/contents.api";
import Spinner from "../components/Spinner";

import FolderCard from "../features/dashboard/components/FolderCard";
import DashboardHeader from "../features/dashboard/components/DashboardHeader";
import FileCard from "../features/dashboard/components/FileCard";
import { ArrowDown, FolderPlus, Grid2x2, List, Upload } from "lucide-react";
import BreadCrumbComponent from "../features/dashboard/components/BreadCrumbComponent";
import { toast } from "sonner";
import TextPreviewModal from "../features/dashboard/components/TextPreviewModal";
import CreateFolderModal from "../features/dashboard/components/CreateFolderModal";
import FileUploadModal from "../features/dashboard/components/FileUploadModal";
import DeleteConfirmModal from "../features/dashboard/components/DeleteConfirmModal";
import RenameModal from "../features/dashboard/components/RenameModal";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function Dashboard() {
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [currentFolderName, setCurrentFolderName] = useState<string>("Root");
  const [children, setChildren] = useState<NodeItem[]>([]);
  const [breadCrumbs, setBreadCrumbs] = useState<BreadCrumb[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
  const [uploadError, setUplodError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const [tree, setTree] = useState<TreeNode | null>(null);
  const [selectedFile, setSelectedFile] = useState<NodeItem | null>(null);

  const [deletingNode, setDeletingNode] = useState<NodeItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const isDeletingRef = useRef(false);

  const [renamingNode, setRenamingNode] = useState<NodeItem | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const isRenamingRef = useRef(false);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isFolderCreateModalOpen, setIsFollderCreateModalOpen] =
    useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<NodeItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRefreshVersion, setSearchRefreshVersion] = useState(0);

  const isSearchMode = searchTerm.trim().length > 0;

  const displayNodes = [...(isSearchMode ? searchResults : children)].sort(
    (a, b) => {
      if (sortOption === "name") return a.name.localeCompare(b.name);
      if (sortOption === "size") return (b.size ?? 0) - (a.size ?? 0);
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
  );

  const allFolders = displayNodes.filter((node) => node.type === "FOLDER");
  const allFiles = displayNodes.filter((node) => node.type === "FILE");

  function onSearchChange(value: string) {
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchResults([]);
      setSearchError(null);
    }
  }

  function onFolderClick(id: string) {
    setCurrentFolderId(id);
    setIsMobileNavOpen(false);

    // when search mode, clicking the folder should clear search results
    if (isSearchMode) {
      setSearchTerm("");
      setSearchResults([]);
      setSearchError(null);
    }
  }

  function onClose() {
    setIsPreviewModalOpen(false);
  }

  function openModal(file: NodeItem) {
    setIsPreviewModalOpen(true);
    setSelectedFile(file);
  }

  function closeFolderModal() {
    setIsFollderCreateModalOpen(false);
  }

  async function loadCurrentNode() {
    const node = await getNode(currentFolderId);
    const tree = await getTree();

    setChildren(node.children ?? []);
    setBreadCrumbs(node.path);
    setCurrentFolderName(node.name);
    setTree(tree);
  }

  async function refreshAfterMutation() {
    setSearchRefreshVersion((version) => version + 1);

    try {
      await loadCurrentNode();
    } catch {
      toast.error("Change saved, but the dashboard could not refresh");
    }
  }

  async function uploadFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setUplodError("File must be smaller than 10mb");
      toast.error("File must be smaller thant 10mb");
      return;
    }
    try {
      setIsFileUploading(true);
      setUplodError(null);
      await uploadBinaryFile(file, currentFolderId);
      toast.success("Successfully uploaded file");
      setIsUploadModalOpen(false);
      await refreshAfterMutation();
    } catch (e) {
      setUplodError(e instanceof Error ? e.message : "Failed to upload file");
      toast.error("Failed to upload file");
    } finally {
      setIsFileUploading(false);
    }
  }

  async function handleDeleteNode() {
    if (!deletingNode || isDeletingRef.current) return;

    isDeletingRef.current = true;
    setIsDeleting(true);
    setDeletingError(null);

    try {
      await deleteNode(deletingNode.id);
      setSearchResults((results) =>
        results.filter((node) => node.id !== deletingNode.id),
      );
      setDeletingNode(null);
      setIsDeleteModalOpen(false);
      setDeletingError(null);
      toast.success("Successfully deleted node");
      await refreshAfterMutation();
    } catch (e) {
      toast.error("Failed to delete node");
      setDeletingError(
        e instanceof Error ? e.message : "Failed to delete node",
      );
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  }

  async function handleRename(name: string, content?: string) {
    if (!renamingNode || isRenamingRef.current) return;

    isRenamingRef.current = true;
    setIsRenaming(true);
    setRenameError(null);

    try {
      const renamedNode = await renameNode(renamingNode.id, name, content);
      setSearchResults((results) =>
        results.map((node) =>
          node.id === renamedNode.id ? renamedNode : node,
        ),
      );
      setRenamingNode(null);
      setRenameError(null);
      toast.success("Successfully renamed node");
      await refreshAfterMutation();
    } catch (e) {
      toast.error("Failed to rename node");
      setRenameError(e instanceof Error ? e.message : "Failed to rename");
    } finally {
      isRenamingRef.current = false;
      setIsRenaming(false);
    }
  }

  function onRenameClick(node: NodeItem) {
    setRenamingNode(node);
  }

  function onDeleteClick(node: NodeItem) {
    setDeletingNode(node);
    setIsDeleteModalOpen(true);
  }

  // Fetch nodes everytime currentId changes
  useEffect(() => {
    const controller = new AbortController();

    async function getNodes() {
      try {
        setIsLoading(true);
        const node = await getNode(currentFolderId, controller.signal);

        setChildren(node.children ?? []);
        setBreadCrumbs(node.path);
        setCurrentFolderName(node.name);
      } catch {
        if (controller.signal.aborted) return;
        toast.error("Failed to fetch nodes");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    getNodes();

    return () => controller.abort();
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

  // run searching everytime search time changes with debouncing
  useEffect(() => {
    const trimmedTerm = searchTerm.trim();

    if (!trimmedTerm) {
      return;
    }

    let isStale = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError(null);
        const result = await searchNodes(trimmedTerm);
        if (!isStale) {
          setSearchResults(result);
        }
      } catch (e) {
        if (!isStale) {
          setSearchError(e instanceof Error ? e.message : "Failed to search");
          toast.error(e instanceof Error ? e.message : "search failed.");
        }
      } finally {
        if (!isStale) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      isStale = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, searchRefreshVersion]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <DashboardHeader
        onSearchKey={onSearchChange}
        value={searchTerm}
        onMenuClick={() => setIsMobileNavOpen(true)}
      />
      <DashboardSideBar
        folder={tree}
        onFolderClick={onFolderClick}
        currentFolderId={currentFolderId}
        isMobileOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <main className="flex-1 ml-0 lg:ml-70 overflow-y-auto bg-background p-margin-desktop">
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
            <p className="text-body-md text-on-surface-variant">
              {children.length} items
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <button
              className="flex items-center gap-2 px-lg py-sm bg-surface-container text-primary font-label-md rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
              type="button"
              onClick={() => setIsFollderCreateModalOpen(true)}
            >
              <FolderPlus className="material-symbols-outlined" />
              New Folder
            </button>
            <button
              className="flex items-center gap-2 px-lg py-sm bg-primary text-on-primary font-label-md rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95"
              onClick={() => {
                setUplodError(null);
                setIsUploadModalOpen(true);
              }}
            >
              <Upload className="material-symbols-outlined" />
              Upload
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-lg bg-surface-container-lowest p-sm rounded-2xl shadow-sm">
          <div className="flex items-center gap-md">
            <div className="relative">
              <select
                aria-label="Sort files and folders"
                className="appearance-none bg-surface-container-low border-none rounded-lg pl-3 pr-8 py-2 text-label-md font-label-md text-on-surface-variant cursor-pointer focus:ring-0"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
              >
                <option value="newest">Sort: Newest</option>
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
              </select>

              <ArrowDown className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-sm" />
            </div>
          </div>
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
            <button
              className={`${viewMode === "grid" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high "} p-1.5 rounded-md   shadow-sm transition-all`}
              id="grid-toggle"
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              <Grid2x2 className="material-symbols-outlined text-md" />
            </button>
            <button
              className={`${viewMode === "list" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high "} p-1.5 rounded-md   shadow-sm transition-all`}
              id="list-toggle"
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <List className="material-symbols-outlined text-md" />
            </button>
          </div>
        </div>
        {isSearchMode && (
          <div className="mb-xl rounded-2xl border border-outline-variant bg-surface-container-lowest px-md py-sm">
            <p className="text-sm text-on-surface-variant">
              {isSearching
                ? "Searching..."
                : `${searchResults.length} result${
                    searchResults.length === 1 ? "" : "s"
                  } for "${searchTerm.trim()}"`}
            </p>

            {searchError && (
              <p className="mt-2 text-sm text-red-600">{searchError}</p>
            )}
          </div>
        )}
        <div
          className={`grid gap-lg ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-full mb-2">
            <h3 className="text-label-md font-label-md text-outline uppercase tracking-wider">
              Folders
            </h3>
          </div>
          {/* Folder cards render here */}
          {allFolders.length !== 0 ? (
            allFolders.map((folder) => (
              <FolderCard
                folder={folder}
                key={folder.id}
                onOpen={onFolderClick}
                onDeleteClick={onDeleteClick}
                onRenameClick={onRenameClick}
              />
            ))
          ) : (
            <div>
              <p className="text-center text-lg text-gray-600/50">
                No folder to display
              </p>
            </div>
          )}

          <div className="col-span-full mt-xl mb-2">
            <h3 className="text-label-md font-label-md text-outline uppercase tracking-wider">
              Files
            </h3>
          </div>
          {/* File Card renders here */}
          {allFiles.length !== 0 ? (
            allFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onOpen={openModal}
                onDeleteClick={onDeleteClick}
                onRenameClick={onRenameClick}
              />
            ))
          ) : (
            <div>
              <p className="text-center text-lg text-gray-600/50">
                No File to display
              </p>
            </div>
          )}
        </div>
      </main>
      {isPreviewModalOpen && (
        <TextPreviewModal
          onClose={onClose}
          file={selectedFile}
          breadCrumbs={selectedFile?.path ?? breadCrumbs}
        />
      )}

      {isFolderCreateModalOpen && (
        <CreateFolderModal
          currentFolderId={currentFolderId}
          handleClose={closeFolderModal}
          onFolderCreated={refreshAfterMutation}
          currentFolderName={currentFolderName}
        />
      )}

      {isUploadModalOpen && (
        <FileUploadModal
          onUpload={uploadFile}
          closeModal={() => setIsUploadModalOpen(false)}
          isUploading={isFileUploading}
          processError={uploadError}
        />
      )}

      {isDeleteModalOpen && deletingNode && (
        <DeleteConfirmModal
          onDelete={handleDeleteNode}
          node={deletingNode!}
          isDeleting={isDeleting}
          onCancel={() => {
            if (isDeleting) return;
            setDeletingNode(null);
            setIsDeleteModalOpen(false);
            setDeletingError(null);
          }}
          error={deletingError}
        />
      )}

      {renamingNode && (
        <RenameModal
          onRename={handleRename}
          closeModal={() => {
            if (isRenaming) return;
            setRenamingNode(null);
            setRenameError(null);
          }}
          isRenaming={isRenaming}
          renameError={renameError}
          node={renamingNode}
        />
      )}
    </div>
  );
}

export default Dashboard;
