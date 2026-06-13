import { useRef, useState } from "react";
import { createFolder } from "../../../api/contents/contents.api";
import { toast } from "sonner";
import type { NodeItem } from "../types";
import { Info } from "lucide-react";

type Props = {
  currentFolderId: string;
  currentFolderName: string;
  handleClose: () => void;
  onFolderCreated: (folder: NodeItem) => void;
};

function CreateFolderModal({
  currentFolderId,
  currentFolderName,
  handleClose,
  onFolderCreated,
}: Props) {
  const [folderName, SetFolderName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef(false);

  async function handleOnClick() {
    if (isSubmittingRef.current) return;

    const trimmedName = folderName.trim();
    if (!trimmedName) {
      toast.error("Folder name is required.");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const newFolder = await createFolder(trimmedName, currentFolderId);
      onFolderCreated(newFolder);
      SetFolderName("");
      handleClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to create new folder",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }
  return (
    <div
      className="bg-black/40 backdrop-blur-2xl fixed inset-0 z-60 flex items-center justify-center px-margin-mobile"
      onClick={() => {
        handleClose();
      }}
    >
      <section
        className="bg-surface-container-lowest w-[min(100%,32rem)] rounded-2xl p-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-sm mb-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface text-center">
            New Folder
          </h2>
        </div>
        <div className="space-y-md">
          <div className="space-y-xs">
            <label
              className="block font-label-md text-label-md text-on-surface-variant ml-xs"
              htmlFor="folderName"
            >
              Folder Name
            </label>
            <input
              autoFocus
              className="w-full h-12 px-md bg-surface-container-low border-2 border-transparent rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:bg-surface-container-lowest transition-all duration-200"
              id="folderName"
              placeholder="Untitled Folder"
              type="text"
              value={folderName}
              onChange={(e) => SetFolderName(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-sm p-sm bg-surface-container-low rounded-lg border border-outline-variant/30">
            <Info className="material-symbols-outlined text-on-surface-variant text-sm" />
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Folder will be created in{" "}
              <span className="font-semibold truncate">
                {currentFolderName}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-xl flex flex-col gap-sm">
          <button
            className="w-full py-md bg-primary-container text-on-primary-container rounded-full font-label-md text-label-md font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
            disabled={isSubmitting || !folderName.trim()}
            onClick={handleOnClick}
          >
            Create
          </button>
          <button
            className="w-full py-md bg-transparent text-primary font-label-md text-label-md font-semibold hover:bg-surface-container rounded-full transition-colors"
            type="button"
            onClick={() => {
              if (isSubmitting) return;
              handleClose();
            }}
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}

export default CreateFolderModal;
