import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletConnectButton, shortenAddress, useWalletIdentity } from "@/components/wallet-provider";
import { getWalletProfile, saveWalletProfile } from "@/lib/server-actions";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Wallet profile | walletbattles.fun" },
      { name: "description", content: "Manage your wallet battle profile and display name." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const { auth, signedIn } = useWalletIdentity();
  const getProfileFn = useServerFn(getWalletProfile);
  const saveProfileFn = useServerFn(saveWalletProfile);
  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [profileStats, setProfileStats] = useState({ elo: 1000, rating: null as number | null, wins: 0 });
  const [wiped, setWiped] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!signedIn || !auth) return;
    let active = true;

    void getProfileFn({ data: { auth } }).then((result) => {
      if (!active || !result.ok || !result.profile) return;
      setDisplayName(result.profile.displayName);
      setSavedName(result.profile.displayName);
      setProfileStats({
        elo: result.profile.elo,
        rating: result.profile.rating,
        wins: result.profile.wins,
      });
    });

    return () => {
      active = false;
    };
  }, [auth, getProfileFn, signedIn]);

  if (!connected || !publicKey || !signedIn || wiped) {
    return (
      <div className="utility-page profile-page">
        <section className="empty-state">
          <p className="eyebrow">Wallet profile</p>
          <h1>{wiped ? "Your profile is wiped." : "Connect to see your profile."}</h1>
          <p>{wiped ? "Reconnect and sign a new message to start fresh." : "Only wallets that play are visible on walletbattles.fun."}</p>
          {!wiped ? <WalletConnectButton /> : null}
        </section>
      </div>
    );
  }

  const saveName = async () => {
    if (!auth) {
      setNotice("Sign in with Phantom before saving your name.");
      return;
    }

    const result = await saveProfileFn({
      data: { auth, displayName: displayName.trim() },
    });
    setNotice(result.message);
    if (result.ok) setSavedName(displayName.trim());
  };

  const wipeProfile = () => {
    if (!window.confirm("Wipe this wallet's profile, ELO, rating, and battle history?")) return;
    setWiped(true);
    setNotice("");
  };

  return (
    <div className="utility-page profile-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Wallet profile</p>
          <h1 className="page-title">Your battle card.</h1>
          <p className="page-lede">Your profile only appears after you enter the ranked queue.</p>
        </div>
      </section>

      <section className="panel panel-pad profile-card">
        <div className="profile-hero">
          <div className="profile-avatar">{publicKey.toBase58().slice(0, 2)}</div>
          <div>
            <h2>{savedName || "Unnamed wallet"}</h2>
            <p>{shortenAddress(publicKey.toBase58())}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat"><span className="muted">Monthly ELO</span><strong>{profileStats.elo}</strong></div>
          <div className="profile-stat"><span className="muted">Battle rating</span><strong>{profileStats.rating ?? "—"}</strong></div>
          <div className="profile-stat"><span className="muted">Ranked wins</span><strong>{profileStats.wins}</strong></div>
        </div>

        <div className="profile-form">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            value={displayName}
            maxLength={24}
            pattern="[A-Za-z0-9 ]+"
            placeholder="Letters, numbers, spaces"
            onChange={(event) => setDisplayName(event.target.value.replace(/[^A-Za-z0-9 ]/g, ""))}
          />
          <div className="form-actions">
            <span className="microcopy">Your shortened wallet address stays attached to the profile.</span>
            <button className="primary-button" type="button" onClick={() => void saveName()}>Save name</button>
          </div>
          {notice ? <p className="positive microcopy">{notice}</p> : null}
        </div>

        <div className="form-actions">
          <span className="microcopy">Wiping removes your public profile and battle record.</span>
          <button className="danger-button" type="button" onClick={wipeProfile}>Wipe data</button>
        </div>
      </section>
    </div>
  );
}
