import { useState } from "react";

export const COIN_ADDRESS = import.meta.env.VITE_COIN_ADDRESS?.trim() || "";

export function CoinAddress({ className = "" }: { className?: string }) {
  if (!COIN_ADDRESS) return null;

  return <CopyAddress className={className} address={COIN_ADDRESS} />;
}

function CopyAddress({ address, className }: { address: string; className: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button className={`coin-address ${className} ${copied ? "copied" : ""}`} type="button" onClick={() => void copy()}>
      <span>{address}</span>
      <span className="copy-tooltip" role="status" aria-hidden={!copied}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
