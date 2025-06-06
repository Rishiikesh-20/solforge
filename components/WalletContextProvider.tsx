"use client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { ReactNode, useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";
export function WalletContextProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [], []);
  const endpoint = clusterApiUrl("devnet");
  return (
    <WalletProvider wallets={wallets}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </ConnectionProvider>
    </WalletProvider>
  );
}
