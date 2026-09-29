import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { WalletAuth } from "@/lib/server-actions";

const MAINNET_RPC_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");
const PHANTOM_NAME = "Phantom";

type WalletIdentityContextValue = {
  signedIn: boolean;
  auth: WalletAuth | null;
  signIn: () => Promise<WalletAuth | null>;
  signInError: string | null;
};

const WalletIdentityContext = createContext<WalletIdentityContextValue | null>(null);

export function WalletAppProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={MAINNET_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletIdentity>{children}</WalletIdentity>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function WalletIdentity({ children }: { children: ReactNode }) {
  const { connected, publicKey, signMessage } = useWallet();
  const [signedIn, setSignedIn] = useState(false);
  const [auth, setAuth] = useState<WalletAuth | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    setSignedIn(false);
    setAuth(null);
    setSignInError(null);
  }, [connected, publicKey]);

  const signIn = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) {
      setSignInError("Your wallet needs message signing enabled to play.");
      return null;
    }

    try {
      const messageText = [
        "walletbattles.fun sign in",
        "",
        `Wallet: ${publicKey.toBase58()}`,
        `Issued: ${new Date().toISOString()}`,
      ].join("\n");
      const message = new TextEncoder().encode(messageText);
      const signature = await signMessage(message);
      const nextAuth = {
        address: publicKey.toBase58(),
        message: messageText,
        signature: Array.from(signature),
      } satisfies WalletAuth;
      setSignedIn(true);
      setAuth(nextAuth);
      setSignInError(null);
      return nextAuth;
    } catch {
      setSignInError("Signature cancelled. Sign the message to enter ranked battles.");
      return null;
    }
  }, [connected, publicKey, signMessage]);

  return (
    <WalletIdentityContext.Provider value={{ signedIn, auth, signIn, signInError }}>
      {children}
    </WalletIdentityContext.Provider>
  );
}

export function useWalletIdentity() {
  const value = useContext(WalletIdentityContext);
  if (!value) {
    throw new Error("useWalletIdentity must be used inside WalletAppProvider");
  }
  return value;
}

export function shortenAddress(address: string | undefined) {
  if (!address) return "Not connected";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { connected, connecting, connect, disconnect, publicKey, select, wallets, wallet } =
    useWallet();
  const { signedIn, signIn, signInError } = useWalletIdentity();
  const [signing, setSigning] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingConnection || !wallet || connected || connecting) return;

    void connect()
      .catch(() => {
        setWalletError("Phantom could not connect. Unlock Phantom and try again.");
      })
      .finally(() => setPendingConnection(false));
  }, [connect, connected, connecting, pendingConnection, wallet]);

  const handleSignIn = async () => {
    setSigning(true);
    await signIn();
    setSigning(false);
  };

  const handleConnect = () => {
    setWalletError(null);
    const phantom = wallets.find(({ adapter }) => adapter.name === PHANTOM_NAME);

    if (!phantom) {
      setWalletError("Phantom is unavailable in this browser.");
      return;
    }

    if (!["Installed", "Loadable"].includes(String(phantom.readyState))) {
      setWalletError("Install the Phantom browser extension to connect.");
      return;
    }

    select(phantom.adapter.name);
    setPendingConnection(true);
  };

  if (connected && signedIn) {
    return (
      <div className="wallet-control">
        <span className="wallet-control-address">{shortenAddress(publicKey?.toBase58())}</span>
        <button className="text-button" type="button" onClick={() => void disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-control-wrap">
      <button
        className="primary-button header-button"
        type="button"
        onClick={() => (connected ? void handleSignIn() : handleConnect())}
        disabled={connecting || signing || pendingConnection}
      >
        {connecting || pendingConnection ? "Connecting" : signing ? "Signing" : connected ? "Sign to play" : "Connect Phantom"}
      </button>
      {signInError ? <span className="wallet-error">{signInError}</span> : null}
      {walletError ? <span className="wallet-error">{walletError}</span> : null}
    </div>
  );
}
