import { api } from "~/utils/api";
import { useParams } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable, type CellContext } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { TableSideBar } from "./tableSideBar";
import { TableTopNav } from "./tableTopNav";
import { TableMainContent } from "./tableMainContent";
import { TableSwitcher } from "./tableSwitcher";


type RowData = Record<string, any>;

export function TableClient() {
  const [loadingState, setLoadingState] = useState(true);

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <TableSideBar />

      <div className="flex flex-col h-full flex-1 min-w-0">
        <TableTopNav loadingState={loadingState}/>
        <TableSwitcher />
        <TableMainContent onChangeLoadingState={setLoadingState} />
      </div>
    </div>
  );
}
