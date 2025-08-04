import { api } from "~/utils/api";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { useState } from "react";

export function TableSwitcher() {
  const router = useRouter();
  const params = useParams();
  const currentTableId = params?.tableId as string;
  const workspaceId = params?.workspaceId as string;
  const utils = api.useUtils();
  

  const { data: tables, isLoading } = api.workspace.getTablesInWorkspace.useQuery(
    {
      workspaceId: workspaceId,
    },
  );

  const [tableName, setTableName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const createTableMutation = api.workspace.createTableDefault.useMutation({
    onSuccess: async () => {
      setTableName('');
      await utils.workspace.getTablesInWorkspace.invalidate();

    },
    onError: (error) => {
      console.error('Failed to create table:', error);
    }
  });

  const handleCreateTable = async (workspaceId: string) => {
    if (tableName.trim() && !createTableMutation.isPending) {
      await createTableMutation.mutateAsync({ workspaceId, name: tableName.trim() });
      setIsMenuOpen(false);
    }
  };
	

  if (isLoading) return <div className="bg-gray-50 border-t border-b border-gray-300 text-sm p-2 min-h-[32px]"> </div>;
  if (!tables) return null;

  return (
    <div className="bg-gray-50 border-t border-b border-gray-300 ">
      <div className="flex">
        {tables.map((table, index) => (
          <button
            key={table.id}
            onClick={() => router.push(`/workspace/${workspaceId}/${table.id}`)}
            className={clsx(
              "flex-shrink-0 px-3 py-2 text-xs rounded-sm rounded-b-none relative z-10",
              table.id === currentTableId
				? clsx(
						"bg-white border-t border-r border-gray-300 font-semibold text-gray-700",
						index !== 0 && "border-l"
					)
				: "text-gray-500 hover:bg-gray-200 font-sm"
            )}
          >
            {table.name}
          </button>
        ))}

        {createTableMutation.isPending && (
          <div className="flex-shrink-0 px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-sm rounded-b-none flex items-center gap-2">
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Creating...
          </div>
        )}

        <div className="pl-2 flex items-center">
          <div className="border-l border-gray-300 h-5" />
        </div>

				<Menu as="div" className="relative">
					<MenuButton onClick={() => setIsMenuOpen(true)} className="flex-shrink-0 px-3 py-2 text-xs text-gray-500 hover:bg-gray-200 rounded-sm rounded-b-none focus:outline-none">
						+ Add Table
					</MenuButton>
          {isMenuOpen && (

            <MenuItems className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50 p-3 focus:outline-none">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.stopPropagation();
                      }
                      if (e.key === 'Enter') {
                        void handleCreateTable(workspaceId);
                      }
                    }}
                    placeholder="Enter table name..."
                    className="w-full px-2 py-1 border text-sm border-gray-300 rounded-md focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => handleCreateTable(workspaceId)}
                    disabled={!tableName.trim() || createTableMutation.isPending}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded"
                  >
                    Create
                  </button>
                </div>
              </div>
            </MenuItems>
          )}
				</Menu>
      </div>
    </div>
  );
}