"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";

// app/header.tsx
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, HelpCircle, Bell, Plus, ChevronDown } from "lucide-react";

export function HomeTopNav() {
  const { user, isSignedIn } = useUser();

  if (!user) return <div>No user info</div>;


  return (
    <header className="bg-white border-b border-gray-200 shadow-2xs sticky top-0">
      {/* <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn> */}



      <div className="flex items-center justify-between px-3 py-1">
        {/* Sidebar and Logo and Brand */}
        <div className="flex items-center">
          <button className="pr-1 cursor-pointer">
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/airtable.png"
              alt="airtable logo"
              width={50}
              height={50}
              // className="m-0 p-0"
            />
            <span className="text-xl font-semibold text-gray-900">Airtable</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-sm mx-8 ">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center">
              <Search className="h-4 w-4 text-gray-900" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 text-sm font-light border border-gray-300 rounded-4xl placeholder-gray-900 hover:shadow cursor-pointer"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Help */}
          <button className="px-3 py-1 text-gray-900 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer">
            <div className="flex item-center gap-1">
              <HelpCircle className="w-3 h-3 mt-1" />
              <span className="text-sm font-light text-gray-900">Help</span>
            </div>
          </button>

          {/* Notifications */}
          <button className="p-2 text-gray-900 border border-gray-200 hover:text-gray-600 rounded-full hover:bg-gray-200 relative cursor-pointer">
            <Bell className="w-4 h-4" />
          </button>


          {/* User Menu */}
          <div className="relative">
            <button className="flex items-center gap-2 p-2 cursor-pointer">
              <Image 
                src={user.imageUrl}
                alt="Profile"
                width={36}
                height={36}
                className="h-8 w-8 rounded-full cursor-pointer"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
