import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CoinAddress } from "@/lib/coin";
import { WalletConnectButton } from "./wallet-provider";

const navigation = [
  { to: "/", label: "Battle" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/profile", label: "Profile" },
  { to: "/rules", label: "Rules" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="site-frame">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="walletbattles.fun home">
          <span>
            <strong>walletbattles</strong>
            <span className="brand-domain">.fun</span>
          </span>
        </Link>
        <nav className="top-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.to}
              className={`top-nav-link ${location.pathname === item.to ? "active" : ""}`}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-wallet">
          <WalletConnectButton />
        </div>
      </header>

      <main className="page-content">{children}</main>

      <footer className="site-footer">
        <span>Trade sharp. Mog clean.</span>
        <CoinAddress className="footer-coin" />
      </footer>
    </div>
  );
}
