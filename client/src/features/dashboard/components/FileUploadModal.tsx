// detect file drop
// set the file on drop
// upload the file when upload button is clicked

import { CircleX, CloudUpload, FileText, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  onUpload: (file: File) => void;
  closeModal: () => void;
  isUploading: boolean;
  processError: string | null;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function FileUploadModal({
  onUpload,
  closeModal,
  processError,
  isUploading,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function selectFile(file: File) {
    setUploadError(null);
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("It must be within 10mb");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  function handleSubmit() {
    if (isUploading) return;

    if (!selectedFile) {
      setUploadError("Select a file");
      return;
    }
    onUpload(selectedFile);
  }

  return (
    <div className="fixed inset-0 z-60 backdrop-blur-2xl bg-black/50 flex items-center justify-center p-margin-mobile">
      <div className="bg-surface-container-lowest w-full max-w-160 rounded-xl shadow-[0_10px_20px_rgba(15,23,42,0.1)] border border-outline-variant flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Upload files
          </h2>
          <button
            className="p-xs hover:bg-surface-container rounded-full transition-colors"
            onClick={() => closeModal()}
            disabled={isUploading}
          >
            <CircleX
              className="material-symbols-outlined text-on-surface-variant"
              size={32}
            />
          </button>
        </div>
        <div className="p-lg space-y-lg">
          <button
            className="border-dashed rounded-2xl bg-surface-container-low p-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-surface-container active:scale-[0.99] w-full"
            id="drop-zone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);

              const file = event.dataTransfer.files?.[0];
              if (!file) return;
              selectFile(file);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-md">
              <CloudUpload
                className="material-symbols-outlined text-primary text-[40px]"
                size={80}
              />
            </div>
            <p className="font-body-lg text-body-lg text-on-surface mb-xs">
              Drag files here or click to upload
            </p>

            <p className="font-label-md text-label-md text-on-surface-variant">
              Supports up to 10MB
            </p>
            <input
              className="hidden"
              id="file-input"
              type="file"
              ref={inputRef}
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                selectFile(file);
              }}
            />
          </button>
          {selectedFile && (
            <div className="space-y-md">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Uploading
              </h3>
              <div className="flex items-center gap-md p-md bg-surface-container rounded-lg border border-transparent">
                <div className="p-sm bg-surface-container-highest rounded-lg">
                  <FileText className="material-symbols-outlined text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-label-md text-label-md text-on-surface truncate">
                      {selectedFile.name}
                    </span>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {/* This is progress bar */}
                  {/* <div className="w-full h-1.5 bg-outline-variant rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container w-full transition-all duration-500"></div>
                  </div> */}
                  <div>
                    <p>{isUploading && "Uploading..."}</p>
                  </div>
                </div>
                <button
                  className="p-xs hover:bg-error-container/20 hover:text-error rounded transition-colors flex items-center"
                  disabled={isUploading}
                  onClick={() => setSelectedFile(null)}
                  type="button"
                >
                  <Trash2 className="material-symbols-outlined text-on-surface-variant" />
                </button>

                {(uploadError || processError) && (
                  <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {uploadError || processError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-lg py-md border-t border-outline-variant flex justify-end gap-md">
          <button
            className="px-lg py-sm font-label-md text-label-md text-primary hover:bg-surface-container-high rounded-full transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => closeModal()}
            disabled={isUploading}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`px-lg py-sm font-label-md text-label-md ${selectedFile && !isUploading ? "bg-primary-container text-on-primary-container hover:shadow-md active:scale-95" : "bg-gray-400/40 text-gray-900/30 cursor-not-allowed"}  rounded-full shadow-sm transition-all`}
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            type="button"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileUploadModal;
