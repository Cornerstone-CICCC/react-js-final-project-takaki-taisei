import { CircleX, Download, ExternalLink, Share } from "lucide-react";
import type { BreadCrumb, NodeItem } from "../types";
import { getRawNodeUrl } from "../../../api/contents/contents.api";

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

function TextPreviewModal({ onClose, file, breadCrumbs }: Props) {
  function generateViewBreadCrumb() {
    const breadCrumNames = breadCrumbs.map((bc) => bc.name);
    return breadCrumNames.join(" / ");
  }

  const extension = file?.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "")
    : "";
  const fileType = extentionTypeMap[extension] ?? "Text File";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 preview-backdrop backdrop-blur-lg bg-black/40"
      onClick={() => onClose()}
    >
      <div className="bg-white w-full max-w-6xl h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] max-h-204.75 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant animate-in fade-in zoom-in duration-300">
        <div className="shrink-0 px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-md">
            <div className="p-2 bg-primary-container/10 rounded-lg">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="movie"
              >
                movie
              </span>
            </div>
            <div>
              <h2 className="text-headline-md font-headline-md">
                {file?.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <a
              href={getRawNodeUrl(file?.id || "")}
              download
              className="flex items-center gap-2 px-md py-2 bg-primary text-on-primary rounded-full text-label-md font-label-md hover:opacity-90 transition-all active:scale-95"
            >
              <Download className="material-symbols-outlined text-[18px]" />
              Download
            </a>
            <a
              href={getRawNodeUrl(file?.id || "root")}
              target="_blank"
              className="flex items-center gap-2 px-md py-2 bg-primary text-on-primary rounded-full text-label-md font-label-md hover:opacity-90 transition-all active:scale-95"
            >
              <ExternalLink className="material-symbols-outlined text-[18px]" />
              Open
            </a>
            <button className="flex items-center gap-2 px-md py-2 bg-secondary-container text-on-secondary-container rounded-full text-label-md font-label-md hover:bg-surface-container-highest transition-all active:scale-95">
              <Share className="material-symbols-outlined text-[18px]" />
              Share
            </button>
            <div className="w-px h-8 bg-outline-variant mx-2"></div>
            <button
              className="p-2 hover:bg-surface-container rounded-full transition-colors"
              type="button"
              onClick={() => onClose()}
            >
              <CircleX className="material-symbols-outlined text-on-surface-variant" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 flex overflow-hidden">
          {fileType.includes("Video") && (
            <div className="min-w-0 flex-1 bg-black flex items-center justify-center relative group">
              <img
                className="w-full h-full object-contain"
                data-alt="A wide, crisp, high-definition preview of a video project. The image shows several students sitting around a table in a modern office or university setting, laughing and collaborating. Sunlight streams through large windows, highlighting the clean and organized space. The overall mood is productive, creative, and professional, reflecting the VaultBox aesthetic."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuASu9JjMms94HkUqI1242c6IbFm1ksevhLgkdtHgAkOkC6THZ6qkYlKD4_1BoYLAWTDwa3C16IOEEiBTbQ3UZwg_xLYe9i0sps0ZMJ4SgZc7fqEYEm7oAxj1HuxN4v93eaNxvjrXv4n9KLPgtOL9ydz19sd_zBCX29sU_Ifk3Bt2-rH_A07BXBazJPrS3nsoyktpdg-mDp5mzzBIGJqab8x6CcZP-PBva92yLI-nHZjCPkN09Xdcue-CU5Gtwrc3NraIjFp0uvvWUQ"
              />
              <div className="absolute bottom-0 left-0 right-0 p-lg bg-linear-to-t from-black/80 to-transparent flex flex-col gap-md opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-full bg-white/20 rounded-full h-1 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary"
                    style={{ width: "35%" }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-lg">
                    <span
                      className="material-symbols-outlined cursor-pointer"
                      data-icon="play_arrow"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                    <span
                      className="material-symbols-outlined cursor-pointer"
                      data-icon="skip_next"
                      // style="font-variation-settings: 'FILL' 1;"
                    >
                      skip_next
                    </span>
                    <span
                      className="material-symbols-outlined cursor-pointer"
                      data-icon="volume_up"
                      // style="font-variation-settings: 'FILL' 1;"
                    >
                      volume_up
                    </span>
                    <span className="text-label-md">01:42 / 04:55</span>
                  </div>
                  <div className="flex items-center gap-lg">
                    <span
                      className="material-symbols-outlined cursor-pointer"
                      data-icon="settings"
                    >
                      settings
                    </span>
                    <span
                      className="material-symbols-outlined cursor-pointer"
                      data-icon="fullscreen"
                    >
                      fullscreen
                    </span>
                  </div>
                </div>
              </div>
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary/90 text-on-primary rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-4xl"
                  data-icon="play_arrow"
                  // style="font-variation-settings: 'FILL' 1;"
                >
                  play_arrow
                </span>
              </button>
            </div>
          )}

          {fileType === "Plain Text" && (
            <div className="min-w-0 flex-1 bg-white flex flex-col items-center justify-center relative group">
              <p className="text-body-md font-bold">{file?.content}</p>
            </div>
          )}

          <aside className="w-80 overflow-y-auto bg-surface-container-lowest border-l border-outline-variant p-lg flex flex-col gap-xl">
            <div>
              <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-md">
                File Details
              </h3>
              <div className="space-y-lg">
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Type</label>
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[18px] text-primary"
                      data-icon="movie"
                    >
                      movie
                    </span>
                    <p className="text-body-md font-medium">{fileType}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Size</label>
                  <p className="text-body-md font-medium">{file?.size} MB</p>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Uploaded</label>
                  <p className="text-body-md font-medium">Yesterday, 2:45 PM</p>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-outline">Location</label>
                  <span className="text-body-md font-medium">
                    {generateViewBreadCrumb()}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-lg border-t border-outline-variant">
              <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-md">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-sm">
                <button className="flex flex-col items-center justify-center p-md bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                  <span
                    className="material-symbols-outlined mb-1"
                    data-icon="edit"
                  >
                    edit
                  </span>
                  <span className="text-label-sm">Rename</span>
                </button>
                <button className="flex flex-col items-center justify-center p-md bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                  <span
                    className="material-symbols-outlined mb-1"
                    data-icon="star"
                  >
                    star
                  </span>
                  <span className="text-label-sm">Favorite</span>
                </button>
                <button className="flex flex-col items-center justify-center p-md bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors text-error">
                  <span
                    className="material-symbols-outlined mb-1"
                    data-icon="delete"
                  >
                    delete
                  </span>
                  <span className="text-label-sm">Delete</span>
                </button>
                <button className="flex flex-col items-center justify-center p-md bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                  <span
                    className="material-symbols-outlined mb-1"
                    data-icon="info"
                  >
                    info
                  </span>
                  <span className="text-label-sm">Activity</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default TextPreviewModal;
