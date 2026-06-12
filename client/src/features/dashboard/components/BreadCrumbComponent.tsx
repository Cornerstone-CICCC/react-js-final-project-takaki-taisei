import { ChevronRight } from "lucide-react";
import type { BreadCrumb } from "../types";
import React from "react";

type Props = {
  breadCrumbs: BreadCrumb[];
  onClick: (id: string) => void;
  currentFolderId: string;
};

function BreadCrumbComponent({ breadCrumbs, onClick, currentFolderId }: Props) {
  return (
    <nav className="flex items-center gap-2 text-label-md font-label-md text-outline mb-2 mt-16">
      {breadCrumbs.map((bc, index) => (
        <React.Fragment key={bc.id}>
          <button
            className={`${currentFolderId === bc.id && "text-primary font-bold"}`}
            onClick={() => onClick(bc.id)}
          >
            {bc.name}
          </button>
          {breadCrumbs.length - 1 !== index && (
            <ChevronRight className="material-symbols-outlined text-sm" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default BreadCrumbComponent;
