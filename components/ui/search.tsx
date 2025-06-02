import { InputHTMLAttributes } from "react"

type searchInputProps=InputHTMLAttributes<HTMLInputElement>

export function SearchInput({...props}:searchInputProps){
    return(
        <div className="">
            <input className={`border-1 px-4 py-2 min-w-[350px] rounded-lg border-green-700 focus:border-cyan-400 focus:border-2 outline-none text-slate-50`} {...props} />
        </div>
    )
}