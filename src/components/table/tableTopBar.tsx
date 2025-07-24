import { Menu, MenuButton, MenuItems, MenuItem, DialogPanel, Dialog, ListboxButton, Listbox, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ArrowDownUp, ChevronDownIcon, ChevronRightIcon, ExternalLink, EyeOff, List, ListFilter, PaintBucket, PlusIcon, Search, XIcon } from 'lucide-react';
import { useState } from 'react';
import type { ColumnFiltersState, ColumnSort, SortingState } from '@tanstack/react-table';

interface TableTopBarProps {
  columns: { key: string; label: string; type: 'TEXT' | 'NUMBER' }[];
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setSorting: (sorting: SortingState) => void;
  sorting: SortingState; // Added sorting prop
}

const TableTopBar = ({ columns, setColumnFilters, setSorting, sorting }: TableTopBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [submenuOpen, setSubmenuOpen] = useState(false)


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
          <MenuButton className="flex items-center rounded-sm px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
            <EyeOff className="h-4 w-4" />
            <span className="ml-2">Hide fields</span>
          </MenuButton>
          <MenuItems className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg">
          </MenuItems>
        </Menu>

        {/* Filter Dropdown */}
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-sm px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
            <ListFilter className="h-4 w-4" />
            <span className="ml-1">Filter</span>
          </MenuButton>
          <MenuItems className="absolute right-0 my-1 z-10 w-48 rounded-md border border-gray-200 shadow-lg bg-white focus:outline-none">
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
          <MenuButton className="flex items-center rounded-sm px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
            <List className="h-4 w-4" />
            <span className="ml-2">Group</span>
          </MenuButton>
          <MenuItems className="absolute z-10 w-48 rounded-md border border-gray-200 shadow-lg bg-white">
          </MenuItems>
        </Menu>

        {/* Sort Dropdown */}
        <Menu as="div" className="relative">
          <MenuButton
            className={`flex items-center rounded-sm px-2 py-1.5 text-sm focus:outline-none ${
              sorting.length > 0
                ? 'bg-red-100 hover:border-gray-300'
                : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowDownUp className="h-4 w-4 mr-1" />
            {sorting.length > 0 ? (
              <span>Sorted by {sorting.length} field{sorting.length > 1 ? 's' : ''}</span>
            ) : (
              <span>Sort</span>
            )}
          </MenuButton>
          <MenuItems 
            className={`absolute right-0 my-1 z-10 w-80 rounded-md border border-gray-200 shadow-lg bg-white p-2 focus:outline-none ${
              sorting.length === 0 ? 'w-80' : 'w-110'
            }`}
          >
            <div className="px-1 py-1 text-sm font-semibold text-gray-500">
              Sort by
            </div>
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
                    onClick={() => addSort(column.key, false)}
                  >
                    {column.label}
                  </button>
                ))
              )
            ) : (

              <>
                {sorting.map((sort, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className = "flex items-center">
                      <div className="w-full relative px-2 py-1">
                        <select
                          id={`column-${index}`}
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
                        <div className="absolute z-10 inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="w-full relative">
                        <select
                          id={`order-${index}`}
                          value={sort.desc ? 'desc' : 'asc'}
                          onChange={(e) => updateSort(index, 'desc', e.target.value === 'desc')}
                          className="w-full rounded-xs border border-gray-300 px-2 py-1 text-sm appearance-none hover:bg-gray-100"
                        >
                          {columns.find((col) => col.key === sort.id)?.type === 'TEXT' ? (
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
                        <div className="absolute z-10 inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <button
                        onClick={() => removeSort(index)}
                        className="px-1 mx-3 py-1 rounded-xs text-gray-400 hover:bg-gray-200 transition"
                        title="Remove sort"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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
                    <div className="absolute top-full w-48 rounded-md bg-white z-50 border border-gray-200 shadow-lg">
                      <div className="px-1 py-1">
                        {columns.map((column) => (
                        <button
                          key={column.key}
                          className="block w-full px-4 py-2 text-sm text-left rounded-sm hover:bg-gray-100 text-gray-800"
                          onClick={() => {
                            addSort(column.key, false);
                            setSubmenuOpen(false);
                          }}
                          disabled={sorting.some(s => s.id === column.key)}                        
                        >
                          {column.label}
                        </button>
                      ))}
                      </div>
                    </div>
                  )}
                </div>


              </>
            )}
          </MenuItems>
        </Menu>


        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-sm px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
            <PaintBucket className="h-4 w-4" />
            <span className="ml-2">Color</span>
          </MenuButton>
          <MenuItems className="absolute z-10 w-48 rounded-md border border-gray-200 shadow-lg bg-white">
          </MenuItems>
        </Menu>

        <Menu as="div" className="relative">
          <MenuButton title="Row height" className="flex items-center rounded-sm px-1 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuItems className="absolute z-10 w-48 rounded-md border border-gray-200 shadow-lg bg-white">
          </MenuItems>
        </Menu>

        <Menu as="div" className="relative">
          <MenuButton className="flex items-center rounded-sm px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
            <ExternalLink className="h-4 w-4" />
            <span className="ml-2">Share and syncs</span>
          </MenuButton>
          <MenuItems className="absolute z-10 w-48 rounded-md border border-gray-200 shadow-lg bg-white">
          </MenuItems>
        </Menu>

        <Menu as="div" className="relative">
          <MenuButton title="Row height" className="flex items-center rounded-sm px-1 py-1.5 text-sm text-gray-800 hover:bg-gray-100 focus:outline-none">
            <Search className="h-4 w-4" />
          </MenuButton>
          <MenuItems className="absolute z-10 w-48 rounded-md border border-gray-200 shadow-lg bg-white">
          </MenuItems>
        </Menu>
      </div>
    </div>
  )
};

export default TableTopBar;