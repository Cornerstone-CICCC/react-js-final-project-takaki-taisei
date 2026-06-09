// Clicks this item => fetch folders/items with this parentId

import { useState } from "react";
import type { FolderItem } from "../types";

type Props = { folder: FolderItem };

function DashboardSideBarItem({ folder }: Props) {
  const [paretnId, setParentId] = useState<string | null>(null);
  return <div>DashboardSideBarItem</div>;
}

export default DashboardSideBarItem;
