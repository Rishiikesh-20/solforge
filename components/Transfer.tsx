"use client";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getTokenwithMetaData, TokenDetails } from "./getTokensWithMetadata";
import Image from "next/image";
import { SearchInput } from "./ui/search";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getExplorerLink } from "gill";
import { useState } from "react";
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
      setLoading(false)
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

  function closeSuccessModal(){
    setMessage("")
    setAmount(0)
    setReceiverAddress("")
    setSelectedToken(null)
    setTokens([])
    setSignature("")
    setSuccess(false)
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {Loading ? (
        <div className="flex flex-col justify-center items-center h-screen bg-slate-900 w-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400"></div>
          <span className="mt-4 text-lg text-blue-400">Loading...</span>
        </div>
      ) : popup ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex text-4xl items-center justify-center p-4">
          <div className="relative bg-slate-800 rounded-xl shadow-xl p-4 sm:p-8 w-full max-w-[400px] border border-slate-600">
            <button
              className="absolute top-3 left-3 text-slate-400 hover:text-slate-200 text-2xl font-bold focus:outline-none"
              onClick={() => setPopup(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-center text-slate-200">
              Select any one of your Token
            </h2>
            {tokens.length == 0 ? (
              <p className="text-slate-400">No tokens</p>
            ) : (
              <ul className="flex flex-col gap-4 sm:gap-6 max-w-full w-full overflow-y-auto h-[250px] p-2 sm:p-4 whitespace-nowrap">
                {tokens.map((token) => (
                  <li
                    key={token.mint}
                    className="flex items-center gap-2 sm:gap-4 border rounded-xl border-slate-600 p-2 sm:p-4 bg-slate-700 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
                    onClick={() => handleClick(token)}
                  >
                    <Image
                      src={
                        token.image !== "Unknown" ? token.image : "/final.png"
                      }
                      alt={"/final.png"}
                      width={60}
                      height={60}
                      className="w-12 h-12 sm:w-20 sm:h-20 rounded-md object-cover border border-slate-600"
                    />
                    <div className="flex flex-col justify-center">
                      <div className="text-base sm:text-lg text-slate-200 font-semibold">
                        {token.name}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400">
                        {token.amount} {token.symbol}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-[95%] sm:w-[85%] md:w-[70%] min-h-[600px] bg-slate-800 rounded-lg p-4 sm:p-6 items-center justify-between  gap-4 sm:gap-6 border border-slate-600">
          {success && selectedToken && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-[90%] border border-slate-600 shadow-2xl">
                <button
                  onClick={closeSuccessModal}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
                >
                  <svg
                    className="w-6 h-6"
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

                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-400"
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

                <h3 className="text-2xl font-bold text-center text-white mb-4">
                  Token transfered successfully
                </h3>

                <div className="bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-600">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-500">
                      <Image
                        src={selectedToken?.image || "/final.png"}
                        alt="Token Image"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-white mb-1">
                        {selectedToken?.name}
                      </div>
                      <div className="text-sm text-slate-300 mb-1">
                        Symbol: {selectedToken?.symbol}
                      </div>
                      <div className="text-sm text-slate-400">
                        Amount: {selectedToken?.amount - amount} <span className="text-red-500">-{amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {signature && (
                  <div className="text-center mb-6">
                    <a
                      href={getExplorerLink({
                        transaction: signature,
                        cluster: connection.rpcEndpoint.includes("devnet")
                          ? "devnet"
                          : "mainnet",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          <div className="p-2 h-full">
            <button
              onClick={handleToken}
              disabled={!publicKey || Loading}
              className={`font-bold text-[16px] sm:text-[20px] p-2 rounded-lg transition duration-300 
                                    ${
                                      !publicKey || Loading
                                        ? "bg-slate-600 text-slate-400 cursor-not-allowed opacity-60"
                                        : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-lg"
                                    }`}
            >
              {Loading
                ? "Loading..."
                : publicKey
                  ? "Select your token"
                  : "Connect to the Account"}
            </button>
          </div>
          <div className="flex flex-wrap w-full gap-4 sm:gap-9 text-slate-200 h-full">
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
                <p className="text-red-400 text-sm">
                  Amount exceeds your balance.
                </p>
              )}
            </div>
          </div>
          {selectedToken ? (
            <div className="flex w-full sm:w-[300px] h-[80px] sm:h-[100px] overflow-hidden rounded-xl border border-slate-600 bg-slate-700 shadow-sm hover:shadow-lg transition-all cursor-pointer">
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
                <div className="text-base sm:text-lg text-slate-200 font-semibold">
                  Name: {selectedToken.name}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">
                  Balance: {selectedToken.amount} {selectedToken.symbol}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-center w-full">
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
                                ? "bg-slate-600 cursor-not-allowed opacity-60"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 cursor-pointer hover:opacity-90"
                            }`}
            >
              {Loading
                ? "Loading..."
                : !publicKey
                  ? "Connect to the account"
                  : selectedToken === null
                    ? "Select the token"
                    : receiverAddress === "" || amount >= selectedToken.amount
                      ? "Fill all the Details"
                      : "Transfer tokens"}
            </button>
          </div>
          <div className="text-slate-200 text-center w-full max-w-[600px] break-words px-4">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
