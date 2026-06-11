import { EllipsisVertical, Folder } from "lucide-react";

type Props = {
  id: string;
  name: string;
  size: number | null;
  setCurrentFolderId: (id: string) => void;
};

function FolderCard({ id, name, size, setCurrentFolderId }: Props) {
  return (
    <button
      onClick={() => setCurrentFolderId(id)}
      className="group bg-surface-container-lowest p-md rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-md">
        <Folder className="material-symbols text-primary bg-blue-500 bg-clip-text  text-4xl size-10" />
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-surface-container transition-all">
          <EllipsisVertical className="material-symbols-outlined text-on-surface-variant" />
        </button>
      </div>
      <h4 className="font-label-md text-label-md text-on-surface truncate">
        {name}
      </h4>
      <p className="text-label-sm text-outline">• {size}</p>
    </button>
  );
}

export default FolderCard;
