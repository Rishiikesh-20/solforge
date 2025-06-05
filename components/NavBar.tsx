"use client"
import Image from "next/image";
import { WalletMultiButtonProvider } from "./WalletButtonProvider";
import { useRouter } from "next/navigation";

export function NavBar(){
    const router=useRouter();
    return(
        <div className="fixed flex px-6 py-3 bg-black w-[80%] rounded-4xl mt-1 items-center gap-3 items-center justify-between">
            <div className="flex items-center justify-center gap-3">
                <Image src="/final.png" width={50} height={50} alt="image" />
                <div className="text-bold text-[22px] font-bold text-cyan-400 ">SolForge</div>
            </div>
            <div className="flex gap-6">
                 <button className="px-3 py-1 bg-stone-200 rounded-2xl ">
                    <div className="text-bold text-[16px] text-fuchsia-700 font-bold" onClick={()=>router.push("/createtoken")}>Create Token</div>
                </button>
                <button className="px-3 py-1 bg-stone-200 rounded-2xl ">
                    <div className="text-bold text-[16px] text-fuchsia-700 font-bold" onClick={()=>router.push("/transfertoken")}>Transfer Token</div>
                </button>
            </div>
            <WalletMultiButtonProvider />
        </div>
    )
}