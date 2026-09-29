import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CoinAddress } from "@/lib/coin";
import { joinRankedQueue, leaveRankedQueue } from "@/lib/server-actions";
import {
  shortenAddress,
  useWalletIdentity,
} from "@/components/wallet-provider";
import { useWallet } from "@solana/wallet-adapter-react";

export const Route = createFileRoute("/")({
  component: BattlePage,
});

type BattlePhase = "idle" | "queue";

function BattlePage() {
  const { connected, publicKey } = useWallet();
  const { auth, signedIn, signIn } = useWalletIdentity();
  const joinQueueFn = useServerFn(joinRankedQueue);
  const leaveQueueFn = useServerFn(leaveRankedQueue);
  const [phase, setPhase] = useState<BattlePhase>("idle");
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [notice, setNotice] = useState("");

  const playerAddress = shortenAddress(publicKey?.toBase58());

  useEffect(() => {
    if (phase !== "queue") return;
    const interval = window.setInterval(() => {
      setQueueSeconds((seconds) => Math.min(seconds + 1, 300));
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [phase]);

  const queueBattle = async () => {
    setNotice("");
    if (!connected) {
      setNotice("Connect a wallet before you queue.");
      return;
    }
    let walletAuth = auth;
    if (!signedIn || !walletAuth) {
      walletAuth = await signIn();
      if (!walletAuth) {
        setNotice("Sign the wallet message before you queue.");
        return;
      }
    }

    const result = await joinQueueFn({ data: { auth: walletAuth } });
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setQueueSeconds(0);
    setPhase("queue");
  };

  const resetBattle = () => {
    setNotice("");
    setPhase("idle");
    if (auth) void leaveQueueFn({ data: { auth } });
  };

  const battleStatus = {
    idle: "Ready to mog",
    queue: "Finding a close ELO match",
  }[phase];

  return (
    <div className="battle-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Ranked wallet battles</p>
          <h1 className="page-title">Mog the market.</h1>
          <p className="page-lede">
            Two wallets. Ten seconds. One rating. Your monthly ELO is the only scoreboard that matters.
          </p>
        </div>
      </section>

      <div className="battle-layout">
        <section className="panel battle-panel" aria-live="polite">
          <div className="battle-panel-header">
            <h2 className="panel-title">Ranked match</h2>
            <span className="panel-meta">{battleStatus}</span>
          </div>

          <div className="battle-content">
            <>
              <div className="battle-players">
                <PlayerCard
                  label="You"
                  name={signedIn ? "Your wallet" : "Connect to play"}
                  address={signedIn ? playerAddress : "Wallet not connected"}
                  elo={1000}
                  rating="—"
                  you
                />
                <div className="vs-mark" aria-label="versus">VS</div>
                <PlayerCard
                  label="Opponent"
                  name={phase === "queue" ? "Searching" : "Waiting for a wallet"}
                  address="No opponent matched"
                  elo={phase === "queue" ? "—" : "—"}
                  rating="—"
                />
              </div>
              <div className="battle-action">
                {phase === "queue" ? (
                  <>
                    <span className="state-label">Queue time {queueSeconds}s</span>
                    <p>Close ELO first. The search expands every 15 seconds.</p>
                    <button className="secondary-button" type="button" onClick={resetBattle}>Cancel queue</button>
                  </>
                ) : (
                  <>
                    <p>Ranked battles use your past 30 days of trading performance. No trade. No transaction.</p>
                    <button className="primary-button" type="button" onClick={() => void queueBattle()}>
                      Enter ranked queue
                    </button>
                  </>
                )}
                {notice ? <p className="inline-notice">{notice}</p> : null}
              </div>
            </>
          </div>
        </section>

        <aside className="side-stack">
          <section className="panel panel-pad">
            <p className="section-label">How ranked works</p>
            <div className="queue-rule"><span>Battle length</span><strong>10 seconds</strong></div>
            <div className="queue-rule"><span>Starting ELO</span><strong>1000</strong></div>
            <div className="queue-rule"><span>Season</span><strong>Calendar month</strong></div>
            <div className="queue-rule"><span>Rematch guard</span><strong>3 wallets first</strong></div>
          </section>

          <section className="panel panel-pad">
            <p className="section-label">The rating</p>
            <div className="queue-rule"><span>Profit</span><strong className="positive">Strongest weight</strong></div>
            <div className="queue-rule"><span>Win rate</span><strong>Closed trades</strong></div>
            <div className="queue-rule"><span>Risk</span><strong>Drawdown</strong></div>
            <p className="microcopy">The score stays between 1 and 100. Low activity gets a low score, not a queue ban.</p>
          </section>

          <section className="coin-panel">
            <p>Built around the wallet battles. The coin stays behind the brand.</p>
            <CoinAddress />
          </section>
        </aside>
      </div>
    </div>
  );
}

function PlayerCard({
  label,
  name,
  address,
  elo,
  rating,
  you = false,
}: {
  label: string;
  name: string;
  address: string;
  elo: number | string;
  rating: number | string;
  you?: boolean;
}) {
  return (
    <div className={`player-card ${you ? "you" : ""}`}>
      <p className="section-label">{label}</p>
      <h2 className="player-name">{name}</h2>
      <p className="player-address">{address}</p>
      <div className="player-stats">
        <span><span className="muted">ELO</span><strong className="player-stat-value">{elo}</strong></span>
        <span><span className="muted">Rating</span><strong className="player-stat-value">{rating}</strong></span>
      </div>
    </div>
  );
}
