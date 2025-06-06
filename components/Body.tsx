"use client";
import { ChangeEvent, useCallback, useState } from "react";
import { SearchInput } from "./ui/search";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as token from "@solana/spl-token";

import Image from "next/image";
import { uploadJSONToPinata, uploadToPinata } from "./upload";
import {
  DataV2,
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { getExplorerLink } from "gill";

export function Body() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState(1);
  const [decimals, setDecimals] = useState(6);
  const [description, setDescription] = useState("");
  const [metaDataUri, setMetaDataUri] = useState("");
  const wallet = useWallet();
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState("");
  const { connection } = useConnection();
  const [Loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signature, setSignature] = useState("");
  const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(PROGRAM_ID);

  async function MintCreation() {
    try {
      setLoading(true);
      if (!connection) {
        setMessage("Not connected to the wallet");
        console.error("Not connected to the wallet");
        return;
      }
      if (!wallet.publicKey) {
        setMessage("Not connected to the account");
        console.error("Not connected to the account");
        return;
      }
      if (!imageUri) {
        setMessage("Please upload an image first");
        return;
      }

      const rent = await getMinimumBalanceForRentExemptMint(connection);
      const balance = await connection.getBalance(wallet.publicKey);
      if (balance < rent + 10000) {
        console.error("Insufficient balance");
        setMessage(
          `Insufficient balance. Required sol : ${(rent + 10000) / LAMPORTS_PER_SOL} `
        );
        return;
      }
      const mintKeyPair = Keypair.generate();

      const transaction = new Transaction();

      const ins1 = SystemProgram.createAccount({
        newAccountPubkey: mintKeyPair.publicKey,
        fromPubkey: wallet.publicKey,
        lamports: rent,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      });

      const ins2 = token.createInitializeMint2Instruction(
        mintKeyPair.publicKey,
        decimals,
        wallet.publicKey,
        wallet.publicKey,
        TOKEN_PROGRAM_ID
      );

      transaction.add(ins1, ins2);

      const ATA = token.getAssociatedTokenAddressSync(
        mintKeyPair.publicKey,
        wallet.publicKey
      );

      const ins3 = token.createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ATA,
        wallet.publicKey,
        mintKeyPair.publicKey
      );

      transaction.add(ins3);

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
              type: "image/png",
            },
          ],
          category: "image",
        },
      };
      console.log("Uploading metadata to IPFS...");
      const jsonUri = await uploadJSONToPinata(
        metaData,
        `${name}-metadata.json`
      );

      console.log("MetaDataJson is uploaded : " + jsonUri);

      setMetaDataUri(jsonUri);

      const [metaDataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeyPair.publicKey.toBuffer(),
        ],
        MPL_TOKEN_METADATA_PROGRAM_ID
      );

      const dataV2: DataV2 = {
        name: metaData.name,
        symbol: metaData.symbol,
        uri: jsonUri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      };

      const createMetaIns = createCreateMetadataAccountV3Instruction(
        {
          metadata: metaDataPDA,
          mint: mintKeyPair.publicKey,
          payer: wallet.publicKey,
          mintAuthority: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: dataV2,
            isMutable: true,
            collectionDetails: null,
          },
        }
      );

      transaction.add(createMetaIns);

      const ins4 = token.createMintToInstruction(
        mintKeyPair.publicKey,
        ATA,
        wallet.publicKey,
        supply * Math.pow(10, decimals)
      );

      transaction.add(ins4);

      console.log("Transaction instructions : " + transaction.instructions);

      const signature = await wallet.sendTransaction(transaction, connection, {
        signers: [mintKeyPair],
      });
      setSignature(signature);
      setSuccess(true);
    } catch (e) {
      console.error("Error in mint Creation : " + e);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessage((e as any).message || "Something went wrong");
      return;
    } finally {
      setLoading(false);
    }
  }
  const handleImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      setLoading(true);

      const file = event.target.files?.[0];
      if (!file) {
        setLoading(false);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setLoading(false);
        setMessage("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setLoading(false);
        setMessage("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageData(base64String);
      };
      reader.readAsDataURL(file);

      try {
        setMessage("Uploading image to IPFS...");
        setIsUploading(true);

        const uri = await uploadToPinata(
          file,
          `${name || "token"}-image.${file.name.split(".").pop()}`
        );
        setImageUri(uri);
        setMessage("Image uploaded successfully!");
        console.log("Image uploaded to IPFS:", uri);
      } catch (err) {
        setLoading(false);
        console.error("Failed to upload image:", err);
        setMessage("Failed to upload image to IPFS");
      } finally {
        setLoading(false);
        setIsUploading(false);
      }
    },
    [name]
  );

  function closeSuccessModal() {
    setMessage("");
    setImageData(null);
    setImageUri("");
    setSupply(0);
    setName("");
    setSymbol("");
    setDescription("");
    setDecimals(0);
    setMetaDataUri("");
    setSuccess(false);
  }

  return (
    <div className="flex flex-col items-center min-h-screen w-full px-2 sm:px-4 py-4 sm:py-6">
      {Loading ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-slate-900 w-full">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-blue-400"></div>
          <span className="mt-4 text-base sm:text-lg text-blue-400">
            Loading...
          </span>
        </div>
      ) : (
        <div className="flex flex-col w-full max-w-6xl mx-auto p-3 sm:p-4 md:p-6 bg-slate-800 rounded-2xl gap-4 sm:gap-6 items-center justify-center border border-slate-600">
          {success && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-600 shadow-2xl">
                <button
                  onClick={closeSuccessModal}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-center text-white mb-3 sm:mb-4">
                  Token Created Successfully!
                </h3>

                <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-slate-600">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-500 flex-shrink-0">
                      <Image
                        src={imageData || "/final.png"}
                        alt="Token Image"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                        {name}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 mb-1">
                        Symbol: {symbol}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400">
                        Supply: {supply.toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                </div>

                {metaDataUri && (
                  <div className="text-center mb-4 sm:mb-6">
                    <a
                      href={metaDataUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs sm:text-sm transition-colors break-all"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View Metadata on IPFS
                    </a>
                  </div>
                )}

                {signature && (
                  <div className="text-center mb-4 sm:mb-6">
                    <a
                      href={getExplorerLink({
                        transaction: signature,
                        cluster: connection.rpcEndpoint.includes("devnet")
                          ? "devnet"
                          : "mainnet",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs sm:text-sm transition-colors break-all"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View Transaction Signature
                    </a>
                  </div>
                )}

                <button
                  onClick={closeSuccessModal}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col lg:flex-row flex-wrap gap-3 sm:gap-4 md:gap-6 items-start justify-center w-full">
            <div className="flex flex-col text-slate-200 gap-2 w-full lg:w-[48%]">
              <div className="text-sm sm:text-base">Name:</div>
              <SearchInput
                placeholder="Ex: Solana"
                onChange={(e) => {
                  setName(e.target.value);
                }}
                value={name}
              />
            </div>
            <div className="flex flex-col text-slate-200 gap-2 w-full lg:w-[48%]">
              <div className="text-sm sm:text-base">Symbol:</div>
              <SearchInput
                placeholder="Ex:SOL"
                onChange={(e) => {
                  setSymbol(e.target.value);
                }}
                value={symbol}
              />
            </div>
            <div className="flex flex-col text-slate-200 gap-2 w-full lg:w-[48%]">
              <div className="text-sm sm:text-base">Decimals:</div>
              <SearchInput
                placeholder="Ex: 6"
                type="number"
                onChange={(e) => {
                  setDecimals(parseInt(e.target.value));
                }}
                value={decimals}
              />
            </div>
            <div className="flex flex-col text-slate-200 gap-2 w-full lg:w-[48%]">
              <div className="text-sm sm:text-base">Supply:</div>
              <SearchInput
                placeholder="Ex: 1000000"
                type="number"
                onChange={(e) => {
                  setSupply(parseInt(e.target.value));
                }}
                value={supply}
              />
            </div>
            <div className="flex flex-col text-slate-200 gap-2 w-full">
              <div className="text-sm sm:text-base">Description:</div>
              <textarea
                placeholder="Description"
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                className="w-full h-[80px] sm:h-[100px] bg-slate-700 text-slate-200 rounded-lg p-2 sm:p-3 border border-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm sm:text-base resize-none"
                value={description}
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 bg-slate-700 shadow-lg rounded-2xl mt-4 sm:mt-6 md:mt-10 border border-slate-600 w-full max-w-md">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading || !connection || !wallet.publicKey}
              className="w-full px-3 py-2 border border-slate-600 rounded-md text-xs sm:text-sm text-slate-200 bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            />
            {imageUri !== "" ? (
              <div className="text-emerald-400 text-xs sm:text-sm text-center">
                ✓ Image uploaded to IPFS
              </div>
            ) : null}
          </div>
          {!wallet.publicKey ? (
            <p className="text-red-500 text-sm sm:text-base text-center">
              *Connect to the Wallet
            </p>
          ) : null}
          {imageData ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 overflow-hidden rounded-lg">
              {imageData && (
                <Image
                  src={imageData}
                  alt="image preview"
                  className="object-cover w-full h-full shadow-md"
                  width={100}
                  height={100}
                />
              )}
            </div>
          ) : null}
          <div className="w-full max-w-xs">
            <button
              className={`w-full px-4 py-2.5 sm:py-3 rounded-lg transition text-white text-sm sm:text-base font-medium ${
                isUploading || !imageUri
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg"
              }`}
              onClick={MintCreation}
              disabled={isUploading || !imageUri}
            >
              {isUploading ? "Processing..." : "Create Token"}
            </button>
          </div>
          <div className="text-slate-200 text-center w-full max-w-2xl break-words px-2 sm:px-4 text-sm sm:text-base">
            {message}
          </div>
          {metaDataUri && (
            <div className="text-blue-400 text-xs sm:text-sm text-center">
              <a
                href={metaDataUri}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all hover:text-blue-300 transition-colors"
              >
                View Metadata on IPFS
              </a>
            </div>
          )}{" "}
        </div>
      )}
    </div>
  );
}
