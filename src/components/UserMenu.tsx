import { SignOutButton, useUser } from "@clerk/nextjs";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Image from "next/image";
import { SignOut } from "phosphor-react";
import clsx from "clsx";

type UserMenuProps = {
  size?: "sm" | "md" ;
  position?: "bottom-left" |  "right-up";
  width?: string;
};

export function UserMenu({
  size = "md",
  position = "bottom-left",
  width = "w-56",
}: UserMenuProps) {
  const { user } = useUser();

  if (!user) return <div>No user info</div>;

  // Size control
  const imageSize = {
    sm: 24,
    md: 32,
  }[size];

  const twSizeClass = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
  }[size];

  // Positioning logic
  const positionClasses = {
    "bottom-left": "top-0 right-0 mt-10",
    "right-up": "left-full bottom-0 ml-5 origin-bottom-left"
  }[position];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="focus:outline-none">
        <Image
          src={user.imageUrl}
          alt="Profile"
          width={imageSize}
          height={imageSize}
          className={clsx(
            twSizeClass,
            "rounded-full cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all duration-200"
          )}
        />
      </MenuButton>

      <MenuItems
        className={clsx(
          "absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 focus:outline-none",
          width,
          positionClasses
        )}
      >
        {/* User Info */}
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900">
            {user.fullName ?? user.firstName ?? "User"}
          </p>
          <p className="text-xs text-gray-500">
            {user.primaryEmailAddress?.emailAddress}
          </p>
        </div>

        <div className="border-t border-gray-100" />

        {/* Logout */}
        <div className="py-1">
          <MenuItem>
            {({ active }) => (
              <SignOutButton>
                <button
                  className={clsx(
                    "flex items-center w-full px-4 py-2 text-sm",
                    active
                      ? "bg-gray-50 text-gray-900"
                      : "text-gray-700"
                  )}
                >
                  <SignOut size={16} className="mr-3 text-gray-400" />
                  Log out
                </button>
              </SignOutButton>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}
