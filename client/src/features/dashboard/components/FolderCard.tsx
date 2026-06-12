import { EllipsisVertical, Folder, Trash2 } from "lucide-react";
import type { NodeItem } from "../types";

type Props = {
  folder: NodeItem;
  onOpen: (folderId: string) => void;
  onDeleteClick: (folder: NodeItem) => void;
};

function FolderCard({ folder, onOpen, onDeleteClick }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(folder.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOpen(folder.id);
        }
      }}
      className="group bg-surface-container-lowest p-md rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-md">
        <Folder className="text-primary size-10" />

        <div>
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
          >
            <EllipsisVertical className="text-on-surface-variant" />
          </button>
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
