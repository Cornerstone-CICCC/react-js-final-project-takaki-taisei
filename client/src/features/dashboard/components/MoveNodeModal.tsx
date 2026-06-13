import { FolderClosed, Search } from "lucide-react";
import type { NodeItem } from "../types";
import { useState } from "react";

type Props = {
  flattenedNodes: NodeItem[];
  handleMove: (destId: string) => void;
  isMoving: boolean;
  moveError: string | null;
  onClose: () => void;
};

function MoveNodeModal({
  flattenedNodes,
  handleMove,
  isMoving,
  moveError,
  onClose,
}: Props) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const trimmedTerm = searchTerm.trim().toLowerCase() || "";
  const displayFolders = flattenedNodes.filter((f) =>
    f.name.toLowerCase().includes(trimmedTerm),
  );

  const disabled = isMoving || !selectedFolderId;
  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 md:p-8"
      onClick={() => {
        if (isMoving) return;
        onClose();
      }}
    >
      <div
        className="bg-surface-container-lowest w-full max-w-150 rounded-2xl shadow-lg border border-outline-variant flex flex-col max-h-[calc(100dvh-4rem)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg flex items-center justify-between border-b border-outline-variant/30">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Move to...
          </h2>
          <button
            className="p-xs rounded-full hover:bg-surface-container-high transition-colors"
            onClick={() => onClose()}
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              close
            </span>
          </button>
        </div>
        <div className="px-lg pt-lg pb-md">
          <div className="relative group">
            <Search className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
            <input
              className="w-full bg-surface-container-low border-none rounded-lg pl-xl pr-md py-sm text-body-md focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/60 outline-none transition-all ml-2"
              placeholder="Search folders..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <p>{moveError}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-lg space-y-xs pb-lg">
          {/* <div className="flex items-center gap-xs py-sm text-label-sm text-on-surface-variant mb-xs">
              <span className="hover:text-primary cursor-pointer">
                VaultBox
              </span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span className="font-bold text-on-surface">My Drive</span>
            </div> */}
          {displayFolders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant p-lg text-center">
              <p className="font-label-md text-label-md text-on-surface">
                No folder found
              </p>
              <p className="mt-xs text-sm text-on-surface-variant">
                Try searching with a different folder name.
              </p>
            </div>
          ) : (
            displayFolders.map((node) => (
              <button
                key={node.id}
                className={`group flex items-center justify-between p-md rounded-lg hover:bg-surface-container-high ${node.id === selectedFolderId && "bg-surface-container-high"} transition-all cursor-pointer border border-transparent active:scale-[0.98] w-full`}
                onClick={() => setSelectedFolderId(node.id)}
              >
                <div className="flex items-center gap-md">
                  <FolderClosed className="material-symbols-outlined text-primary-container" />
                  <span className="font-body-md text-on-surface">
                    {node.name}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-lg bg-surface-container-low/50 border-t border-outline-variant/30 rounded-b-xl flex flex-col gap-sm">
          <button
            className={`w-full py-md px-lg ${disabled ? "text-gray-600 bg-gray-400/40 cursor-not-allowed" : "bg-primary-container text-on-primary-container hover:opacity-90 active:scale-[0.97]"}  font-label-md text-label-md rounded-lg  transition-all shadow-sm`}
            disabled={disabled}
            onClick={() => {
              if (!selectedFolderId) return;
              handleMove(selectedFolderId);
            }}
          >
            Move Here
          </button>
          <button
            className="w-full py-md px-lg bg-transparent text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container-highest active:scale-[0.97] transition-all"
            onClick={() => onClose()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveNodeModal;
