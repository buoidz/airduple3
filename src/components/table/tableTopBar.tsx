import { Menu, MenuButton, MenuItems, MenuItem, DialogPanel, Dialog } from '@headlessui/react';
import { ArrowDownUp, ChevronDownIcon, ExternalLink, EyeOff, List, ListFilter, PaintBucket, PlusIcon, Search, XIcon } from 'lucide-react';
import { useState } from 'react';
import type { ColumnFiltersState, ColumnSort, SortingState } from '@tanstack/react-table';

interface TableTopBarProps {
  columns: { key: string; label: string }[];
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setSorting: (sorting: SortingState) => void;
  sorting: SortingState; // Added sorting prop
}

const TableTopBar = ({ columns, setColumnFilters, setSorting, sorting }: TableTopBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => { 
    setSearchQuery(value);
    // Apply global filter (e.g., filter across all columns or a specific one)
    setColumnFilters([{ id: 'name', value }]);
  };


  const addSort = (columnId: string, desc: boolean) => {
    if (sorting.some(sort => sort.id === columnId)) return;
    const newSort: ColumnSort = { id: columnId, desc };
    setSorting([...sorting, newSort]);
  };

  const updateSort = (index: number, field: 'id' | 'desc', value: string | boolean) => {
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

  const removeSort = (index: number) => {
    const updated = sorting.filter((_, i) => i !== index);
    setSorting(updated);
  };


  return (
    <div className="flex items-center justify-between w-full mb-4 border-b border-gray-200 p-2">
      <div className="flex items-center space-x-4 ml-auto px-1">
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-xs px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            <EyeOff className="h-4 w-4" />
            <span className="ml-2">Hide fields</span>
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {/* your filter options go here */}
          </MenuItems>
        </Menu>

        {/* Filter Dropdown */}
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-xs px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            <ListFilter className="h-4 w-4" />
            <span className="ml-1">Filter</span>
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {columns.map((column) => (
              <MenuItem key={column.key}>
                {({ active }) => (
                  <button
                    className={`block w-full px-4 py-2 text-sm text-left ${
                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-800'
                    }`}
                    onClick={() => {
                      if (setColumnFilters) {
                        setColumnFilters([{ id: column.key, value: 'Active' }]);                   
                      }
                    }}
                  >
                    Filter by {column.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </Menu>

        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-xs px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            <List className="h-4 w-4" />
            <span className="ml-2">Group</span>
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {/* your filter options go here */}
          </MenuItems>
        </Menu>

        {/* Sort Dropdown */}
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-xs px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            Sort
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {sorting.length === 0 ? (
              columns.length === 0 ? (
                <MenuItem>
                  <div className="px-4 py-2 text-sm text-gray-500">No columns available.</div>
                </MenuItem>
              ) : (
                columns.map((column) => (
                  <button
                    key={column.key}
                    className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-gray-800"
                    onClick={() => addSort(column.key, false)}
                  >
                    {column.label}
                  </button>
                ))
              )
            ) : (
              <>
                {sorting.map((sort, index) => (
                  <Menu as="div" key={index} className="relative">
                    <MenuButton className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      {columns.find((col) => col.key === sort.id)?.label || sort.id} (
                      {sort.desc ? 'Descending' : 'Ascending'})
                      <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </MenuButton>
                    <MenuItems className="absolute z-20 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-2">
                        <label className="block text-sm font-medium text-gray-700">Sort by</label>
                        <select
                          value={sort.id}
                          onChange={(e) => updateSort(index, 'id', e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        >
                          {columns.map((col) => (
                            <option key={col.key} value={col.key}>
                              {col.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="px-4 py-2">
                        <label className="block text-sm font-medium text-gray-700">Order</label>
                        <select
                          value={sort.desc ? 'desc' : 'asc'}
                          onChange={(e) => updateSort(index, 'desc', e.target.value === 'desc')}
                          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            className={`block w-full px-4 py-2 text-sm text-left text-red-500 ${
                              active ? 'bg-red-100' : ''
                            }`}
                            onClick={() => removeSort(index)}
                          >
                            Remove Sort
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                ))}
                <MenuItem>
                  {({ active }) => (
                    <button
                      className={`flex items-center w-full px-4 py-2 text-sm text-blue-600 ${
                        active ? 'bg-blue-100' : ''
                      } ${columns.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (columns.length > 0 && columns[0]) {
                          addSort(columns[0].key, false);
                        }
                      }}
                      disabled={columns.length === 0}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Sort
                    </button>
                  )}
                </MenuItem>
              </>
            )}
          </MenuItems>
        </Menu>


        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-xs px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            <PaintBucket className="h-4 w-4" />
            <span className="ml-2">Color</span>
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {/* your filter options go here */}
          </MenuItems>
        </Menu>

        <Menu as="div" className="relative">
          <MenuButton title="Row height" className="flex items-center rounded-xs px-1 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {/* your filter options go here */}
          </MenuItems>
        </Menu>

        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-xs px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            <ExternalLink className="h-4 w-4" />
            <span className="ml-2">Share and syncs</span>
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {/* your filter options go here */}
          </MenuItems>
        </Menu>

        <Menu as="div" className="relative">
          <MenuButton title="Row height" className="flex items-center rounded-xs px-1 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
            <Search className="h-4 w-4" />
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            {/* your filter options go here */}
          </MenuItems>
        </Menu>
      </div>
    </div>
  )
};

export default TableTopBar;