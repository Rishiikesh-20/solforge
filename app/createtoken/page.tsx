import { Body } from "@/components/Body";


export default function CreateToken(){
    return (
        <div className="flex flex-col items-center gap-6 mt-22">
            <div className="flex font-bold text-[24px] text-slate-100">
                Solana Token Creator
            </div>
            <Body/>
        </div>  
    )
}