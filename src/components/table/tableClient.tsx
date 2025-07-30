import { api } from "~/utils/api";
import { useParams } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable, type CellContext } from "@tanstack/react-table";
import { useMemo } from "react";
import { TableSideBar } from "./tableSideBar";
import { TableTopNav } from "./tableTopNav";
import { TableMainContent } from "./tableMainContent";
import { TableSwitcher } from "./tableSwitcher";


type RowData = Record<string, any>;

export function TableClient() {
  const params = useParams();
  const tableId = params?.tableId as string;

  const { data: table, isLoading } = api.table.getById.useQuery({ tableId: tableId });

  if (isLoading) return <div>Loading table...</div>;
  if (!table) return <div>Table not found</div>;


  return (
    <div className="flex w-full h-screen overflow-hidden">
      <TableSideBar />

      <div className="flex flex-col h-full flex-1 min-w-0">
        <TableTopNav />
        <TableSwitcher />
        <TableMainContent />
      </div>
    </div>
  );
}
