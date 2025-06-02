import { Body } from "./Body";
import { NavBar } from "./NavBar";

export function HomePage(){
    return (
        <div className="flex flex-col items-center gap-6 bg-neutral-900 min-h-screen">
            <NavBar />
            <div className="flex font-bold text-[24px] text-slate-100">
                Solana Token Creator
            </div>
            <Body/>
        </div>
    )
}