import { useParams } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable, type CellContext, type ColumnFiltersState, type SortingState, type VisibilityState } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { api } from "~/utils/api";
import TableTopBar from "./tableTopBar";
import { LoadingPage } from "../loadingpage";

// Types
type RowData = Record<string, string | number | null>;

type FilterType = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';


interface EditableCellProps {
  initialValue: string;
  tableId: string;
  rowIndex: number;
  columnId: string;
  isSearchMatch?: boolean;
}

function EditableCell({ initialValue, tableId, rowIndex, columnId, isSearchMatch }: EditableCellProps) {

  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<'idle' | 'pending' | 'saving' | 'syncing' | 'synced' | 'error'>('idle');
  const utils = api.useUtils();
  
  const updateCell = api.table.updateCell.useMutation({
    onMutate: () => {
      setStatus('saving');
    },
    onSuccess: async () => {
      setStatus('syncing'); 
      
      try {
        await Promise.all([
          utils.table.getById.invalidate({ tableId }),
          utils.table.getRowsWithOperations.invalidate({ tableId })
        ]);
        setStatus('synced'); 
        setTimeout(() => setStatus('idle'), 1500);
      } catch (_error) {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    },
    onError: () => {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  });

  const handleBlur = () => {
    if (value !== initialValue) {
      setStatus('pending');
      updateCell.mutate({ tableId, rowIndex, columnId, value });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (status === 'idle' && e.target.value !== initialValue) {
      setStatus('pending');
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'pending':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full absolute -top-1 -right-1"></div>;
      case 'saving':
        return <div className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin absolute -top-1 -right-1"></div>;
      case 'syncing':
        return <div className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin absolute -top-1 -right-1"></div>;
      case 'synced':
        return <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1"></div>;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1"></div>;
      default:
        return null;
    }
  };

  return (
    <div className={`relative w-full ${isSearchMatch ? 'bg-orange-200' : ''}`}>
      <input
        className="w-full border-none bg-transparent focus:outline-none"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {getStatusIndicator()}
    </div>
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
    onSuccess: async () => {
      await Promise.all([
        utils.table.getById.invalidate({ tableId }),
        utils.table.getRowsWithOperations.invalidate({ tableId }),
      ]);
    },
  });

  const handleCreate = async () => {
    if (columnName.trim() && selectedType) {
      await addColumn.mutateAsync({ tableId, name: columnName, type: selectedType });
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
    <div ref={menuRef} className="relative w-full h-full focus:outline-none">
      <Menu>
        <MenuButton
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full h-full block hover:bg-gray-300 text-center px-4 py-2  focus:outline-none"
        >
          +
        </MenuButton>
        {isMenuOpen && (
          <MenuItems
            static
            className="absolute z-20 mt-2 w-64 bg-white border border-gray-300 rounded shadow-lg p-2 right-0  focus:outline-none"
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
                    {addColumn.isPending ? 'Adding Field...' : 'Create field'}

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
export function TableMainContent({ onChangeLoadingState }: { onChangeLoadingState: (val: boolean) => void }) {
  const params = useParams();
  const tableId = params?.tableId as string;

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sortBy, setSortBy] = useState<SortingState>([]);
  const [selectedType, setSelectedType] = useState<'TEXT' | 'NUMBER' | null>(null);
  const [columnName, setColumnName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [searchMatches, setSearchMatches] = useState<{ rowIndex: number; columnId: string }[]>([]);


  const [debouncedFilters, setDebouncedFilters] = useState<ColumnFiltersState>([]);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(columnFilters);
    }, 500);

    return () => clearTimeout(handler);
  }, [columnFilters]);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }
    
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearchTerm]);


  const utils = api.useUtils();
  const parentRef = useRef<HTMLDivElement>(null);



  const { data: table, isLoading } = api.table.getById.useQuery({ tableId });

  // Use the new API endpoint with server-side operations
  const { 
    data: rowData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isRowsLoading,
  } = api.table.getRowsWithOperations.useInfiniteQuery(
    { 
      tableId, 
      limit: 100,
      filters: debouncedFilters.map(filter => ({
        columnId: filter.id,
        type: (filter.value as { type: FilterType; value: string }).type,
        value: (filter.value as { type: FilterType; value: string }).value,
      })).filter(f => f.type && f.value),
      sort: sortBy.map(sort => ({
        columnId: sort.id,
        direction: sort.desc ? 'desc' : 'asc'
      })),
      // search: debouncedSearchTerm.trim() - Handle on client side
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!tableId,
    }
  );


  const columns = useMemo(
    () => table?.columns.sort((a, b) => a.order - b.order) ?? [],
    [table]
  );

  const allRows = useMemo(() => {
    if (!rowData?.pages) return [];
    return rowData.pages.flatMap(page => page.rows);
  }, [rowData]);

  const totalCount = useMemo(() => {
    return rowData?.pages[0]?.totalCount ?? 0;
  }, [rowData]);

  // Initialize columnVisibility state properly
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Initialize columnVisibility when columns are loaded
  useEffect(() => {
    if (columns.length > 0) {
      const initialVisibility: VisibilityState = {};
      columns.forEach((col) => {
        initialVisibility[col.id] = true; // All columns visible by default
      });
      setColumnVisibility(initialVisibility);
    }
  }, [columns]);

  const columnDefs = useMemo(
    () =>
      columns.map((col) => ({
        accessorKey: col.id,
        header: col.name,
        enableResizing: true,
        size: 150,
        minSize: 50,
        maxSize: 500,
        meta: { type: col.type },
        cell: (props: CellContext<RowData, unknown>) => {
          const cellValue = props.getValue() != null ? String(props.getValue()) : ""; 
          const isSearchMatch = searchMatches.some(
            (match) => match.rowIndex === props.row.index && match.columnId === props.column.id
          );

          return (
            <EditableCell
              initialValue={cellValue}
              tableId={tableId}
              rowIndex={props.row.index}
              columnId={props.column.id}
              isSearchMatch={isSearchMatch}
            />
          );
        },
      })),
    [columns, tableId, searchMatches]
  );

  const rowDataTransformed = useMemo(
    () =>
      allRows.map((row) => {
        const rowObj: RowData = {};
        for (const cell of row.cells) {
          rowObj[cell.columnId] = cell.textValue ?? cell.numberValue ?? null;
        }
        return rowObj;
      }),
    [allRows]
  );
  

  // Search functionality
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSearchMatches([]);
      return;
    }

    const matches: { rowIndex: number; columnId: string }[] = [];
    const searchLower = debouncedSearchTerm.toLowerCase();

    rowDataTransformed.forEach((row, rowIndex) => {
      columns.forEach((col) => {
        const cellValue = String(row[col.id] ?? '').toLowerCase();
        if (cellValue.includes(searchLower)) {
          matches.push({ rowIndex, columnId: col.id });
        }
      });
    });

      setSearchMatches(matches);
  }, [debouncedSearchTerm, rowDataTransformed, columns]);

  const tableInstance = useReactTable({
    data: rowDataTransformed,
    columns: columnDefs,
    state: {
      columnFilters,
      sorting: sortBy,
      columnVisibility,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSortBy,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    manualFiltering: true,
    manualSorting: true,
  });


  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: async () => {
      await utils.table.getRowsWithOperations.invalidate({ tableId });
    },
    onError: (error) => {
      console.error('Error adding row:', error);
      alert('Failed to add row. Please try again.');
    },
  });

  const handleAddRow = async () => {
    await addRowMutation.mutateAsync({
      tableId,
    });
  };

  const rowVirtualizer = useVirtualizer({
    count: allRows.length, 
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    
    if (
      lastItem &&
      lastItem.index >= allRows.length - 100 &&
      hasNextPage &&
      !isFetchingNextPage &&
      allRows.length > 0
    ) {
      void fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), allRows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowDataTransformed, rowVirtualizer]);


  const isDataLoading = isLoading ?? isRowsLoading ?? (isSearching && searchTerm.trim().length > 0);
  
  useEffect(() => {
    onChangeLoadingState(isDataLoading);
  }, [isDataLoading, onChangeLoadingState]);

  // Show loading page only if we don't have any data yet
  if (isDataLoading && (!table || !rowData)) {
    return <LoadingPage />;
  }

  


  return (
    <div className="w-full h-screen">
      <TableTopBar
        columns={columns.map((col) => ({ key: col.id, label: col.name, type: col.type }))}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        setSorting={setSortBy}
        sorting={tableInstance.getState().sorting}
        setColumnVisibility={setColumnVisibility}
        columnVisibility={columnVisibility}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        searchMatchCount={searchMatches.length}
        tableId={tableId}
      />

      <div ref={parentRef} className="w-full h-screen overflow-auto">
        <table className="text-left text-sm text-gray-600 font-normal leading-tight border-collapse">
          <thead>
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th 
                  className="text-gray-400 font-normal border-b border-gray-300" 
                  style={{ width: '48px' }}
                ></th>
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
                    position: 'absolute',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: '100%',
                    top: 0,
                    left: 0,
                  }}
                >
                  <td 
                    className="px-4 py-2 border-t border-b border-gray-300 text-gray-500"
                    style={{ 
                      width: '60px', 
                      verticalAlign: 'middle'
                    }}
                  >
                    {virtualRow.index + 1}
                  </td> 
                  {row?.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="m-1 px-4 py-2 border-t border-b border-r border-gray-300" 
                    style={{
                      height: '36px', // Fixed height
                      width: `${cell.column.getSize()}px`,
                    }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}

                </tr>
              )
            })}

          </tbody>
          
          <tfoot>
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
          </tfoot>
        </table>
      </div>
    </div>
  );
}