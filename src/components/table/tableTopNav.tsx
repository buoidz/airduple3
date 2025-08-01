import { DiamondPlus } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ClockCounterClockwise } from "phosphor-react";
import { api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "../loadingpage";


export function TableTopNav({ loadingState }: { loadingState: boolean }) {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const {data: workspaceName} = api.workspace.getWorkspaceName.useQuery({workspaceId});

  return (
    <header className="shrink-0 sticky z-10 h-14 bg-white top-0 flex items-center px-5">
      <div className="flex items-center gap-4">
        <div className="p-1 rounded-md bg-blue-600">
          <Image
            src="/logo/airtable-white.png"
            alt="Airtable Logo"
            width={22}
            height={22}
          />
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold pr-3">{workspaceName}</h1>

          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 relative inline-block ${
                  loadingState ? "opacity-100" : "opacity-0"
                }`}
            >
              <LoadingSpinner
                size={18}
              />
            </span>
            <span
              className={`w-12 text-gray-700 transition-opacity duration-200 ${
                loadingState ? "opacity-100" : "opacity-0"
              }`}
            >
              Loading...
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center relative font-medium text-xs">
          <button className="px-4 py-4 text-sm text-black relative">
            Data
          <div className="absolute -bottom-px left-0 right-0 flex justify-center">
            <div className="w-8 h-0.5 bg-blue-600"></div>
          </div>
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 relative">
            Automations
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 relative">
            Interfaces
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 relative">
            Forms
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ClockCounterClockwise size={16} />
        <button className="px-3 py-2 rounded-4xl text-white text-xs bg-gray-400 flex items-center gap-1">
          <DiamondPlus size={16}/>
          Upgrade
        </button>
        <button className="px-3 py-2 text-white text-xs rounded-md bg-blue-600 shadow-sm">
          Share
        </button>


      </div>
    </header>
    
  );
}
