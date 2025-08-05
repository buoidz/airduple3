import { HomeTopNav } from "./homeTopNav";
import { HomeSideBar } from "./homeSideBar";
import { HomeMainContent } from "./homeMainContent";
import { useUser } from "@clerk/nextjs";
import { Outside } from "../outside";

export function HomeClient() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();


  if (!userLoaded) return <div />;


  return (
    <>
      {isSignedIn ? (
        <>
          <div className="flex flex-col h-screen">
            <nav className="z-50">
              <HomeTopNav />
            </nav>
            <div className="flex flex-1">
              <div className="relative group">
                <HomeSideBar />
              </div>

              <HomeMainContent />
            </div>
          </div>
        </>
        ) : (
        <Outside />
      )}
    </>
  );
}
