import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import {Metadata, PROGRAM_ID} from "@metaplex-foundation/mpl-token-metadata"
import { convertUri } from "./convertUri";

export type TokenDetails={
    name:string,
    symbol:string,
    image:string,
    amount:number,
    mint:string,
    decimals:number
}

export async function getTokenwithMetaData(publicKey:PublicKey,connection:Connection):Promise<TokenDetails[]>{
    const tokenAccounts=await connection.getParsedTokenAccountsByOwner(publicKey,{programId:TOKEN_PROGRAM_ID})
    console.log("Token account: ",tokenAccounts)

    const tokens:TokenDetails[]=[]

    for(const {account} of tokenAccounts.value){
        const mintAddress=new PublicKey(account.data.parsed.info.mint);

        const amount=(account.data.parsed.info.tokenAmount.uiAmount) as number;

        if(amount===0){
            continue;
        }

        const decimals=(account.data.parsed.info.tokenAmount.decimals) as number

        const metaDataPDA=PublicKey.findProgramAddressSync([Buffer.from("metadata"),PROGRAM_ID.toBuffer(),mintAddress.toBuffer()],PROGRAM_ID)[0]

        const accountInfo=await connection.getAccountInfo(metaDataPDA)

        if(!accountInfo){
            continue
        }

        const metaData=Metadata.deserialize(accountInfo.data)[0]

        const uri=metaData.data.uri;

        try{
            const response=await fetch(uri)

            if(!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);

            const contentType=response.headers.get("content-type")

            if(!contentType || !contentType.includes("application/json")){
                throw new Error(`Invalid content-type: ${contentType}`)
            }
            const metaJson=await response.json()
            let image=""
            try{
                image=await convertUri(metaJson.image as string)
                console.log("Image blob",image)
            }catch(e){
                console.log("Error while converting uri to blob : "+e)
                image="Unknown"
            }

            tokens.push({
                name:metaJson.name,
                symbol:metaJson.symbol,
                image,
                amount,
                mint:mintAddress.toBase58(),
                decimals
            })

            console.log({
                name:metaJson.name,
                symbol:metaJson.symbol,
                image:metaJson.image,
                amount,
                mint:mintAddress.toBase58()
            })

        }catch(err){
            tokens.push({
                name:"Unknown",
                symbol:"Unknown Symbol",
                image:"Unknown",
                amount,
                mint:mintAddress.toBase58(),
                decimals
            })
            console.warn("Error while fetching metadata for mint", mintAddress.toBase58(), ":", err);
        }
    }

    return tokens;


}