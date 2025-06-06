"use client";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getTokenwithMetaData, TokenDetails } from "./getTokensWithMetadata";
import { useEffect, useState } from "react";
import Image from "next/image";
import { SearchInput } from "./ui/search";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getExplorerLink } from "gill";
export function Transfer() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenDetails[]>([]);
  const [message, setMessage] = useState("");
  const [popup, setPopup] = useState(false);
  const [success, setSuccess] = useState(false);
  const [Loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenDetails | null>(null);
  const [signature, setSignature] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const cluster = connection.rpcEndpoint.includes("devnet")
    ? "devnet"
    : "mainnet";

  useEffect(() => {
    document.body.style.overflow = popup || success ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [popup, success]);

  async function handleToken() {
    if (!publicKey) {
      console.error("Account is not connected");
      return;
    }
    try {
      setLoading(true);
      if (tokens.length == 0) {
        const result = await getTokenwithMetaData(publicKey, connection);
        setTokens(result);
        console.log("In Transfer: Tokens : ", result);
      }
      setLoading(false);
      setPopup(true);
    } catch (e) {
      setMessage("Unexpected error while getting Token Details");
      console.log("Error while getting Token Details : " + e);
    }
  }

  async function handleClick(token: TokenDetails) {
    setSelectedToken(token);
    setPopup(false);
  }

  async function handleTransfer() {
    try {
      setLoading(true);
      if (selectedToken?.mint === undefined) {
        throw new Error("Mint address undefined");
      }
      if (!publicKey) {
        throw new Error("Account is not connected");
      }

      let receiverPubKey: PublicKey;
      try {
        receiverPubKey = new PublicKey(receiverAddress);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setMessage("Receiver address is not a valid Solana public key.");
        setLoading(false);
        return;
      }

      const transaction = new Transaction();

      const senderATA = getAssociatedTokenAddressSync(
        new PublicKey(selectedToken.mint),
        publicKey
      );

      const receiverATA = getAssociatedTokenAddressSync(
        new PublicKey(selectedToken.mint),
        receiverPubKey
      );

      const receiverAccountInfo = await connection.getAccountInfo(receiverATA);

      if (!receiverAccountInfo) {
        const ins1 = createAssociatedTokenAccountInstruction(
          publicKey,
          receiverATA,
          receiverPubKey,
          new PublicKey(selectedToken.mint)
        );
        transaction.add(ins1);
      }

      const [whole, fraction = ""] = amount.toString().split(".");
      const decimals = selectedToken.decimals;

      const normalizedFraction = fraction
        .padEnd(decimals, "0")
        .slice(0, decimals);
      const fullAmountStr = (whole || "0") + normalizedFraction;

      const amount1 = BigInt(fullAmountStr);

      const ins = createTransferInstruction(
        senderATA,
        receiverATA,
        publicKey,
        amount1
      );

      transaction.add(ins);

      const signature = await sendTransaction(transaction, connection);
      setSignature(signature);
      console.log("signature : ", signature);
      setMessage("Successful , Signature: " + signature);
      setLoading(false);
      setSuccess(true);
    } catch (e) {
      if (e instanceof Error) {
        setMessage(e.message);
        setLoading(false);
        return;
      }

      console.log("Error while transfering tokens : ", e);
      setMessage("Error while Transfering tokens");
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {Loading ? (
        <div className="flex flex-col justify-center items-center h-screen bg-neutral-900 w-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
          <span className="mt-4 text-lg text-cyan-400">Loading...</span>
        </div>
      ) : popup ? (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex text-4xl items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl p-4 sm:p-8 w-full max-w-[400px]">
            <button
              className="absolute top-3 left-3 text-gray-500 hover:text-black text-2xl font-bold focus:outline-none"
              onClick={() => setPopup(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">
              Select any one of your Token
            </h2>
            {tokens.length == 0 ? (
              <p>No tokens</p>
            ) : (
              <ul className="flex flex-col gap-4 sm:gap-6 max-w-full w-full overflow-y-auto h-[250px] p-2 sm:p-4 whitespace-nowrap">
                {tokens.map((token) => (
                  <li
                    key={token.mint}
                    className="flex items-center gap-2 sm:gap-4 border rounded-xl border-gray-300 p-2 sm:p-4 bg-white shadow-sm hover:shadow-lg hover:border-gray-700 transition-all cursor-pointer"
                    onClick={() => handleClick(token)}
                  >
                    <Image
                      src={
                        token.image !== "Unknown" ? token.image : "/final.png"
                      }
                      alt={"/final.png"}
                      width={60}
                      height={60}
                      className="w-12 h-12 sm:w-20 sm:h-20 rounded-md object-cover border border-gray-200"
                    />
                    <div className="flex flex-col justify-center">
                      <div className="text-base sm:text-lg text-gray-800 font-semibold">
                        {token.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {token.amount} {token.symbol}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : success ? (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative flex flex-col w-full max-w-[500px] h-auto sm:h-[70%] bg-white rounded-lg p-4 items-center gap-4 sm:gap-6 justify-center">
            <button
              className="absolute top-3 left-3 text-gray-500 hover:text-black text-4xl font-bold focus:outline-none"
              onClick={() => setSuccess(false)}
            >
              &times;
            </button>
            <div className="font-bold text-green-500 text-lg sm:text-xl">
              Successfully Transferred {amount} {selectedToken?.symbol}
            </div>
            <div className="flex w-full sm:w-[300px] h-[80px] sm:h-[100px] overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer">
              <div className="w-[30%] h-full">
                <Image
                  src={
                    selectedToken?.image !== "Unknown"
                      ? selectedToken?.image
                      : "/final.png"
                  }
                  alt="Token Image"
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center items-center w-[70%] p-2">
                <div className="text-base sm:text-lg text-gray-800 font-semibold">
                  Name: {selectedToken?.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Balance: {(selectedToken?.amount || 0) - amount}{" "}
                  {selectedToken?.symbol}{" "}
                  <span className="text-red-500">-{amount}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:gap-6 items-center justify-center">
              <div>Links</div>
              <a
                className="text-blue-700"
                href={getExplorerLink({
                  transaction: signature,
                  cluster,
                })}
              >
                Transfer Signature
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-[95%] sm:w-[85%] md:w-[70%] min-h-[600px] bg-slate-700 rounded-lg p-4 sm:p-6 items-center gap-4 sm:gap-6">
          <div className="p-2 h-full">
            <button
              onClick={handleToken}
              disabled={!publicKey || Loading}
              className={`font-bold text-[16px] sm:text-[20px] p-2 rounded-lg transition duration-300 
                            ${
                              !publicKey || Loading
                                ? "bg-slate-400 text-gray-300 cursor-not-allowed opacity-60"
                                : "bg-slate-100 text-gray-700 hover:opacity-70 cursor-pointer"
                            }`}
            >
              {Loading
                ? "Loading..."
                : publicKey
                  ? "Select your token"
                  : "Connect to the Account"}
            </button>
          </div>
          <div className="flex flex-wrap w-full gap-4 sm:gap-9 text-slate-300 h-full">
            <div className="w-full  md:w-[48%]">
              <div className="font-bold text-[16px] sm:text-[20px]">
                Mint Address
              </div>
              <SearchInput
                readOnly
                value={selectedToken ? selectedToken.mint : "Select your token"}
              />
            </div>
            <div className="w-full md:w-[48%]">
              <div className="font-bold text-[16px] sm:text-[20px]">From </div>
              <SearchInput
                value={
                  publicKey
                    ? `${publicKey.toBase58()}`
                    : "Connect to the Account"
                }
                readOnly
              />
            </div>
            <div className="w-full md:w-[48%]">
              <div className="font-bold text-[16px] sm:text-[20px]">
                Receiver Public Key{" "}
              </div>
              <SearchInput
                onChange={(e) => setReceiverAddress(e.target.value)}
                value={receiverAddress}
              />
            </div>
            <div className="w-full md:w-[48%]">
              <div className="font-bold text-[16px] sm:text-[20px]">
                Amount{" "}
              </div>
              <SearchInput
                type="number"
                value={amount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (
                    !isNaN(value) &&
                    selectedToken &&
                    value > selectedToken.amount
                  )
                    return;
                  setAmount(value);
                }}
                max={selectedToken?.amount ?? 0}
              />
              {amount > (selectedToken?.amount || 0) && (
                <p className="text-red-500 text-sm">
                  Amount exceeds your balance.
                </p>
              )}
            </div>
          </div>
          {selectedToken ? (
            <div className="flex w-full sm:w-[300px] h-[80px] sm:h-[100px] overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer">
              <div className="w-[30%] h-full">
                <Image
                  src={
                    selectedToken.image !== "Unknown"
                      ? selectedToken.image
                      : "/final.png"
                  }
                  alt="Token Image"
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center items-center w-[70%] p-2">
                <div className="text-base sm:text-lg text-gray-800 font-semibold">
                  Name: {selectedToken.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Balance: {selectedToken.amount} {selectedToken.symbol}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-center w-full h-full">
            <button
              onClick={handleTransfer}
              disabled={
                selectedToken === null ||
                !publicKey ||
                Loading ||
                receiverAddress === "" ||
                amount === 0
              }
              className={`text-lg sm:text-2xl font-bold text-white px-4 py-2 rounded-xl shadow-lg text-center w-fit transition duration-300
                            ${
                              selectedToken === null ||
                              !publicKey ||
                              Loading ||
                              receiverAddress === "" ||
                              amount === 0
                                ? "bg-gray-400 cursor-not-allowed opacity-60"
                                : "bg-gradient-to-r from-cyan-500 to-green-500 cursor-pointer hover:opacity-90"
                            }`}
            >
              {Loading
                ? "Loading..."
                : !publicKey
                  ? "Connect to the account"
                  : selectedToken === null
                    ? "Select the token"
                    : receiverAddress === "" || amount <= selectedToken.amount
                      ? "Fill all the Details"
                      : "Transfer tokens"}
            </button>
          </div>
          <div className="text-slate-100 text-center w-full max-w-[600px] break-words px-4">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
