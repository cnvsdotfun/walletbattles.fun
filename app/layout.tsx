import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "walletbattles.fun — Mog the market",
  description: "Ten-second Solana wallet battles. Climb the monthly ELO leaderboard.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
