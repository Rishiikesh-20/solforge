"use client"
import { ChangeEvent, useCallback, useState } from "react";
import { SearchInput } from "./ui/search";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction ,LAMPORTS_PER_SOL} from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as token from "@solana/spl-token"

import Image from "next/image";
import { uploadJSONToPinata, uploadToPinata } from "./upload";
import { DataV2,createCreateMetadataAccountV3Instruction,PROGRAM_ID} from "@metaplex-foundation/mpl-token-metadata";


export function Body(){
    const [name,setName]=useState("")
    const [symbol,setSymbol]=useState("")
    const [supply,setSupply]=useState(1)
    const [decimals,setDecimals]=useState(6)
    const [description,setDescription]=useState("")
    const [metaDataUri,setMetaDataUri]=useState("")
    const wallet=useWallet()
    const [message,setMessage]=useState("")
    const [isUploading,setIsUploading]=useState(false);
    const [imageData,setImageData]=useState<string | null>(null)
    const [imageUri,setImageUri]=useState("")
    const {connection}=useConnection()
    const MPL_TOKEN_METADATA_PROGRAM_ID=new PublicKey(PROGRAM_ID)

    async function MintCreation(){
        try{
            if(!connection){
                setMessage("Not connected to the wallet")
                console.error("Not connected to the wallet")
                return
            }
            if(!wallet.publicKey){
                setMessage("Not connected to the account")
                console.error("Not connected to the account")
                return
            }
            if (!imageUri) {
                setMessage("Please upload an image first")
                return
            }

            const rent=await getMinimumBalanceForRentExemptMint(connection)
            const balance=await connection.getBalance(wallet.publicKey)
            if(balance<rent+10000){
                console.error("Insufficient balance")
                setMessage(`Insufficient balance. Required sol : ${(rent+10000)/LAMPORTS_PER_SOL} `)
                return;
            }
            const mintKeyPair=Keypair.generate()

            const transaction=new Transaction();

            const ins1=SystemProgram.createAccount({
                newAccountPubkey:mintKeyPair.publicKey,
                fromPubkey:wallet.publicKey,
                lamports:rent,
                space:MINT_SIZE,
                programId:TOKEN_PROGRAM_ID
            })

            const ins2=token.createInitializeMint2Instruction(mintKeyPair.publicKey,decimals,wallet.publicKey,wallet.publicKey,TOKEN_PROGRAM_ID)

            transaction.add(ins1,ins2)

            const ATA=token.getAssociatedTokenAddressSync(mintKeyPair.publicKey,wallet.publicKey)

            const ins3=token.createAssociatedTokenAccountInstruction(wallet.publicKey,ATA,wallet.publicKey,mintKeyPair.publicKey)

            transaction.add(ins3)

            const metaData = {
                name,
                symbol,
                description,
                image: imageUri,
                attributes: [],
                properties: {
                    files: [
                        {
                            uri: imageUri,
                            type: "image/png"
                        }
                    ],
                    category: "image"
                }
            }
            console.log("Uploading metadata to IPFS...")
            const jsonUri = await uploadJSONToPinata(metaData, `${name}-metadata.json`)

            console.log("MetaDataJson is uploaded : "+jsonUri)

            setMetaDataUri(jsonUri)

            const [metaDataPDA]=PublicKey.findProgramAddressSync([Buffer.from("metadata"),MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),mintKeyPair.publicKey.toBuffer()],MPL_TOKEN_METADATA_PROGRAM_ID)

            const dataV2:DataV2={
                name:metaData.name,
                symbol:metaData.symbol,
                uri:jsonUri,
                sellerFeeBasisPoints:0,
                creators:null,
                collection:null,
                uses:null
            }

            const createMetaIns=createCreateMetadataAccountV3Instruction({
                metadata:metaDataPDA,
                mint:mintKeyPair.publicKey,
                payer:wallet.publicKey,
                mintAuthority:wallet.publicKey,
                updateAuthority:wallet.publicKey
            },{
                createMetadataAccountArgsV3:{
                    data:dataV2,
                    isMutable:true,
                    collectionDetails:null
                }
            })

            transaction.add(createMetaIns)

            const ins4 = token.createMintToInstruction(
                mintKeyPair.publicKey,
                ATA,
                wallet.publicKey,
                supply * Math.pow(10, decimals) 
            )

            transaction.add(ins4)

            console.log("Transaction instructions : "+ transaction.instructions)

            const signature =  await wallet.sendTransaction(transaction,connection,{signers:[mintKeyPair]})

            console.log("Signature of token mint: "+signature)
            setMessage("Token minted and metadata account created")
        }catch(e){
            console.error("Error in mint Creation : "+e)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMessage((e as any).message || "Something went wrong")
        }
    }
    const handleImageUpload = useCallback(async (event:ChangeEvent<HTMLInputElement>)=>{
        const file = event.target.files?.[0]
        if(!file){
            return
        }
        if (!file.type.startsWith('image/')) {
            setMessage("Please select a valid image file")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage("Image size should be less than 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setImageData(base64String)
        }
        reader.readAsDataURL(file)

        try {
            setMessage("Uploading image to IPFS...")
            setIsUploading(true)
            
            const uri = await uploadToPinata(file, `${name || 'token'}-image.${file.name.split('.').pop()}`)
            setImageUri(uri)
            setMessage("Image uploaded successfully!")
            console.log("Image uploaded to IPFS:", uri)
            
        } catch (err) {
            console.error("Failed to upload image:", err)
            setMessage("Failed to upload image to IPFS")
        } finally {
            setIsUploading(false)
        }

    },[name])

    return(
        <div className="flex flex-col w-[70%] p-6 bg-slate-700  rounded-2xl md:flex-wrap gap-4 items-center justify-center">
            <div className="flex flex-col  md:flex-row flex-wrap gap-6 items-center justify-center">
                <div className="flex flex-col text-slate-100 gap-2 min-w-[400px]">
                <div>
                    Name:
                </div>
                <SearchInput placeholder="Ex: Solana" onChange={(e)=>{setName(e.target.value)}} value={name}/>
                </div>
                <div className="flex flex-col text-slate-100 gap-2 min-w-[400px]">
                    <div>
                        Symbol:
                    </div>
                    <SearchInput placeholder="Ex:SOL" onChange={(e)=>{setSymbol(e.target.value)}} value={symbol}/>
                </div>
                <div className="flex flex-col text-slate-100 gap-2 min-w-[400px]">
                    <div>
                        Decimals:
                    </div>
                    <SearchInput placeholder="Ex:SOL" type="number" onChange={(e)=>{setDecimals(parseInt(e.target.value))}} value={decimals}/>
                </div>
                <div className="flex flex-col text-slate-100 gap-2 min-w-[400px]">
                    <div>
                        Supply:
                    </div>
                    <SearchInput placeholder="Ex:SOL" type="number" onChange={(e)=>{setSupply(parseInt(e.target.value))}} value={supply}/>
                </div>
               <div className="flex flex-col text-slate-100 gap-2 min-w-[400px]">
                    <div>
                        Description:
                    </div>
                    <textarea placeholder="Description"  onChange={(e)=>{setDescription(e.target.value)}} className="w-[400px] h-[100px] bg-white text-gray-700 rounded-lg p-2 border border-green-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200" value={description}/>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 px-3 py-1 bg-slate-500 shadow-lg rounded-2xl mt-10 border border-gray-200">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                {imageUri && (
                    <div className="text-green-400 text-sm">
                        ✓ Image uploaded to IPFS
                    </div>
                )}
            </div>

            <div className="max-w-[100px] max-h-[100px]">
                {imageData && (
                    <Image
                    src={imageData}
                    alt="image preview"
                    className="max-w-[100px] w-full rounded-lg shadow-md"
                    width={100}
                    height={100}
                    />
                )}  
            </div>
              
            <div>
                <button className={`px-3 py-1 rounded-lg ${
                        isUploading || !imageUri 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-cyan-500 hover:bg-cyan-600'
                    }`} onClick={MintCreation}>{isUploading?'Processing':'Create Token'}</button>
            </div>

            <div className="text-slate-100 text-center max-w-[600px] break-words">
                {message}
            </div>

            {metaDataUri && (
                <div className="text-green-400 text-sm">
                    <a href={metaDataUri} target="_blank" rel="noopener noreferrer">
                        View Metadata on IPFS
                    </a>
                </div>
            )}     
        </div>
    )
}