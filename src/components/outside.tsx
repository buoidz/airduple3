import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";

export function Outside() {
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Airtable-style Top Bar */}
      <div className="bg-gray-50 px-6 py-3 hover:bg-white">
        <div className="flex items-center justify-between">
          {/* Left side - Logo/Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center px-4 py-2">
              <Image
                src="/logo/airtable-black.svg"
                alt="airtable logo"
                width={30}
                height={30}
                // className="m-0 p-0"
              />
              <span className="px-4 text-xl font-bold text-gray-900">Airtable</span>
            </div>

            <span className="text-md font-semibold text-gray-900 hover:text-blue-700 focus:outline-none hover:cursor-pointer">Platform</span>
            <span className="text-md font-semibold text-gray-900 hover:text-blue-700 focus:outline-none hover:cursor-pointer">Solutions</span>
            <span className="text-md font-semibold text-gray-900 hover:text-blue-700 focus:outline-none hover:cursor-pointer">Resources</span>
            <span className="text-md font-semibold text-gray-900 hover:text-blue-700 focus:outline-none hover:cursor-pointer">Enterprise</span>
            <span className="text-md font-semibold text-gray-900 hover:text-blue-700 focus:outline-none hover:cursor-pointer">Pricing</span>
          </div>



          {/* Right side - Sign In */}
          <div className="flex items-center gap-2">
            <button className="items-center px-5 py-3 text-md font-medium rounded-xl text-black hover:text-gray-500 border boder-black focus:outline-none hover:cursor-pointer transition duration-75">
                Book Demo
              </button>
            <SignUpButton>
              <button className="items-center px-5 py-3 text-md font-medium rounded-xl text-white hover:bg-gray-500 bg-black focus:outline-none hover:cursor-pointer transition duration-75">
                Sign up for free
              </button>
            </SignUpButton>
            <SignInButton>
              <button className="items-center px-5 py-3 text-md font-medium rounded-xl text-black hover:text-blue-700 focus:outline-none hover:cursor-pointer transition duration-75">
                Log in
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    </div>
  )
}