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
  Presentation,
  type LucideIcon,
} from "lucide-react";
import type { NodeItem } from "../types";

type Props = { file: NodeItem; onOpen: (file: NodeItem) => void };

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

function FileCard({ file, onOpen }: Props) {
  const extension = file.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "")
    : "";
  const TypeIcon = typeIconMap[extension] ?? File;

  return (
    <button
      onClick={() => onOpen(file)}
      className="group bg-surface-container-lowest p-0 rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full"
    >
      <div className="aspect-video bg-surface-container-low flex items-center justify-center relative">
        <TypeIcon className="size-10 text-error/50" aria-hidden="true" />
      </div>
      <div className="p-md">
        <h4 className="font-label-md text-label-md text-on-surface truncate">
          {file.name}
        </h4>
        <div className="flex justify-between items-center mt-1">
          <p className="text-label-sm text-outline">
            {formatFileSize(file.size)}
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            2h ago
          </span>
        </div>
      </div>
    </button>
  );
}

export default FileCard;
