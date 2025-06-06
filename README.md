<h1 align="center">
  <img src="https://github.com/user-attachments/assets/4b2fc456-eb78-40d9-afb7-eb3f1e5eee6d" alt="final" width="150"/>
  <br/>
  SolForge
</h1>

A **Next.js** web application that allows users to:

- ✅ Create custom SPL (non-native) tokens on the **Solana blockchain**
- 🔁 Transfer those tokens between any connected Solana wallets

> 🦄 You need a Solana wallet (like Phantom) connected to interact with the app.

---

## 🚀 Features

- 🔨 Create your own custom token with metadata
- ☁️ Upload token metadata to [Pinata](https://pinata.cloud/) (IPFS)
- 🔍 View all tokens with fetched metadata
- 📤 Transfer any non-native SPL tokens between Solana wallets
- 🔗 View your transactions on the Solana Explorer

---

## 🛠 Tech Stack

- **Next.js** (App Router)
- **Solana Web3.js**
- **@solana/spl-token**
- **@metaplex-foundation/mpl-token-metadata**
- **@solana/wallet-adapter-react**
- **Pinata SDK** for uploading to IPFS

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```env
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret
