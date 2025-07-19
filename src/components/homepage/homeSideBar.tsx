'use client';

import { BookOpen, CaretRight, Export, Globe, House, Plus, ShoppingBagOpen, UsersThree } from "phosphor-react";

export function HomeSideBar() {
  return (
    <>
      <aside className="w-12 h-full px-1 pt-5 pb-1 border-r border-gray-200 flex flex-col justify-between items-center">
        {/* Top Icons */}
        <div className="flex flex-col items-center gap-y-4.5">
          <House size={20} color="#111827" />
          <UsersThree size={20} color="#111827" />
          {/* Divider line */}
          <div className="w-6 border-b border-gray-300 mt-2" />
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col items-center gap-y-4.5">
          <div className="w-6 border-b border-gray-300 mt-2" />
          <BookOpen size={16} color="#9CA3AF" />
          <ShoppingBagOpen size={16} color="#9CA3AF" />
          <Globe size={16} color="#9CA3AF" />
          <Plus size={16} color="#9CA3AF" />
        </div>
      </aside>

      {/* Hover pop-out sidebar */}
      <div className="absolute top-0 h-full w-72 bg-white border-r border-gray-200 shadow-md -translate-x-full group-hover:translate-x-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150">
        <div className="flex flex-col justify-between h-full p-4">
          
          {/* Top Icons */}
          <div className="flex flex-col items-center gap-y-4.5">
            <div className="flex flex-row px-2 py-1 items-center rounded-xs hover:bg-gray-100 w-full">
              <button className="font-medium text-left text-gray-900 cursor-pointer w-full">
                <span>Home</span>

              </button>
              <button className="p-1 rounded-xs hover:bg-gray-200">
                <CaretRight size={12} className="text-gray-900" />
              </button>
            </div>

            <div className="flex flex-row px-2 py-1 items-center rounded-xs hover:bg-gray-100 w-full">
              <button className="font-medium text-left text-gray-900 cursor-pointer w-full">
                <span>All workspaces</span>
              </button>
              <button className="p-1 rounded-xs hover:bg-gray-200">
                <Plus size={12} className="text-gray-900" />
              </button>
              <button className="p-1 rounded-xs hover:bg-gray-200">
                <CaretRight size={12} className="text-gray-900" />
              </button>
            </div>
          </div>

          {/* Bottom Icons */}
          <div className="flex flex-col gap-y-3">
            <div className="w-60 border-b border-gray-300 mt-2 self-center" />
            <button className="flex items-center justify-start gap-1.5 p-1 rounded-xs hover:bg-gray-200">
              <BookOpen size={16} color="#111827" />
              <span className="text-xs text-gray-900">Template and apps</span>
            </button>
            <button className="flex items-center justify-start gap-1.5 p-1 rounded-xs hover:bg-gray-200">
              <ShoppingBagOpen size={16} color="#111827" />
              <span className="text-xs text-gray-900">Marketplace</span>
            </button>
            <button className="flex items-center justify-start gap-1.5 p-1 rounded-xs hover:bg-gray-200">
              <Export size={16} color="#111827" />
              <span className="text-xs text-gray-900">Import</span>
            </button>
            <button className="flex items-center justify-center w-full bg-blue-600 gap-1.5 py-2 rounded">
              <Plus size={16} color="#ffffff" />
              <span className="text-white text-sm font-medium">Create</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}