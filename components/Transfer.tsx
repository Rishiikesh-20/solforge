"use client"
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { getTokenwithMetaData,TokenDetails } from "./getTokensWithMetadata";
import { useState } from "react";
import Image from "next/image";
import { SearchInput } from "./ui/search";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getExplorerLink } from "gill";
export function Transfer(){
    const {connection} =useConnection()
    const {publicKey,sendTransaction}=useWallet()
    const [tokens,setTokens]=useState<TokenDetails[]>([])
    const [message,setMessage]=useState("")
    const [popup,setPopup]=useState(false)
    const [success,setSuccess]=useState(false)
    const [Loading,setLoading]=useState(false)
    const [selectedToken,setSelectedToken]=useState<TokenDetails | null>(null)
    const [signature,setSignature]=useState("")
    const [receiverAddress,setReceiverAddress]=useState("")
    const [amount,setAmount]=useState<number>(0)
    async function handleToken(){
        if(!publicKey){
            console.error("Account is not connected")
            return;
        }
        try{
            setLoading(true)
            if(tokens.length==0){
                const result=await getTokenwithMetaData(publicKey,connection)
                setTokens(result)
                console.log("In Transfer: Tokens : ",result)
            }
            setLoading(false)
            setPopup(true)
        }catch(e){
            setMessage("Unexpected error while getting Token Details")
            console.log("Error while getting Token Details : "+e)
        }
    }

    async function handleClick(token:TokenDetails){
        setSelectedToken(token)
        setPopup(false)
    }

    async function handleTransfer(){
        try{
            setLoading(true)
            if(selectedToken?.mint===undefined ){
                throw new Error("Mint address undefined")
            }
            if(publicKey===null){
                throw new Error("")
            }

            const transaction = new Transaction()

            const senderATA=getAssociatedTokenAddressSync(new PublicKey(selectedToken.mint),publicKey)

            const receiverATA=getAssociatedTokenAddressSync(new PublicKey(selectedToken.mint),new PublicKey(receiverAddress))

            const receiverAccountInfo=await connection.getAccountInfo(receiverATA)


            if(!receiverAccountInfo){
                const ins1=createAssociatedTokenAccountInstruction(publicKey,receiverATA,new PublicKey(receiverAddress),new PublicKey(selectedToken.mint))
                transaction.add(ins1)
            }

            const amount1=BigInt(amount*Math.pow(10,selectedToken.decimals))

            const ins=createTransferInstruction(senderATA,receiverATA,publicKey,amount1)

            transaction.add(ins)

            const signature=await sendTransaction(transaction,connection)
            setSignature(signature)
            console.log("signature : ",signature)
            setMessage("Successful , Signature: "+signature)
            setLoading(false)
            setSuccess(true)
            
        }catch(e){
            if(e instanceof Error){
                setMessage(e.message)
                setLoading(false)
                return;
            }

            console.log("Error while transfering tokens : ",e)
            setMessage("Error while Transfering tokens")
        }
    }

    return ( 
        <div className="w-full h-full flex items-center justify-center">
            {popup ? 
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="relative bg-white rounded-xl shadow-xl p-8 w-[400px]">
                        <button
                        className="absolute top-3 left-3 text-gray-500 hover:text-black text-2xl font-bold focus:outline-none"
                         onClick={() => setPopup(false)}
                        >
                            &times;
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center">Select any one of your Token</h2>
                        {tokens.length==0?
                        <p>No tokens</p>:
                        <ul className="flex flex-col gap-6 max-w-full w-full overflow-y-auto h-[250px] p-4 whitespace-nowrap">
                            {tokens.map((token) => (
                                <li key={token.mint} className="flex items-center gap-4 border rounded-xl border-gray-300 p-4 bg-white shadow-sm hover:shadow:lg hover:border-gray-700 transition-all cursor-pointer" onClick={()=>handleClick(token)}>
                                    <Image src={token.image!=="Unknown"? token.image :"/final.png"} alt={"/final.png"} width={80} height={80} className="rounded-md object-cover border border-gray-200"/>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-lg text-gray-800  font-semibold">{token.name}</div>
                                        <div className="text-sm text-gray-600">{token.amount} {token.symbol}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        }
                    </div>
                </div>
                :success?  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <div className="relative flex flex-col w-[50%] h-[70%] bg-white rounded-lg p-4 items-center gap-6  items-center justify-center">
                                    <button
                                        className="absolute top-3 left-3 text-gray-500 hover:text-black text-2xl font-bold focus:outline-none"
                                        onClick={() => setSuccess(false)}
                                    >&times;</button>
                                    <div className="font-bold text-green-500 text-xl">
                                        Successfully Transferred {amount} {selectedToken?.symbol}
                                    </div>
                                    <div className="flex w-[300px] h-[100px] overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm hover:shadow-lg  transition-all cursor-pointer">
                                        <div className="w-[30%] h-full">
                                            <Image
                                                src={selectedToken?.image !== "Unknown" ? selectedToken?.image : "/final.png"}
                                                alt="Token Image"
                                                width={100}
                                                height={100}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>      
                                        <div className="flex flex-col justify-center items-center w-[70%] p-2">
                                            <div className="text-lg text-gray-800  font-semibold">Name: {selectedToken?.name}</div>
                                            <div className="text-sm text-gray-600">
                                                Balance: {(selectedToken?.amount || 0) - amount} {selectedToken?.symbol}  <span className="text-red-500">-{amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6 items-center justify-center">
                                        <div>Links</div>
                                        <a className="text-blue-700" href={getExplorerLink({transaction:signature,cluster:"devnet"})}>Transfer Signature</a>
                                    </div>
                                </div>
                            </div>
                :

                <div className="flex flex-col w-[70%] min-h-[600px] bg-slate-700 rounded-lg p-2 items-center gap-6">
                    <div className="p-2 h-full">
                        <button
                        onClick={handleToken}
                        disabled={publicKey === null || Loading}
                        className={`font-bold text-[20px] p-2 rounded-lg transition duration-300 
                            ${publicKey === null || Loading 
                            ? "bg-slate-400 text-gray-300 cursor-not-allowed opacity-60"
                            : "bg-slate-300 text-gray hover:opacity-70 cursor-pointer"}`}
                        >
                        {Loading
                            ? "Loading..."
                            : publicKey
                            ? "Select your token"
                            : "Connect to the Account"}
                        </button>
                    </div>
                    <div className="flex flex-wrap w-[80%] gap-9 text-slate-300 h-full">
                        <div className="w-full sm:w-[48%]">
                            <div className="font-bold text-[20px]">Mint Address</div>
                            <SearchInput disabled={selectedToken===null} placeholder={selectedToken ? selectedToken.mint: "Select your token"}/>
                        </div> 
                        <div className="w-full sm:w-[48%]">
                            <div className="font-bold text-[20px]">From </div>
                            <SearchInput placeholder={publicKey?`${publicKey.toBase58()}`:"Connect to the Account"} disabled/>
                        </div> 
                        <div className="w-full sm:w-[48%]">
                            <div className="font-bold text-[20px]">Receiver Public Key </div>
                            <SearchInput onChange={(e)=>setReceiverAddress(e.target.value)} value={receiverAddress}/>
                        </div> 
                        <div className="w-full sm:w-[48%]">
                            <div className="font-bold text-[20px]">Amount </div>
                                <SearchInput
                                type="number"
                                value={amount}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && selectedToken && value > selectedToken.amount) return;
                                    setAmount(value);
                                }}
                                max={selectedToken?.amount ?? 0}
                                />                       
                            </div>    
                        </div>
                    {selectedToken?<div className="flex w-[300px] h-[100px] overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm hover:shadow-lg  transition-all cursor-pointer">
                        <div className="w-[30%] h-full">
                            <Image
                                src={selectedToken.image !== "Unknown" ? selectedToken.image : "/final.png"}
                                alt="Token Image"
                                width={100}
                                height={100}
                                className="w-full h-full object-cover"
                            />
                        </div>      
                        <div className="flex flex-col justify-center items-center w-[70%] p-2">
                            <div className="text-lg text-gray-800  font-semibold">Name: {selectedToken.name}</div>
                            <div className="text-sm text-gray-600">Balance: {selectedToken.amount} {selectedToken.symbol}</div>
                        </div>
                    </div>: null}
                    <div className="flex items-center justify-center w-full h-full">
                        <button
                            onClick={handleTransfer}
                            disabled={selectedToken === null || publicKey === null || Loading || receiverAddress === "" || amount === 0}
                            className={`text-2xl font-bold text-white px-4 py-2 rounded-xl shadow-lg text-center w-fit transition duration-300
                            ${
                                selectedToken === null || publicKey === null || Loading || receiverAddress === "" || amount === 0
                                ? "bg-gray-400 cursor-not-allowed opacity-60"
                                : "bg-gradient-to-r from-cyan-500 to-green-500 cursor-pointer hover:opacity-90"
                            }`}
                        >
                            {Loading
                            ? "Loading..."
                            : publicKey === null
                            ? "Connect to the account"
                            : selectedToken === null
                            ? "Select the token"
                            : receiverAddress === "" || amount === 0
                            ? "Fill all the Details"
                            : "Transfer tokens"}
                        </button>
                        </div>
                        <div className="text-slate-100">
                                {message}
                        </div>
                    </div>
                    
            } 
        </div>
              
    )
}