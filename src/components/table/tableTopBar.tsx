import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { ArrowDownUp, ChevronDownIcon, EyeOff, List, ListFilter, PaintBucket, ExternalLink, Search, XIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { ColumnFiltersState, ColumnSort, SortingState } from '@tanstack/react-table';

// Interfaces for type safety
interface Column {
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER';
}

interface TableTopBarProps {
  columns: Column[];
  setColumnFilters: (filters: ColumnFiltersState) => void;
  columnFilters: ColumnFiltersState; // Added to manage filter state
  setSorting: (sorting: SortingState) => void;
  sorting: SortingState;
}

type FilterType =
  | 'textEquals'
  | 'textNotEquals'
  | 'contains'
  | 'notContains' // For TEXT
  | 'numberEquals'
  | 'numberNotEquals'
  | 'greaterThan'
  | 'lessThan'; // For NUMBER

interface Filter {
  id: string;
  type: FilterType;
  value: string;
}

// Custom filter functions for TanStack Table
const filterFunctions: Record<FilterType, (row: any, columnId: string, filterValue: { value: string; type: FilterType }) => boolean> = {
  textEquals: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? String(value).toLowerCase() === filterValue.value.toLowerCase() : false;
  },
  textNotEquals: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? String(value).toLowerCase() !== filterValue.value.toLowerCase() : false;
  },
  contains: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? String(value).toLowerCase().includes(filterValue.value.toLowerCase()) : false;
  },
  notContains: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? !String(value).toLowerCase().includes(filterValue.value.toLowerCase()) : false;
  },
  numberEquals: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? Number(value) === Number(filterValue.value) : false;
  },
  numberNotEquals: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? Number(value) !== Number(filterValue.value) : false;
  },
  greaterThan: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? Number(value) > Number(filterValue.value) : false;
  },
  lessThan: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value !== undefined ? Number(value) < Number(filterValue.value) : false;
  },
};

// Generic Menu Wrapper Component
interface MenuWrapperProps {
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const MenuWrapper = ({ label, icon, children, className }: MenuWrapperProps) => (
  <Menu as="div" className="relative">
    <MenuButton className="flex items-center rounded-sm px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
      {icon}
      <span className="ml-2">{label}</span>
    </MenuButton>
    <MenuItems className={`absolute z-10 w-48 rounded-md border border-gray-200 shadow-lg bg-white ${className || ''}`}>
      {children}
    </MenuItems>
  </Menu>
);

// Filter Item Component
interface FilterItemProps {
  filter: Filter;
  index: number;
  columns: Column[];
  updateFilter: (index: number, field: 'id' | 'type' | 'value', value: string | FilterType) => void;
  removeFilter: (index: number) => void;
}

const FilterItem = ({ filter, index, columns, updateFilter, removeFilter }: FilterItemProps) => {
  const column = columns.find((col) => col.key === filter.id);
  const availableFilterTypes: FilterType[] = column?.type === 'TEXT'
    ? ['textEquals', 'textNotEquals', 'contains', 'notContains']
    : ['numberEquals', 'numberNotEquals', 'greaterThan', 'lessThan'];

  const getFilterDisplayText = (type: FilterType, columnType: 'TEXT' | 'NUMBER' | undefined) => {
    if (columnType === 'NUMBER') {
      return type === 'numberEquals' ? 'Equals' :
             type === 'numberNotEquals' ? 'Not equals' :
             type === 'greaterThan' ? 'Greater than' :
             'Less than';
    }
    return type === 'textEquals' ? 'Is' :
           type === 'textNotEquals' ? 'Is not' :
           type === 'contains' ? 'Contains' :
           'Does not contain';
  };

  return (
    <div className="flex items-center px-2 py-1 gap-2">
      <div className="w-full relative">
        <select
          value={filter.id}
          onChange={(e) => updateFilter(index, 'id', e.target.value)}
          className="w-full rounded-xs border border-gray-300 px-2 py-1 text-sm appearance-none hover:bg-gray-100"
        >
          {columns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="w-full relative">
        <select
          value={filter.type}
          onChange={(e) => updateFilter(index, 'type', e.target.value as FilterType)}
          className="w-full rounded-xs border border-gray-300 px-2 py-1 text-sm appearance-none hover:bg-gray-100"
        >
          {availableFilterTypes.map((type) => (
            <option key={type} value={type}>
              {getFilterDisplayText(type, column?.type)}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="w-full">
        <input
          type={column?.type === 'NUMBER' ? 'number' : 'text'}
          value={filter.value}
          onChange={(e) => updateFilter(index, 'value', e.target.value)}
          className="w-full rounded-xs border border-gray-300 px-2 py-1 text-sm"
          placeholder="Enter value"
        />
      </div>
      <button
        onClick={() => removeFilter(index)}
        className="px-1 py-1 rounded-xs text-gray-400 hover:bg-gray-200 transition"
        title="Remove filter"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Filter Menu Component
interface FilterMenuProps {
  columns: Column[];
  setColumnFilters: (filters: ColumnFiltersState) => void;
  columnFilters: ColumnFiltersState;
}

const FilterMenu = ({ columns, setColumnFilters, columnFilters }: FilterMenuProps) => {
  const [localFilters, setLocalFilters] = useState<Filter[]>(
    columnFilters.map((f: any) => ({
      id: f.id || (columns[0]?.key || ''),
      type: (f.type as FilterType) || 'equals',
      value: f.value || '',
    }))
  );

  const addFilter = () => {
    const availableColumn = columns.find((col) => !localFilters.some((f) => f.id === col.key));
    if (availableColumn) {
      setLocalFilters([...localFilters, { id: availableColumn.key, type: availableColumn.type === 'TEXT' ? 'contains' : 'numberEquals', value: '' }]);
    }
  };

  const updateFilter = (index: number, field: 'id' | 'type' | 'value', value: string | FilterType) => {
    const newFilters = [...localFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setLocalFilters(newFilters);
    
    setColumnFilters(newFilters.map((f) => ({
      id: f.id,
      value: f.value,
      type: f.type,
    })));
  };

  const removeFilter = (index: number) => {
    const newFilters = localFilters.filter((_, i) => i !== index);
    setLocalFilters(newFilters);
    setColumnFilters(newFilters.map((f) => ({
      id: f.id,
      value: f.value,
      type: f.type,
    })));
  };

  return (
    <MenuWrapper label="Filter" icon={<ListFilter className="h-4 w-4" />} className="w-96">
      <div className="p-2 text-sm font-semibold text-gray-500">Filter by</div>
      <div className="border-b border-gray-200 my-1 mb-2 mx-1" />
      {localFilters.length === 0 ? (
        <MenuItem>
          <div className="px-4 py-2 text-sm text-gray-500">No filters applied.</div>
        </MenuItem>
      ) : (
        localFilters.map((filter, index) => (
          <FilterItem
            key={index}
            index={index}
            filter={filter}
            columns={columns}
            updateFilter={updateFilter}
            removeFilter={removeFilter}
          />
        ))
      )}
      <div className="px-2 py-2">
        <button
          onClick={addFilter}
          className="flex items-center text-sm text-gray-400 hover:text-gray-800"
          disabled={localFilters.length >= columns.length}
        >
          <PlusIcon className="h-4 w-4 mr-1" /> Add filter
        </button>
      </div>
    </MenuWrapper>
  );
};

// Sort Item Component
interface SortItemProps {
  index: number;
  sort: ColumnSort;
  columns: Column[];
  sorting: SortingState;
  updateSort: (index: number, field: 'id' | 'desc', value: string | boolean) => void;
  removeSort: (index: number) => void;
}

const SortItem = ({ index, sort, columns, sorting, updateSort, removeSort }: SortItemProps) => {
  const column = columns.find((col) => col.key === sort.id);
  return (
    <div className="flex items-center px-1 py-1">
      <div className="w-full relative pr-1">
        <select
          value={sort.id}
          onChange={(e) => updateSort(index, 'id', e.target.value)}
          className="w-full rounded-xs border border-gray-300 px-2 py-1 text-sm appearance-none hover:bg-gray-100"
        >
          {columns.map((col) => (
            <option
              key={col.key}
              value={col.key}
              disabled={sorting.some((s, i) => s.id === col.key && i !== index)}
            >
              {col.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="w-full relative">
        <select
          value={sort.desc ? 'desc' : 'asc'}
          onChange={(e) => updateSort(index, 'desc', e.target.value === 'desc')}
          className="w-full rounded-xs border border-gray-300 px-2 py-1 text-sm appearance-none hover:bg-gray-100"
        >
          {column?.type === 'TEXT' ? (
            <>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </>
          ) : (
            <>
              <option value="asc">1 → 9</option>
              <option value="desc">9 → 1</option>
            </>
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      <button
        onClick={() => removeSort(index)}
        className="px-1 py-1 ml-2 rounded-xs text-gray-400 hover:bg-gray-200 transition"
        title="Remove sort"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Add Sort Submenu Component
interface AddSortSubmenuProps {
  columns: Column[];
  sorting: SortingState;
  handleAddSort: (columnId: string, desc: boolean) => void;
  setSubmenuOpen: (open: boolean) => void;
}

const AddSortSubmenu = ({ columns, sorting, handleAddSort, setSubmenuOpen }: AddSortSubmenuProps) => (
  <div className="absolute top-full w-48 rounded-md bg-white z-50 border border-gray-200 shadow-lg">
    <div className="px-1 py-1">
      {columns.map((column) => (
        <button
          key={column.key}
          className="block w-full px-4 py-2 text-sm text-left rounded-sm hover:bg-gray-100 text-gray-800"
          onClick={() => {
            handleAddSort(column.key, false);
            setSubmenuOpen(false);
          }}
          disabled={sorting.some((s) => s.id === column.key)}
        >
          {column.label}
        </button>
      ))}
    </div>
  </div>
);

// Sort Menu Component
interface SortMenuProps {
  columns: Column[];
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
}

const SortMenu = ({ columns, sorting, setSorting }: SortMenuProps) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);

  const handleAddSort = (columnId: string, desc: boolean) => {
    if (sorting.some((sort) => sort.id === columnId)) return;
    setSorting([...sorting, { id: columnId, desc }]);
  };

  const handleUpdateSort = (index: number, field: 'id' | 'desc', value: string | boolean) => {
    const newSorts = [...sorting];
    const currentSort = newSorts[index] || { id: columns[0]?.key || 'default', desc: false };
    if (field === 'id' && typeof value === 'string') {
      if (sorting.some((sort, i) => sort.id === value && i !== index)) return;
      newSorts[index] = { ...currentSort, id: value, desc: currentSort.desc ?? false };
    } else if (field === 'desc' && typeof value === 'boolean') {
      newSorts[index] = { ...currentSort, desc: value };
    }
    setSorting(newSorts);
  };

  const handleRemoveSort = (index: number) => {
    setSorting(sorting.filter((_, i) => i !== index));
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={`flex items-center rounded-sm px-2 py-1.5 text-sm focus:outline-none ${
          sorting.length > 0 ? 'bg-red-100 hover:border-gray-300' : 'text-gray-800 hover:bg-gray-100'
        }`}
      >
        <ArrowDownUp className="h-4 w-4 mr-1" />
        {sorting.length > 0 ? (
          <span>Sorted by {sorting.length} field{sorting.length > 1 ? 's' : ''}</span>
        ) : (
          <span>Sort</span>
        )}
      </MenuButton>
      <MenuItems className={`absolute right-0 my-1 z-10 w-80 rounded-md border border-gray-200 shadow-lg bg-white p-2 focus:outline-none ${sorting.length === 0 ? 'w-80' : 'w-110'}`}>
        <div className="px-1 py-1 text-sm font-semibold text-gray-500">Sort by</div>
        <div className="border-b border-gray-200 my-1 mx-1" />
        {sorting.length === 0 ? (
          columns.length === 0 ? (
            <MenuItem>
              <div className="px-4 py-2 text-sm text-gray-500">No columns available.</div>
            </MenuItem>
          ) : (
            columns.map((column) => (
              <button
                key={column.key}
                className="block w-full px-4 py-1 text-sm text-left hover:bg-gray-100 text-gray-800"
                onClick={() => handleAddSort(column.key, false)}
              >
                {column.label}
              </button>
            ))
          )
        ) : (
          <>
            {sorting.map((sort, index) => (
              <SortItem
                key={index}
                index={index}
                sort={sort}
                columns={columns}
                sorting={sorting}
                updateSort={handleUpdateSort}
                removeSort={handleRemoveSort}
              />
            ))}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSubmenuOpen((prev) => !prev);
                }}
                className="px-2 py-2 text-sm text-gray-400 hover:text-gray-800"
              >
                + Add another sort
              </button>
              {submenuOpen && (
                <AddSortSubmenu
                  columns={columns}
                  sorting={sorting}
                  handleAddSort={handleAddSort}
                  setSubmenuOpen={setSubmenuOpen}
                />
              )}
            </div>
          </>
        )}
      </MenuItems>
    </Menu>
  );
};

// Main TableTopBar Component
const TableTopBar = ({ columns, setColumnFilters, columnFilters, setSorting, sorting }: TableTopBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setColumnFilters([{ id: 'name', value }]);
  };

  return (
    <div className="flex items-center justify-between w-full mb-4 border-b border-gray-200 p-2">
      <div className="flex items-center space-x-2 ml-auto px-1">
        <MenuWrapper label="Hide fields" icon={<EyeOff className="h-4 w-4" />} />
        <FilterMenu columns={columns} setColumnFilters={setColumnFilters} columnFilters={columnFilters} />
        <MenuWrapper label="Group" icon={<List className="h-4 w-4" />} />
        <SortMenu columns={columns} sorting={sorting} setSorting={setSorting} />
        <MenuWrapper label="Color" icon={<PaintBucket className="h-4 w-4" />} />
        <MenuWrapper label="" icon={<List className="h-4 w-4" />} className="w-48" />
        <MenuWrapper label="Share and syncs" icon={<ExternalLink className="h-4 w-4" />} />
        <MenuWrapper label="" icon={<Search className="h-4 w-4" />} className="w-48" />
      </div>
    </div>
  );
};

export default TableTopBar;