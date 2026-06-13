import { SearchAlert } from "lucide-react";
import type { NodeItem } from "../types";
import { useModalAccessibility } from "../hooks/useModalAccessibility";

type Props = {
  node: NodeItem;
  onDelete: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  error: string | null;
};

function DeleteConfirmModal({
  node,
  onDelete,
  onCancel,
  isDeleting,
  error,
}: Props) {
  const isFolder = node.type === "FOLDER";
  const dialogRef = useModalAccessibility(onCancel, isDeleting);
  return (
    <div
      className="backdrop-blur-sm bg-black/40 fixed inset-0 z-50 flex items-center justify-center px-margin-mobile transition-opacity duration-300 w-full"
      id="deleteModal"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="bg-surface-container-lowest max-w-4xl rounded-xl shadow-xl overflow-hidden transform scale-100 transition-transform animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-xl pb-md flex justify-center">
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center">
            <SearchAlert className="material-symbols-outlined text-danger-red text-[40px]" />
          </div>
        </div>
        <div className="px-xl pb-xl text-center flex flex-col gap-sm">
          <h2
            id="delete-dialog-title"
            className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface"
          >
            Delete {isFolder ? "Folder" : "File"}?
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-on-surface">{node.name}</span>?
            This action cannot be undone.
          </p>
          {isFolder && (
            <p className="mt-sm text-label-md text-on-surface-variant">
              Deleting this folder will also delete everything inside it.
            </p>
          )}
          {error && (
            <p className="mt-md rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-sm p-lg bg-surface-container-low border-t border-outline-variant">
          <button
            type="button"
            className="w-full py-md rounded-lg bg-[#DC2626] text-white font-label-md text-label-md shadow-sm active:scale-95 transition-all hover:bg-red-700"
            id="confirmDelete"
            disabled={isDeleting}
            onClick={() => onDelete()}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            className="w-full py-md rounded-lg text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors active:scale-95"
            id="cancelDelete"
            disabled={isDeleting}
            onClick={() => onCancel()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
