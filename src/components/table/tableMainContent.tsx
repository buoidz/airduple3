import { useParams } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable, type CellContext } from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { api } from "~/utils/api";


type EditableCellProps = {
  initialValue: string;
  tableId: string;
  rowIndex: number;
  columnId: string;
};

function EditableCell({ initialValue, tableId, rowIndex, columnId }: EditableCellProps) {
  const [value, setValue] = useState(initialValue);

  const utils = api.useUtils();
  const updateCell = api.table.updateCell.useMutation();

  const handleBlur = () => {
    if (value !== initialValue) {
      updateCell.mutate({
        tableId,
        rowIndex,
        columnId,
        value,
      }, {
        onSuccess: () => {
          utils.table.getById.invalidate({ tableId: tableId });
        }
      });
    }
  };

  return (
    <input
      className="w-full border-none bg-transparent focus:outline-none"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
}



type RowData = Record<string, any>;

export function TableMainContent() {
  const params = useParams();
  const tableId = params?.tableId as string;

  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<"text" | "number">("text");


  const { data: table, isLoading } = api.table.getById.useQuery({ tableId: tableId });

  const utils = api.useUtils();
  const addColumn = api.table.addColumn.useMutation({
    onSuccess: () => {
      utils.table.getById.invalidate({ tableId: tableId });
    },
  });

  const columns = useMemo(() => 
    table?.columns.sort((a, b) => a.order - b.order) ?? [], 
    [table]
  );

  const rows = useMemo(() => 
    table?.rows ?? [], 
    [table]
  );

  const columnDefs = useMemo(() => 
    columns.map((col) => ({
      accessorKey: col.id,
      header: col.name,
      enableResizing: true,
      size: 150,
      minSize: 50,
      maxSize: 500,

      cell: (props: CellContext<RowData, unknown>) => (
        <EditableCell
          initialValue={String(props.getValue() ?? "")}
          tableId={tableId}
          rowIndex={props.row.index}
          columnId={props.column.id}
        />
      ),
    })), 
    [columns]
  );

  const rowData = useMemo(() => 
    rows.map((row) => {
      const rowObj: Record<string, any> = {};
      for (const cell of row.cells) {
        rowObj[cell.columnId] = cell.value;
      }
      return rowObj;
    }), 
    [rows]
  );

  const tableInstance = useReactTable({
    data: rowData,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  if (isLoading) return <div>Loading table...</div>;
  if (!table) return <div>Table not found</div>;

  


  return (
    <>
      <div className="overflow-x-auto">
        <button
          // onClick={handleAddRows}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add 15,000 Rows
        </button>

        <table className="min-w-full text-left text-sm text-gray-600 font-normal leading-tight border-collapse">
          <thead>
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative group font-semibold border border-gray-300"
                    style={{ width: header.getSize() }}
                  >
                    <div className="px-4 py-2 truncate whitespace-nowrap overflow-hidden text-ellipsis flex items-center h-full text-gray-800">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>

                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 bg-blue-500 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </th>
                ))}

                {/* Add Column Dropdown */}
                <th className="font-semibold border border-gray-300 relative p-0">
                  <Menu as="div" className="relative w-full h-full">
                    <MenuButton className="w-full h-full block hover:bg-gray-300 text-center px-4 py-2">
                      +
                    </MenuButton>
                    <MenuItems className="absolute z-20 mt-2 w-64 bg-white border border-gray-300 rounded shadow-lg p-2 right-0">
                      <div className="flex flex-col gap-1">
                        <MenuItem>
                          <button
                            onClick={() =>
                              addColumn.mutate({ tableId, name: "Text", type: "text" })
                            }
                            className="text-left px-2 py-1 rounded hover:bg-gray-100"
                          >
                            Single line text
                          </button>
                        </MenuItem>
                        <MenuItem>
                          <button
                            onClick={() =>
                              addColumn.mutate({ tableId, name: "Number", type: "number" })
                            }
                            className="text-left px-2 py-1 rounded hover:bg-gray-100"
                          >
                            Attachment
                          </button>
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Menu>
                </th>
              </tr>
            ))}
          </thead>

          <tbody className="border border-gray-300">
            {tableInstance.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 border border-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>

  );
}
