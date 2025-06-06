"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function SolForgeLanding() {
  const router = useRouter();
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
      <div className="mt-40 flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-4 bg-black/30 backdrop-blur-sm rounded-full p-4 border border-slate-600">
          <Image src="/final.png" alt="image" width={60} height={60} />
          <div className="text-4xl sm-text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
            SolForge
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 mt-10">
          <h2 className="text-xl sm:text-3xl font-bold text-green-400">
            About SolForge
          </h2>
          <p className="text-xl sm:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed ">
            You can create new tokens on the Solana blockchain with custom
            metadata and transfer tokens from your wallet to any valid Solana
            public address. Currently, the app supports Devnet only. Mainnet
            support will be introduced in Version 2 after thorough testing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            className="flex-1 px-6 py-3 rounded-2xl bg-fuchsia-100 text-fuchsia-800 font-semibold shadow hover:bg-fuchsia-700 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            onClick={() => router.push("/createtoken")}
          >
            Create Token
          </button>
          <button
            className="flex-1 px-6 py-3 rounded-2xl bg-fuchsia-100 text-fuchsia-800 font-semibold shadow hover:bg-fuchsia-700 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            onClick={() => router.push("/transfertoken")}
          >
            Transfer Token
          </button>
        </div>
      </div>
    </div>
  );
}
