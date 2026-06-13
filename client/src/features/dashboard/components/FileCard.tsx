import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  FolderInput,
  Pencil,
  Presentation,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { NodeItem } from "../types";

type Props = {
  file: NodeItem;
  onOpen: (file: NodeItem) => void;
  onDeleteClick: (node: NodeItem) => void;
  onRenameClick: (node: NodeItem) => void;
  viewMode: "grid" | "list";
  onMoveClick: (file: NodeItem) => void;
};

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const typeIconMap: Record<string, LucideIcon> = {
  txt: FileText,
  md: FileText,
  rtf: FileText,
  pdf: FileText,
  doc: FileType,
  docx: FileType,
  odt: FileType,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  ods: FileSpreadsheet,
  ppt: Presentation,
  pptx: Presentation,
  odp: Presentation,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  bmp: FileImage,
  ico: FileImage,
  mp4: FileVideo,
  mov: FileVideo,
  avi: FileVideo,
  mkv: FileVideo,
  webm: FileVideo,
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  m4a: FileAudio,
  zip: FileArchive,
  rar: FileArchive,
  "7z": FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  json: FileJson,
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  html: FileCode,
  css: FileCode,
  scss: FileCode,
  py: FileCode,
  java: FileCode,
  c: FileCode,
  cpp: FileCode,
  cs: FileCode,
  go: FileCode,
  rs: FileCode,
  php: FileCode,
  sql: FileCode,
  xml: FileCode,
  yaml: FileCode,
  yml: FileCode,
};

function formatUpdatedAgo(updatedAt: string) {
  const updatedAtMs = new Date(updatedAt).getTime();

  if (Number.isNaN(updatedAtMs)) {
    return "Unknown time";
  }

  const diffInMs = Date.now() - updatedAtMs;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
}

function FileCard({
  file,
  onOpen,
  onDeleteClick,
  onRenameClick,
  viewMode,
  onMoveClick,
}: Props) {
  const extension = file.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "")
    : "";
  const TypeIcon = typeIconMap[extension] ?? File;

  const updatedTime = formatUpdatedAgo(file.updatedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${file.name}`}
      onClick={() => onOpen(file)}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onOpen(file);
        }
      }}
      className={`group bg-surface-container-lowest p-0 rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden flex h-full ${viewMode === "list" ? "flex-row" : "flex-col"}`}
    >
      <div
        className={`aspect-video bg-surface-container-low flex items-center justify-center relative ${viewMode === "list" && "max-w-25"}`}
      >
        <TypeIcon className="size-10 text-error/50" aria-hidden="true" />
      </div>
      <div className="p-md w-full">
        <div
          className={`flex  mb-3 ${viewMode === "grid" ? "justify-between items-center" : "justify-between items-center"}`}
        >
          <h4 className="font-label-md text-label-md text-on-surface truncate">
            {file.name}
          </h4>
          <div className="min-w-25">
            <button
              type="button"
              aria-label={`Delete ${file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(file);
              }}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-1 rounded-full hover:bg-surface-container transition-all"
            >
              <Trash2 />
            </button>
            <button
              type="button"
              aria-label={`Rename ${file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onRenameClick(file);
              }}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-1 rounded-full hover:bg-surface-container transition-all"
            >
              <Pencil />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveClick(file);
              }}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-1 rounded-full hover:bg-surface-container transition-all"
            >
              <FolderInput />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-label-sm text-outline">
            {formatFileSize(file.size)}
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {updatedTime}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FileCard;
