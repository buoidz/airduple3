import { useState } from "react";
import { TableSideBar } from "./tableSideBar";
import { TableTopNav } from "./tableTopNav";
import { TableMainContent } from "./tableMainContent";
import { TableSwitcher } from "./tableSwitcher";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Outside } from "../outside";


type RowData = Record<string, any>;

export function TableClient() {
  const [loadingState, setLoadingState] = useState(true);
  const { isLoaded: userLoaded, isSignedIn } = useUser();


  if (!userLoaded) return <div />;

  return (
    <>
      {isSignedIn ? (
        <>
          <div className="flex w-full h-screen overflow-hidden">
            <TableSideBar />

            <div className="flex flex-col h-full flex-1 min-w-0">
              <TableTopNav loadingState={loadingState}/>
              <TableSwitcher />
              <TableMainContent onChangeLoadingState={setLoadingState} />
            </div>
          </div>
        </>
        ) : (
        <Outside />
      )}
    </>
  );
}
