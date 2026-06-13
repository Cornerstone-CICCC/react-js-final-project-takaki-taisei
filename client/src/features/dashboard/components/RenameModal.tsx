import { CircleX, Pencil } from "lucide-react";
import { useState } from "react";
import type { NodeItem } from "../types";

type Props = {
  onRename: (name: string) => void;
  isRenaming: boolean;
  renameError: string | null;
  closeModal: () => void;
  node: NodeItem;
};

function RenameModal({
  onRename,
  isRenaming,
  renameError,
  closeModal,
  node,
}: Props) {
  const [renameInput, setRenameInput] = useState<string>(node.name);

  const disabled = isRenaming || renameInput.trim().length === 0;
  return (
    <div
      className="backdrop-blur-sm bg-black/30 fixed inset-0 z-100 flex items-center justify-center px-margin-mobile"
      id="renameModal"
      onClick={() => closeModal()}
    >
      <div
        className="bg-white w-full max-w-150 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 opacity-100 p-lg border border-outline-variant"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-sm mb-lg">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-xs">
            <Pencil className="material-symbols-outlined text-[32px]" />
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Rename
          </h1>
          <p className="font-body-md text-body-md text-outline">
            Enter a new name for your file.
          </p>
          {renameError && <p className="text-sm text-red-600">{renameError}</p>}
        </div>
        <div className="space-y-sm mb-xl">
          <label
            className="font-label-sm text-label-sm text-on-surface-variant ml-1"
            htmlFor="fileName"
          >
            {node.type === "FILE" ? "File" : "Folder"} Name
          </label>
          <div className="relative">
            <input
              autoFocus
              className="w-full px-md py-3.5 bg-surface-container-lowest border-2 border-primary rounded-xl font-body-md text-body-md focus:outline-none focus:ring-0 transition-all text-on-surface"
              id="fileName"
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              onClick={() => setRenameInput("")}
            >
              <CircleX className="material-symbols-outlined text-[20px]" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-sm">
          <button
            type="button"
            className={`w-full py-3.5 ${disabled ? "bg-gray-600/40 text-gray-600 cursor-not-allowed" : "active:scale-9 bg-primary-container hover:bg-primary text-white"}  font-label-md text-label-md rounded-xl  transition-all 5 shadow-md shadow-primary/20`}
            disabled={disabled}
            onClick={() => onRename(renameInput.trim())}
          >
            {isRenaming ? "Renaming..." : "Rename"}
          </button>
          <button
            type="button"
            className="w-full py-3.5 bg-transparent text-primary font-label-md text-label-md rounded-xl hover:bg-surface-container-low transition-all active:scale-95"
            id="closeModal"
            onClick={() => closeModal()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RenameModal;
