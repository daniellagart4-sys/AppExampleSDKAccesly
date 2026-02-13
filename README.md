# Accesly SDK - Next.js Integration

A Next.js application demonstrating how to integrate [Accesly](https://accesly.vercel.app) custodial wallets into a Stellar dApp, including basic wallet connection and XDR transaction signing.

## Prerequisites

- Node.js 18+
- An Accesly App ID (get one from the [Accesly Dashboard](https://accesly.vercel.app/developers))

## Installation

```bash
npm install accesly
```

For XDR Signing, you also need the Stellar SDK:

```bash
npm install @stellar/stellar-sdk
```

## Environment Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_ACCESLY_APP_ID=your_app_id_here
```

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Basic Usage

### 1. Wrap your app with `AcceslyProvider`

```tsx
// app/providers.tsx
"use client";

import { AcceslyProvider } from "accesly";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AcceslyProvider appId={process.env.NEXT_PUBLIC_ACCESLY_APP_ID!}>
      {children}
    </AcceslyProvider>
  );
}
```

```tsx
// app/layout.tsx
import Providers from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 2. Add the `ConnectButton`

```tsx
"use client";

import { ConnectButton } from "accesly";

export default function Home() {
  return <ConnectButton />;
}
```

This renders a drop-in button that handles the full connection flow: authentication, wallet creation, and displays the address and balance once connected.

### 3. Access wallet state with `useAccesly`

```tsx
const { wallet, balance, loading, sendPayment, disconnect } = useAccesly();

// Wallet info
wallet?.stellarAddress; // Stellar public address
wallet?.email;          // User email

// Send a payment
const { txHash } = await sendPayment({
  destination: "GABC...XYZ",
  amount: "10",
  memo: "Payment for services",
});
```

### Provider Options

| Option         | Type                          | Default                          | Description                      |
| -------------- | ----------------------------- | -------------------------------- | -------------------------------- |
| `appId`        | `string`                      | **required**                     | Your Accesly API key (`acc_...`) |
| `network`      | `'testnet'` \| `'mainnet'`    | `'testnet'`                      | Stellar network to use           |
| `theme`        | `'dark'` \| `'light'`         | `'dark'`                         | UI theme for components          |
| `onConnect`    | `(wallet: WalletInfo) => void`| —                                | Callback on wallet connect       |
| `onDisconnect` | `() => void`                  | —                                | Callback on wallet disconnect    |

---

## XDR Signing

XDR Signing lets you sign **any** Stellar transaction using the user's Accesly custodial key. This is the bridge between Accesly wallets and the entire Stellar/Soroban ecosystem.

**Use cases:** DEX trading, DeFi protocols, NFT marketplaces, Soroban smart contracts, crowdfunding platforms, on-chain games, and any custom Stellar dApp.

### Sign only (you submit)

Build your transaction with the Stellar SDK, sign it through Accesly, and submit it yourself via Horizon or Soroban RPC:

```tsx
const { wallet, signTransaction } = useAccesly();

const { signedXdr } = await signTransaction(unsignedXdr);

// Submit manually via Horizon, Soroban RPC, etc.
```

### Sign + Submit

Let Accesly handle both signing and submission:

```tsx
const { wallet, signAndSubmit } = useAccesly();

const { signedXdr, txHash } = await signAndSubmit(unsignedXdr);
console.log("Confirmed:", txHash);
```

### Full Example — manageData

```tsx
import { TransactionBuilder, Networks, Operation, Account } from "@stellar/stellar-sdk";
import { useAccesly } from "accesly";

function MyComponent() {
  const { wallet, signAndSubmit } = useAccesly();

  async function writeDataEntry() {
    const stellarAddress = wallet?.stellarAddress;

    // Fetch account from Horizon
    const res = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${stellarAddress}`
    );
    const accountData = await res.json();
    const account = new Account(stellarAddress!, accountData.sequence);

    // Build the transaction
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.manageData({ name: "test", value: "hello" }))
      .setTimeout(60)
      .build();

    // Sign and submit via Accesly
    const { txHash } = await signAndSubmit(tx.toXDR());
    console.log("Confirmed:", txHash);
  }
}
```

### Important Notes

- The transaction **source account** must be the user's `stellarAddress`.
- **Blocked operations:** `accountMerge`, `setOptions` that modify `masterWeight` / `signers` / `thresholds`.
- `FeeBumpTransaction` is **not supported**.

---

## Project Structure

```
app/
├── layout.tsx        # Root layout with Providers
├── providers.tsx     # AcceslyProvider wrapper
├── page.tsx          # Home — wallet connection
└── xdr-test/
    └── page.tsx      # XDR Signing test page
```

## License

MIT
