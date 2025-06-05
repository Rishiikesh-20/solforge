import { Transfer } from "@/components/Transfer";

export default function TransferToken(){
    return (
        <div className="flex flex-col items-center gap-6 mt-22 w-full ">
            <div className="flex font-bold text-[24px] text-slate-100">
                Solana Token Transfer
            </div>
            <Transfer/>
        </div> 
    )
}