import type { ReactNode } from "react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { WalletAppProvider } from "@/components/wallet-provider";
import "@/styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "walletbattles.fun | Mog the market" },
      {
        name: "description",
        content: "Ten-second Solana wallet battles with monthly ELO rankings.",
      },
      { name: "theme-color", content: "#151515" },
    ],
    links: [
      { rel: "canonical", href: "https://walletbattles.fun/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <WalletAppProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </WalletAppProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
