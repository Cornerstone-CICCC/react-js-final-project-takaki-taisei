import { Search, X } from "lucide-react";

type Props = { onSearchKey: (value: string) => void; value: string };

function SearchComponent({ onSearchKey, value }: Props) {
  return (
    <div className="flex-1 max-w-xl mx-1 md:mx-xl md:min-w-100">
      <div className="relative group">
        <Search className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-body-md transition-all"
          placeholder="Search files, folders, documents..."
          aria-label="Search files, folders, and documents"
          type="text"
          value={value}
          onChange={(e) => onSearchKey(e.target.value)}
        />

        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchKey("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-outline hover:bg-surface-container hover:text-on-surface"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchComponent;
