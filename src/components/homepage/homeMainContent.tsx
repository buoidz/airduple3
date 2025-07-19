import { api } from "~/utils/api";
import Link from "next/link";
import { LoadingPage } from "../loadingpage";

export function HomeMainContent() {
  const utils = api.useUtils();

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



  if (workspaceLoading) return <LoadingPage />;
  if (!workspaces) return <div>Something went wrong! No workspace!</div>;

  if (workspaces.length === 0) {
    return (
      <main className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">No workspaces yet</h1>
        <p className="text-gray-500 mb-6">Start by creating your first workspace.</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
          onClick={() => createWorkspace.mutate({ name: "Untitled Workspace" })}
          disabled={createWorkspace.isPending}
        >
          + Create Workspace
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
      <h1 className="px-6 py-4 text-3xl font-semibold text-gray-900">Home</h1>

      {workspaces.map((workspace) => (
        <div key={workspace.id} className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
              onClick={() => createTable.mutate({ workspaceId: workspace.id, name: "New Table"})}
              disabled={createTable.isPending} 
            >
              Add new Table (to default Workspace)
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">{workspace.name}</h2>

          {workspace.tables.length > 0 ? (
            <ul className="space-y-1">
              {workspace.tables.map((table) => (
                <li key={table.id}>
                  <Link href={`/${table.id}`}>
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