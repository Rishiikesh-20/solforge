"use client";
import Image from "next/image";
import { WalletMultiButtonProvider } from "./WalletButtonProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NavBar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="fixed flex px-2 xs:px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-black w-[98%] xs:w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] rounded-2xl sm:rounded-3xl lg:rounded-4xl mt-1 items-center justify-between z-100 gap-2 sm:gap-4 left-1/2 transform -translate-x-1/2">
      <div
        className="flex items-center justify-center gap-1 xs:gap-2 sm:gap-3 cursor-pointer min-w-0 flex-shrink-0"
        onClick={() => router.push("/")}
      >
        <Image
          src="/final.png"
          width={40}
          height={40}
          className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0"
          alt="image"
        />
        <div className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent whitespace-nowrap">
          SolForge
        </div>
      </div>

      <div className="hidden lg:flex gap-4 xl:gap-6">
        <button
          className="text-bold text-sm xl:text-[16px] text-fuchsia-700 bg-stone-200 font-bold hover:bg-fuchsia-700 hover:text-stone-200 rounded-xl xl:rounded-2xl py-2 px-3 xl:px-4 whitespace-nowrap"
          onClick={() => router.push("/createtoken")}
        >
          Create Token
        </button>
        <button
          className="text-bold text-sm xl:text-[16px] text-fuchsia-700 bg-stone-200 font-bold hover:bg-fuchsia-700 hover:text-stone-200 rounded-xl xl:rounded-2xl py-2 px-3 xl:px-4 whitespace-nowrap"
          onClick={() => router.push("/transfertoken")}
        >
          Transfer Token
        </button>
      </div>

      <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
        <div className="scale-75 xs:scale-85 sm:scale-95 lg:scale-100 origin-right">
          <WalletMultiButtonProvider />
        </div>
        <button
          className="lg:hidden text-white p-1 xs:p-1.5 sm:p-2 flex-shrink-0"
          onClick={toggleMenu}
        >
          <svg
            className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg lg:hidden mx-1 xs:mx-2">
          <div className="flex flex-col gap-3 sm:gap-4">
            <button
              className="w-full px-3 sm:px-4 py-2 bg-stone-200 rounded-lg sm:rounded-xl text-fuchsia-700 font-bold hover:bg-fuchsia-700 hover:text-stone-200 text-sm sm:text-base"
              onClick={() => {
                router.push("/createtoken");
                setIsMenuOpen(false);
              }}
            >
              Create Token
            </button>
            <button
              className="w-full px-3 sm:px-4 py-2 bg-stone-200 rounded-lg sm:rounded-xl text-fuchsia-700 font-bold hover:bg-fuchsia-700 hover:text-stone-200 text-sm sm:text-base"
              onClick={() => {
                router.push("/transfertoken");
                setIsMenuOpen(false);
              }}
            >
              Transfer Token
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
