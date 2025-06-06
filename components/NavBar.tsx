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
    <div className="fixed flex px-4 sm:px-6 py-3 bg-black w-[95%] sm:w-[90%] md:w-[80%] rounded-4xl mt-1 items-center justify-between z-100">
      <div
        className="flex items-center justify-center gap-2 sm:gap-3 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src="/final.png"
          width={40}
          height={40}
          className="w-8 h-8 sm:w-10 sm:h-10"
          alt="image"
        />
        <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
          SolForge
        </div>
      </div>

      <div className="hidden md:flex gap-6">
        <button
          className="text-bold text-[16px] text-fuchsia-700 bg-stone-200 font-bold hover:bg-fuchsia-700 hover:text-stone-200 rounded-2xl py-2 px-4"
          onClick={() => router.push("/createtoken")}
        >
          Create Token
        </button>
        <button
          className="text-bold text-[16px] text-fuchsia-700 bg-stone-200 font-bold hover:bg-fuchsia-700 hover:text-stone-200 rounded-2xl py-2 px-4"
          onClick={() => router.push("/transfertoken")}
        >
          Transfer Token
        </button>
      </div>

      <div className="flex items-center gap-4">
        <WalletMultiButtonProvider />

        <button className="md:hidden text-white p-2" onClick={toggleMenu}>
          <svg
            className="w-6 h-6"
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-black rounded-2xl p-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-4">
            <button
              className="w-full px-4 py-2 bg-stone-200 rounded-xl text-fuchsia-700 font-bold hover:bg-fuchsia-700 hover:text-stone-200"
              onClick={() => {
                router.push("/createtoken");
                setIsMenuOpen(false);
              }}
            >
              Create Token
            </button>
            <button
              className="w-full px-4 py-2 bg-stone-200 rounded-xl text-fuchsia-700 font-bold hover:bg-fuchsia-700 hover:text-stone-200"
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
