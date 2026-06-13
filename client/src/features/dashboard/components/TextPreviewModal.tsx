import {
  CircleX,
  Download,
  ExternalLink,
  FileAudio,
  FileQuestion,
  FileText,
  FileVideo,
  Image,
  type LucideIcon,
} from "lucide-react";
import type { BreadCrumb, NodeItem } from "../types";
import { getRawNodeUrl } from "../../../api/contents/contents.api";
import { useModalAccessibility } from "../hooks/useModalAccessibility";

type Props = {
  onClose: () => void;
  file: NodeItem | null;
  breadCrumbs: BreadCrumb[];
};

const extentionTypeMap: Record<string, string> = {
  txt: "Plain Text",
  md: "Markdown",
  rtf: "Rich Text",
  pdf: "PDF Document",
  doc: "Word Document",
  docx: "Word Document",
  odt: "OpenDocument Text",
  pages: "Apple Pages Document",
  xls: "Excel Spreadsheet",
  xlsx: "Excel Spreadsheet",
  ods: "OpenDocument Spreadsheet",
  numbers: "Apple Numbers Spreadsheet",
  csv: "CSV Spreadsheet",
  ppt: "PowerPoint Presentation",
  pptx: "PowerPoint Presentation",
  odp: "OpenDocument Presentation",
  key: "Apple Keynote Presentation",
  jpg: "JPEG Image",
  jpeg: "JPEG Image",
  png: "PNG Image",
  gif: "GIF Image",
  webp: "WebP Image",
  svg: "SVG Image",
  bmp: "Bitmap Image",
  tif: "TIFF Image",
  tiff: "TIFF Image",
  heic: "HEIC Image",
  ico: "Icon File",
  mp4: "MP4 Video",
  mov: "QuickTime Video",
  avi: "AVI Video",
  mkv: "Matroska Video",
  webm: "WebM Video",
  m4v: "M4V Video",
  wmv: "Windows Media Video",
  flv: "Flash Video",
  mp3: "MP3 Audio",
  wav: "WAV Audio",
  flac: "FLAC Audio",
  aac: "AAC Audio",
  m4a: "M4A Audio",
  ogg: "Ogg Audio",
  wma: "Windows Media Audio",
  zip: "ZIP Archive",
  rar: "RAR Archive",
  "7z": "7-Zip Archive",
  tar: "TAR Archive",
  gz: "Gzip Archive",
  bz2: "Bzip2 Archive",
  epub: "EPUB Ebook",
  mobi: "Mobipocket Ebook",
  iso: "Disk Image",
  dmg: "Apple Disk Image",
  exe: "Windows Application",
  apk: "Android Application",
  psd: "Photoshop Document",
  ai: "Illustrator Document",
  json: "JSON",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  js: "JavaScript",
  jsx: "JavaScript JSX",
  ts: "TypeScript",
  tsx: "TypeScript TSX",
  py: "Python",
  java: "Java",
  c: "C",
  h: "C Header",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  hpp: "C++ Header",
  cs: "C#",
  go: "Go",
  rs: "Rust",
  php: "PHP",
  rb: "Ruby",
  swift: "Swift",
  kt: "Kotlin",
  kts: "Kotlin Script",
  sh: "Shell Script",
  bash: "Bash Script",
  zsh: "Zsh Script",
  sql: "SQL",
  env: "Environment File",
  gitignore: "Git Ignore",
  log: "Log File",
  ini: "Configuration File",
  conf: "Configuration File",
  toml: "TOML",
};

const textExtensions = new Set([
  "txt",
  "md",
  "rtf",
  "csv",
  "json",
  "xml",
  "yaml",
  "yml",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "c",
  "h",
  "cpp",
  "cc",
  "cxx",
  "hpp",
  "cs",
  "go",
  "rs",
  "php",
  "rb",
  "swift",
  "kt",
  "kts",
  "sh",
  "bash",
  "zsh",
  "sql",
  "env",
  "gitignore",
  "log",
  "ini",
  "conf",
  "toml",
]);

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function TextPreviewModal({ onClose, file, breadCrumbs }: Props) {
  const dialogRef = useModalAccessibility(onClose);
  function generateViewBreadCrumb() {
    const breadCrumNames = breadCrumbs.map((bc) => bc.name);
    return breadCrumNames.join(" / ");
  }

  const extension = file?.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "")
    : "";

  const fileType =
    extentionTypeMap[extension] ?? file?.mimeType ?? "Unknown file";
  const rawUrl = file ? getRawNodeUrl(file.id) : "";

  const isImage = file?.mimeType?.startsWith("image/") ?? false;
  const isVideo = file?.mimeType?.startsWith("video/") ?? false;
  const isAudio = file?.mimeType?.startsWith("audio/") ?? false;
  const isPdf = file?.mimeType === "application/pdf" || extension === "pdf";
  const isText =
    file?.mimeType?.startsWith("text/") ||
    textExtensions.has(extension) ||
    file?.content != null;

  let PreviewIcon: LucideIcon = FileQuestion;
  if (isImage) PreviewIcon = Image;
  if (isVideo) PreviewIcon = FileVideo;
  if (isAudio) PreviewIcon = FileAudio;
  if (isPdf || isText) PreviewIcon = FileText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 preview-backdrop backdrop-blur-lg bg-black/40"
      onClick={() => onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-dialog-title"
        className="bg-white w-full max-w-6xl h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] max-h-204.75 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant animate-in fade-in zoom-in duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-md">
            <div className="p-2 bg-primary-container/10 rounded-lg">
              <PreviewIcon className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="preview-dialog-title"
                className="text-headline-md font-headline-md"
              >
                {file?.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            {file && (
              <>
                <a
                  href={rawUrl}
                  download
                  className="flex items-center gap-2 px-md py-2 bg-primary text-on-primary rounded-full text-label-md font-label-md hover:opacity-90 transition-all active:scale-95"
                >
                  <Download className="material-symbols-outlined text-[18px]" />
                  Download
                </a>
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-md py-2 bg-primary text-on-primary rounded-full text-label-md font-label-md hover:opacity-90 transition-all active:scale-95"
                >
                  <ExternalLink className="material-symbols-outlined text-[18px]" />
                  Open
                </a>
              </>
            )}
            <div className="w-px h-8 bg-outline-variant mx-2"></div>
            <button
              className="p-2 hover:bg-surface-container rounded-full transition-colors"
              type="button"
              aria-label="Close preview"
              onClick={() => onClose()}
            >
              <CircleX className="material-symbols-outlined text-on-surface-variant" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 flex overflow-hidden">
          <div className="min-w-0 flex-1 bg-surface-container-low flex items-center justify-center overflow-auto p-lg">
            {file && isImage && (
              <img
                alt={file.name}
                className="max-h-full max-w-full object-contain rounded-lg"
                src={rawUrl}
              />
            )}

            {file && isVideo && (
              <video
                className="max-h-full max-w-full rounded-lg bg-black"
                controls
                src={rawUrl}
              >
                Your browser does not support video playback.
              </video>
            )}

            {file && isAudio && (
              <div className="w-full max-w-xl rounded-2xl bg-surface-container-lowest p-xl shadow-sm">
                <FileAudio
                  className="mx-auto mb-lg size-16 text-primary"
                  aria-hidden="true"
                />
                <audio className="w-full" controls src={rawUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {file && isPdf && (
              <iframe
                className="h-full w-full rounded-lg bg-white"
                src={rawUrl}
                title={`Preview of ${file.name}`}
              />
            )}

            {file && isText && !isPdf && (
              <pre className="h-full w-full overflow-auto whitespace-pre-wrap rounded-lg bg-surface-container-lowest p-lg font-mono text-sm text-on-surface">
                {file.content ?? "No text preview is available for this file."}
              </pre>
            )}

            {file && !isImage && !isVideo && !isAudio && !isPdf && !isText && (
              <div className="max-w-75 text-center">
                <FileQuestion
                  className="mx-auto mb-md size-16 text-outline"
                  aria-hidden="true"
                />
                <h3 className="text-headline-md font-headline-md text-on-surface">
                  Preview unavailable
                </h3>
                <p className="mt-sm text-body-md text-on-surface-variant">
                  Open or download this file to view its contents.
                </p>
              </div>
            )}
          </div>

          <aside className="w-80 overflow-y-auto bg-surface-container-lowest border-l border-outline-variant p-lg flex flex-col gap-xl">
            <div>
              <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-md">
                File Details
              </h3>
              <div className="space-y-lg">
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Type</label>
                  <div className="flex items-center gap-2">
                    <PreviewIcon
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-body-md font-medium">{fileType}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Size</label>
                  <p className="text-body-md font-medium">
                    {formatFileSize(file?.size ?? null)}
                  </p>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Uploaded</label>
                  <p className="text-body-md font-medium">
                    {file ? formatDate(file.createdAt) : "Unknown"}
                  </p>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Location</label>
                  <span className="text-body-md font-medium">
                    {generateViewBreadCrumb()}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default TextPreviewModal;
