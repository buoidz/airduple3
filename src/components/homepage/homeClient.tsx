"use client";

// import { api } from "~/trpc/server";
import { HomeTopNav } from "./homeTopNav";
import { HomeSideBar } from "./homeSideBar";
import { HomeMainContent } from "./homeMainContent";
import { SignInButton, useUser } from "@clerk/nextjs";

export function HomeClient() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();


  if (!userLoaded) return <div />;


  return (
    <>
      {isSignedIn ? (
        <>
          <div className="flex flex-col h-screen">
            <HomeTopNav />
            <div className="flex flex-1">
              <div className="relative group">
                <HomeSideBar />
              </div>

              <HomeMainContent />
            </div>
          </div>
        </>
        ) : (
        <div className="border-b border-gray-200">
          <SignInButton />
        </div>
      )}
    </>
  );
}
