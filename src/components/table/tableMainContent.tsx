import { useParams } from "next/navigation";
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type CellContext, type ColumnFiltersState, type Row, type SortingState } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { api } from "~/utils/api";
import Filter from "./filter";
import TableTopBar from "./tableTopBar";

// Types
type RowData = Record<string, any>;

type FilterType = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';



interface EditableCellProps {
  initialValue: string;
  tableId: string;
  rowIndex: number;
  columnId: string;
}

// Editable Cell Component
function EditableCell({ initialValue, tableId, rowIndex, columnId }: EditableCellProps) {
  const [value, setValue] = useState(initialValue);
  const utils = api.useUtils();
  const updateCell = api.table.updateCell.useMutation();

  const handleBlur = () => {
    if (value !== initialValue) {
      updateCell.mutate(
        { tableId, rowIndex, columnId, value },
        {
          onSuccess: () => utils.table.getById.invalidate({ tableId }),
        }
      );
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

// Add Column Menu Component
interface AddColumnMenuProps {
  tableId: string;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  selectedType: 'TEXT' | 'NUMBER' | null;
  setSelectedType: (type: 'TEXT' | 'NUMBER' | null) => void;
  columnName: string;
  setColumnName: (name: string) => void;
}

function AddColumnMenu({
  tableId,
  isMenuOpen,
  setIsMenuOpen,
  selectedType,
  setSelectedType,
  columnName,
  setColumnName,
}: AddColumnMenuProps) {
  const utils = api.useUtils();
  const menuRef = useRef<HTMLDivElement>(null);

  const addColumn = api.table.addColumn.useMutation({
    onSuccess: () => utils.table.getById.invalidate({ tableId }),
  });

  const handleCreate = () => {
    if (columnName.trim() && selectedType) {
      addColumn.mutate({ tableId, name: columnName, type: selectedType });
      setSelectedType(null);
      setColumnName('');
      setIsMenuOpen(false);
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    setColumnName('');
    setIsMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setSelectedType(null);
        setColumnName('');
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, setIsMenuOpen, setSelectedType, setColumnName]);

  return (
    <div ref={menuRef} className="relative w-full h-full">
      <Menu>
        <MenuButton
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full h-full block hover:bg-gray-300 text-center px-4 py-2"
        >
          +
        </MenuButton>
        {isMenuOpen && (
          <MenuItems
            static
            className="absolute z-20 mt-2 w-64 bg-white border border-gray-300 rounded shadow-lg p-2 right-0"
          >
            {!selectedType ? (
              <div className="flex flex-col gap-1">
                <div className="p-1 text-sm font-normal text-gray-500">Standard fields</div>
                <div className="border-b border-gray-200 my-1 mx-1" />
                <MenuItem>
                  <button
                    onClick={() => setSelectedType('TEXT')}
                    className="text-left px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Text
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={() => setSelectedType('NUMBER')}
                    className="text-left px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Number
                  </button>
                </MenuItem>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  placeholder="Field name"
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 rounded hover:bg-gray-300 text-xs hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!columnName.trim()}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:cursor-pointer"
                  >
                    Create field
                  </button>
                </div>
              </div>
            )}
          </MenuItems>
        )}
      </Menu>
    </div>
  );
}

// Main Table Component
export function TableMainContent() {
  const params = useParams();
  const tableId = params?.tableId as string;

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sortBy, setSortBy] = useState<SortingState>([]);
  const [selectedType, setSelectedType] = useState<'TEXT' | 'NUMBER' | null>(null);
  const [columnName, setColumnName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const utils = api.useUtils();

  const parentRef = useRef<HTMLDivElement>(null);



  const { data: table, isLoading } = api.table.getById.useQuery({ tableId });

  const { data: rowData, fetchNextPage, hasNextPage, isFetchingNextPage } = api.table.getRows.useInfiniteQuery(
    { tableId, limit: 1000 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      select: (data) => ({
        pages: data.pages.flatMap((page) => page.rows),
        pageParams: data.pageParams,
      }),
    }
  );

  const columns = useMemo(
    () => table?.columns.sort((a, b) => a.order - b.order) ?? [],
    [table]
  );

  const rows = useMemo(() => rowData?.pages ?? [], [rowData]);

  const columnDefs = useMemo(
    () =>
      columns.map((col) => ({
        accessorKey: col.id,
        header: col.name,
        enableResizing: true,
        size: 150,
        minSize: 50,
        maxSize: 500,
        meta: { type: col.type }, // Add meta.type for filter logic
        filterFn: (row: Row<RowData>, columnId: string, filterValue: { type: FilterType, value: string }) => {
          const value = row.getValue(columnId);
          const filter = filterValue.value;
          const isText = col.type === 'TEXT';
          
          if (!filterValue.type || !filter) return true; // No filter applied

          if (isText) {
            const rowValue = String(value).toLowerCase();
            const filterLower = filter.toLowerCase();
            switch (filterValue.type) {
              case 'equals':
                return rowValue === filterLower; // Uses equalsString logic
              case 'notEquals':
                return rowValue !== filterLower;
              case 'contains':
                return rowValue.includes(filterLower); // Uses includesString logic
              case 'notContains':
                return !rowValue.includes(filterLower);
              default:
                return true;
            }
          } else {
            const rowValue = Number(value);
            const filterNum = Number(filter);
            if (isNaN(rowValue) || isNaN(filterNum)) return true; // Skip invalid numbers
            switch (filterValue.type) {
              case 'equals':
                return rowValue === filterNum; // Uses equals logic
              case 'notEquals':
                return rowValue !== filterNum;
              case 'greaterThan':
                return rowValue > filterNum; // Uses inNumberRange logic
              case 'lessThan':
                return rowValue < filterNum;
              default:
                return true;
            }
          }
        },
          cell: (props: CellContext<RowData, unknown>) => (
            <EditableCell
              initialValue={String(props.getValue() ?? "")}
              tableId={tableId}
              rowIndex={props.row.index}
              columnId={props.column.id}
            />
        ),
      })),
    [columns, tableId]
  );

  const rowDataTransformed = useMemo(
    () =>
      rows.map((row) => {
        const rowObj: RowData = {};
        for (const cell of row.cells) {
          rowObj[cell.columnId] = cell.textValue ?? cell.numberValue ?? null;
        }
        return rowObj;
      }),
    [rows]
  );

  const tableInstance = useReactTable({
    data: rowDataTransformed,
    columns: columnDefs,
    state: { columnFilters, sorting: sortBy },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
  });

  if (isLoading) return <div>Loading table...</div>;
  if (!table) return <div>Table not found</div>;

  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: () => {
      utils.table.getById.invalidate({ tableId });
    },
    onError: (error) => {
      console.error('Error adding row:', error);
      alert('Failed to add row. Please try again.');
    },
  });

  const handleAddRow = () => {
    addRowMutation.mutate({
      tableId,
    });
  };

  const rowVirtualizer = useVirtualizer({
    count: tableInstance.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Approx row height
    overscan: 10,
  });


  return (
    <div className="w-full h-full ">
      <TableTopBar
        columns={columns.map((col) => ({ key: col.id, label: col.name, type: col.type }))}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        setSorting={setSortBy}
        sorting={tableInstance.getState().sorting}
        tableId={tableId}
      />

      <div ref={parentRef} className="w-full overflow-auto border-t border-gray-300">
        <table className="text-left text-sm text-gray-600 font-normal leading-tight border-collapse">
          <thead>
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="text-gray-400 font-normal w-3 border-b border-gray-300" ></th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative group font-semibold border-b border-r border-gray-300 "
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
                <th className="font-semibold border-b border-l border-r border-gray-300 relative p-0">
                  <AddColumnMenu
                    tableId={tableId}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    columnName={columnName}
                    setColumnName={setColumnName}
                  />
                </th>
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableInstance.getRowModel().rows[virtualRow.index];
              return (
                <tr 
                  key={row?.id}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - virtualRow.index * virtualRow.size
                    }px)`,
                  }}
                >
                  <td className="px-4 py-2 border-t border-b border-gray-300 text-gray-500">{virtualRow.index + 1}</td> 
                  {row?.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 border-t border-b border-r border-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}

                </tr>
              )
            })}

            <tr>
              <td
              colSpan={1 + tableInstance.getVisibleLeafColumns().length}
                className="p-0 border-t border-r border-b border-gray-300"
              >
                <button
                  onClick={handleAddRow}
                  className="w-full h-full flex items-center justify-start px-4 py-2 hover:bg-gray-200"
                >
                  +
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}