import { api } from "~/utils/api";
import Link from "next/link";
import { LoadingPage } from "../loadingpage";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { useState } from "react";

function AddWorkspaceButton() {
  const utils = api.useUtils();

  const [workspaceName, setWorkspaceName] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const createTable = api.workspace.create.useMutation({
    onSuccess: async () => {
      await utils.workspace.getAll.invalidate(); 
    },
  });

    const handleCreateWorkspace = () => {
    if (workspaceName.trim()) {
      createTable.mutate({ name: workspaceName.trim() });
      setWorkspaceName('');
      setIsMenuOpen(false);
    }
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none"
      >
        Create
      </MenuButton>
      {isMenuOpen && (
        <>
          <MenuItems className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 focus:outline-none">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter workspace name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                  if (e.key === 'Enter') {
                    handleCreateWorkspace();
                  }
                }}
                className="w-full px-2 py-1 border text-sm border-gray-300 rounded-md focus:outline-none"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCreateWorkspace()}
                  disabled={createTable.isPending || !workspaceName.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded"
                >
                  Create
                </button>
              </div>
            </div>
          </MenuItems>
        </>
      )}
    </Menu>
  );
}

export function HomeMainContent() {
  const utils = api.useUtils();

  const [tableName, setTableName] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: workspaces, isLoading: workspaceLoading } = api.workspace.getAll.useQuery();


  const createTable = api.workspace.createTableDefault.useMutation({
    onSuccess: async () => {
      await utils.workspace.getAll.invalidate(); 
    },
  });

  const createWorkspace = api.workspace.create.useMutation({
    onSuccess: async () => {
      await utils.workspace.getAll.invalidate();; 
    },
  });

  const handleCreateTable = (workspaceId: string) => {
    if (tableName.trim()) {
      createTable.mutate({ workspaceId, name: tableName.trim() });
      setTableName('');
      setIsMenuOpen(false);
    }
  };



  if (workspaceLoading) return <LoadingPage />;
  if (!workspaces) return <div>Something went wrong! No workspace!</div>;

  if (workspaces.length === 0) {
    return (
      <main className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col">
        <div className="self-start px-6 w-full">
          <h1 className="py-4 text-3xl font-semibold text-gray-900">Home</h1>

          <div className="flex items-center justify-between pr-10">
            <p className="text-gray-600">Opened anytime</p>
            <AddWorkspaceButton />
          </div>
        </div>      
        
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
      <h1 className="px-6 py-4 text-3xl font-semibold text-gray-900">Home</h1>

      {workspaces.map((workspace) => (
        <div key={workspace.id} className="px-6 py-4 ml-6 mt-10 bg-white rounded-lg shadow-sm w-100">
          <div className="flex items-center justify-between">
            <h2 className="text font-semibold text-gray-800">{workspace.name}</h2>
            <Menu as="div" className="relative">
                <MenuButton 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-sm bg-blue-600 text-white font-small rounded hover:bg-blue-700 transition focus:outline-none"
                >
                  Add table
                </MenuButton>
                {isMenuOpen && (
                  <>
                    <MenuItems className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 focus:outline-none">
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Enter table name"
                          value={tableName}
                          onChange={(e) => setTableName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === ' ') {
                              e.stopPropagation();
                            }
                            if (e.key === 'Enter') {
                              handleCreateTable(workspace.id);
                            }
                          }}
                          className="w-full px-2 py-1 border text-sm border-gray-300 rounded-md focus:outline-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCreateTable(workspace.id)}
                            disabled={createTable.isPending || !tableName.trim()}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded"
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    </MenuItems>
                  </>
                )}
              </Menu>
            </div>
            
            {workspace.tables.length > 0 ? (
              <ul className="space-y-1">
                {workspace.tables.map((table) => (
                  <li key={table.id}>
                    <Link href={`/workspace/${workspace.id}/${table.id}`}>
                      <span className="text-blue-600 hover:underline">{table.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No tables yet</p>
            )}


            
        </div>
        
      ))}

    


    </main>
  );
}