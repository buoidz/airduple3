import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Bell, Question } from "phosphor-react";
import { UserMenu } from "../UserMenu";


export function TableSideBar() {
  const { user } = useUser();

  if (!user) return <div>No user info</div>;

  return (
    <aside className="w-14 h-screen px-1 py-4 border border-gray-200 flex flex-col justify-between items-center">
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-y-4.5">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo/airtable-black.svg"
            alt="airtable logo"
            width={24}
            height={24}
            className="h-6 w-6"
          />
        </Link>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-y-4.5">
        {/* <div className="w-6 border-b border-gray-300 mt-2" /> */}
        <Question size={16}/>
        <Bell size={16} />

        <UserMenu size="sm" position="right-up"/>


      </div>
    </aside>
  );
}