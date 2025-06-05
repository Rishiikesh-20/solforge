import { InputHTMLAttributes } from "react"

type searchInputProps=InputHTMLAttributes<HTMLInputElement>

export function SearchInput({...props}:searchInputProps){
    return(
        <div className="">
            <input className={`w-full px-4 py-2 rounded-lg border border-green-600 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition duration-200 shadow-sm`} {...props} />
        </div>
    )
}