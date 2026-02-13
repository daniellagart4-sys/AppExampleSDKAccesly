"use client";

import Link from "next/link";
import { ConnectButton, useAccesly } from "accesly";
import { useState } from "react";
import {
  TransactionBuilder,
  Networks,
  Operation,
  Account,
} from "@stellar/stellar-sdk";

export default function XdrTestPage() {
  const { wallet, signAndSubmit } = useAccesly();
  const stellarAddress = wallet?.stellarAddress;
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleSignAndSubmit() {
    try {
      setStatus("Building transaction...");
      setTxHash("");

      const res = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${stellarAddress}`
      );
      if (!res.ok) throw new Error("Could not fetch account from Horizon");
      const accountData = await res.json();

      const account = new Account(stellarAddress!, accountData.sequence);

      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.manageData({
            name: "test",
            value: "hello",
          })
        )
        .setTimeout(60)
        .build();

      setStatus("Signing and submitting with Accesly...");
      const { txHash } = await signAndSubmit(tx.toXDR());

      setTxHash(txHash);
      setStatus("Transaction confirmed on testnet");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus(`Error: ${message}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 py-16 px-8 bg-white dark:bg-black">
        <Link
          href="/"
          className="self-start text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
        >
          ← Back
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          XDR Signing Test
        </h1>

        <div className="text-sm text-zinc-600 dark:text-zinc-400 text-center space-y-2 max-w-md">
          <p>
            <strong className="text-purple-600 dark:text-purple-400">XDR Signing</strong> lets
            you sign any Stellar transaction with the user&apos;s Accesly custodial wallet.
          </p>
          <p>
            Use cases: DEX, DeFi, NFT marketplaces, Soroban contracts, crowdfunding, on-chain games, and any Stellar dApp.
          </p>
          <p className="text-zinc-400 dark:text-zinc-500">
            This test writes a data entry (&quot;test&quot; = &quot;hello&quot;) to your account to verify the flow works.
          </p>
        </div>

        <ConnectButton />

        {stellarAddress && (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <p className="text-sm text-zinc-500 break-all text-center">
              Account: {stellarAddress}
            </p>

            <button
              onClick={handleSignAndSubmit}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Sign & Submit manageData(&quot;test&quot;, &quot;hello&quot;)
            </button>

            {status && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300 text-center break-all">
                {status}
              </p>
            )}

            {txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View on Stellar Expert →
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
