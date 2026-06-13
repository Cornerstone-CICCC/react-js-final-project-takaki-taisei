import { EllipsisVertical, Folder, Pencil, Trash2 } from "lucide-react";
import type { NodeItem } from "../types";
import { useState } from "react";

type Props = {
  folder: NodeItem;
  onOpen: (folderId: string) => void;
  onDeleteClick: (folder: NodeItem) => void;
  onRenameClick: (folder: NodeItem) => void;
};

function FolderCard({ folder, onOpen, onDeleteClick, onRenameClick }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onOpen(folder.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(folder.id);
        }
      }}
      className="group bg-surface-container-lowest p-md rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-md">
        <Folder className="text-primary size-10" />

        <div className="relative">
          <button
            type="button"
            aria-label={`Delete ${folder.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onDeleteClick(folder);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-surface-container transition-all"
          >
            <Trash2 className="text-on-surface-variant" />
          </button>
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-surface-container transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
          >
            <EllipsisVertical className="text-on-surface-variant" />
          </button>

          {isMenuOpen && (
            <div
              onClick={(event) => event.stopPropagation()}
              className="absolute right-0 top-6 z-20 w-36 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onRenameClick(folder);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container"
              >
                <Pencil size={16} />
                Rename
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDeleteClick(folder);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-surface-container"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h4 className="font-label-md text-label-md text-on-surface truncate group-hover:underline">
        {folder.name}
      </h4>

      <p className="text-label-sm text-outline">Folder</p>
    </div>
  );
}

export default FolderCard;
