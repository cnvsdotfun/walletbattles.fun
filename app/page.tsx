"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clipboard,
  Crown,
  Gauge,
  Menu,
  ShieldCheck,
  Swords,
  Timer,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type View = "battle" | "leaderboard" | "profile" | "rules";
type Phase = "idle" | "queue" | "countdown" | "reveal" | "result";

type Wallet = {
  address: string;
  displayName: string;
  rating: number;
  elo: number;
  wins: number;
};

const CONTRACT_ADDRESS = "";

const playerWallet: Wallet = {
  address: "4xM7Yx3C2uQ9sN8cP4rT1yA6bL2vR9dF6cE1kH7Q",
  displayName: "ghost",
  rating: 74,
  elo: 1136,
  wins: 12,
};

const opponentWallet: Wallet = {
  address: "9wK3pZ8vM1xQ7dR4sT6nB2aH5cF8yL3jN6gV4qP",
  displayName: "nightshift",
  rating: 68,
  elo: 1118,
  wins: 10,
};

const leaderboardRows = [
  { rank: 1, name: "Mantis", address: "8Fq…rK2", elo: 1288, rating: 89, wins: 34, change: "+74" },
  { rank: 2, name: "solace", address: "G7k…1Pw", elo: 1242, rating: 86, wins: 29, change: "+51" },
  { rank: 3, name: "Pouch", address: "3mN…x8A", elo: 1204, rating: 83, wins: 25, change: "+32" },
  { rank: 4, name: "cold wallet", address: "B2d…0Lq", elo: 1182, rating: 81, wins: 21, change: "+18" },
  { rank: 5, name: "Viper", address: "F9a…mQ4", elo: 1167, rating: 79, wins: 19, change: "+11" },
  { rank: 6, name: "ghost", address: "4xM…H7Q", elo: 1136, rating: 74, wins: 12, change: "+8", isYou: true },
];

const battleMessages = [
  "Locking the 30-day window",
  "Reading realized profit",
  "Marking open positions",
  "Counting profitable trades",
  "Checking drawdown",
  "Normalizing risk",
  "Scoring the wallets",
  "Settling the match",
];

const viewLabels: Record<View, string> = {
  battle: "Battle",
  leaderboard: "Leaderboard",
  profile: "My profile",
  rules: "How it works",
};

function shortAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function formatQueueTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard?.writeText(address);
    } finally {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="address-copy"
          onClick={copyAddress}
          aria-label={copied ? "Contract address copied" : "Copy contract address"}
        >
          <span>{shortAddress(address)}</span>
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? "Copied" : "Copy address"}</TooltipContent>
    </Tooltip>
  );
}

function WalletAvatar({ name, accent = "white" }: { name: string; accent?: "white" | "green" | "red" }) {
  return (
    <div className={`wallet-avatar accent-${accent}`} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function AppMark() {
  return (
    <div className="app-mark" aria-hidden="true">
      <Swords size={18} strokeWidth={2.4} />
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("battle");
  const [phase, setPhase] = useState<Phase>("idle");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [battleStep, setBattleStep] = useState(0);

  useEffect(() => {
    if (phase !== "queue") return;

    const interval = window.setInterval(() => {
      setQueueSeconds((current) => Math.min(current + 1, 300));
    }, 1000);
    const matchTimer = window.setTimeout(() => {
      setCountdown(3);
      setPhase("countdown");
    }, 2200);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(matchTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;

    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);
    const revealTimer = window.setTimeout(() => {
      setBattleStep(0);
      setPhase("reveal");
    }, 3000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(revealTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "reveal") return;

    const stepTimer = window.setInterval(() => {
      setBattleStep((current) => Math.min(current + 1, battleMessages.length));
    }, 1000);
    const resultTimer = window.setTimeout(() => {
      setBattleStep(battleMessages.length);
      setPhase("result");
    }, 10000);

    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(resultTimer);
    };
  }, [phase]);

  const searchRange = useMemo(() => {
    const band = 120 + Math.floor(queueSeconds / 20) * 80;
    return Math.min(band, 720);
  }, [queueSeconds]);

  function connectWallet() {
    setWallet(playerWallet);
    setMenuOpen(false);
  }

  function startQueue() {
    if (!wallet) {
      connectWallet();
      return;
    }
    setView("battle");
    setPhase("queue");
  }

  function leaveQueue() {
    setPhase("idle");
    setQueueSeconds(0);
  }

  function resetBattle() {
    setPhase("idle");
    setBattleStep(0);
    setCountdown(3);
  }

  function navigate(nextView: View) {
    setView(nextView);
    setMenuOpen(false);
  }

  return (
    <TooltipProvider>
      <div className="site-shell">
        <aside className="sidebar" aria-label="Primary navigation">
          <div className="brand-lockup">
            <AppMark />
            <div>
              <div className="brand-name">walletbattles<span>.fun</span></div>
              <div className="brand-caption">Mog the market</div>
            </div>
          </div>

          <div className="season-card">
            <div className="eyebrow">Current season</div>
            <div className="season-row">
              <span>September 2026</span>
              <span className="season-dot" aria-label="Season active" />
            </div>
            <div className="season-meta">
              <span>18 days left</span>
              <span>ELO resets monthly</span>
            </div>
          </div>

          <nav className="side-nav">
            <div className="nav-label">Play</div>
            <NavButton icon={<Swords size={17} />} label="Battle" active={view === "battle"} onClick={() => navigate("battle")} />
            <NavButton icon={<Trophy size={17} />} label="Leaderboard" active={view === "leaderboard"} onClick={() => navigate("leaderboard")} />
            <NavButton icon={<UserRound size={17} />} label="My profile" active={view === "profile"} onClick={() => navigate("profile")} />
            <div className="nav-label nav-label-spaced">Learn</div>
            <NavButton icon={<Zap size={17} />} label="How it works" active={view === "rules"} onClick={() => navigate("rules")} />
          </nav>

          <div className="sidebar-foot">
            <div className="network-row">
              <span className="network-pulse" />
              <span>Solana mainnet</span>
            </div>
            {CONTRACT_ADDRESS ? (
              <div className="contract-row">
                <span>Coin contract</span>
                <CopyAddress address={CONTRACT_ADDRESS} />
              </div>
            ) : null}
            <div className="sidebar-note">No trades. No noise. Just the score.</div>
          </div>
        </aside>

        <div className="site-main">
          <header className="topbar">
            <button type="button" className="mobile-brand" onClick={() => navigate("battle")}>
              <AppMark />
              <span>walletbattles<span>.fun</span></span>
            </button>
            <div className="topbar-context">
              <span className="context-mark" />
              <span>{viewLabels[view]}</span>
            </div>
            <div className="topbar-actions">
              <div className="desktop-season">September 2026 <span>•</span> 18 days left</div>
              {wallet ? (
                <button type="button" className="wallet-chip" onClick={() => navigate("profile")}>
                  <WalletAvatar name={wallet.displayName} accent="green" />
                  <span>{wallet.displayName}</span>
                  <span className="chip-elo">{wallet.elo}</span>
                </button>
              ) : (
                <button type="button" className="connect-button" onClick={connectWallet}>
                  <UserRound size={16} />
                  Connect wallet
                </button>
              )}
              <button
                type="button"
                className="mobile-menu-button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </header>

          {menuOpen ? (
            <div className="mobile-menu">
              {(["battle", "leaderboard", "profile", "rules"] as View[]).map((item) => (
                <button key={item} type="button" className={view === item ? "mobile-menu-active" : ""} onClick={() => navigate(item)}>
                  {viewLabels[item]}
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          ) : null}

          <main className="content-area">
            {view === "battle" ? (
              <BattleView
                wallet={wallet}
                phase={phase}
                queueSeconds={queueSeconds}
                countdown={countdown}
                battleStep={battleStep}
                searchRange={searchRange}
                onStartQueue={startQueue}
                onLeaveQueue={leaveQueue}
                onResetBattle={resetBattle}
                onConnect={connectWallet}
              />
            ) : null}
            {view === "leaderboard" ? <LeaderboardView wallet={wallet} onConnect={connectWallet} /> : null}
            {view === "profile" ? <ProfileView wallet={wallet} onConnect={connectWallet} /> : null}
            {view === "rules" ? <RulesView /> : null}
          </main>

          <footer className="site-footer">
            <span>walletbattles.fun</span>
            <span>Public wallets. Private pride.</span>
            {CONTRACT_ADDRESS ? <CopyAddress address={CONTRACT_ADDRESS} /> : null}
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`side-nav-button ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {active ? <span className="nav-active-mark" /> : null}
    </button>
  );
}

function BattleView({
  wallet,
  phase,
  queueSeconds,
  countdown,
  battleStep,
  searchRange,
  onStartQueue,
  onLeaveQueue,
  onResetBattle,
  onConnect,
}: {
  wallet: Wallet | null;
  phase: Phase;
  queueSeconds: number;
  countdown: number;
  battleStep: number;
  searchRange: number;
  onStartQueue: () => void;
  onLeaveQueue: () => void;
  onResetBattle: () => void;
  onConnect: () => void;
}) {
  const isBattle = phase === "countdown" || phase === "reveal" || phase === "result";
  const message = battleMessages[Math.min(Math.max(battleStep - 1, 0), battleMessages.length - 1)];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <div className="eyebrow accent-eyebrow">RANKED PLAY</div>
          <h1>Find someone to mog.</h1>
          <p>One wallet. One rival. Ten seconds to settle it.</p>
        </div>
        <div className="heading-stat">
          <span className="stat-icon"><Activity size={16} /></span>
          <div><strong>1,284</strong><span>players this month</span></div>
        </div>
      </section>

      <section className={`battle-card ${phase !== "idle" ? "battle-card-live" : ""}`} aria-live="polite">
        <div className="battle-card-topline">
          <div className="live-label"><span className={phase === "idle" ? "status-ring muted" : "status-ring"} />{phase === "idle" ? "Queue is open" : phase === "queue" ? "Looking for a rival" : phase === "result" ? "Match settled" : "Battle in progress"}</div>
          <div className="battle-rule">30-day performance <span>•</span> monthly ELO</div>
        </div>

        {phase === "idle" ? <IdleBattle wallet={wallet} onStartQueue={onStartQueue} onConnect={onConnect} /> : null}
        {phase === "queue" ? <QueueState wallet={wallet} queueSeconds={queueSeconds} searchRange={searchRange} onLeaveQueue={onLeaveQueue} /> : null}
        {phase === "countdown" ? <BattleCountdown wallet={wallet} countdown={countdown} /> : null}
        {phase === "reveal" ? <BattleReveal wallet={wallet} step={battleStep} message={message} /> : null}
        {phase === "result" ? <BattleResult wallet={wallet} onResetBattle={onResetBattle} /> : null}
      </section>

      {!isBattle && phase !== "queue" ? <section className="below-grid"><MiniLeaderboard /><SeasonCard /></section> : null}
    </div>
  );
}

function IdleBattle({ wallet, onStartQueue, onConnect }: { wallet: Wallet | null; onStartQueue: () => void; onConnect: () => void }) {
  return (
    <div className="idle-battle">
      <div className="battle-emblem"><Swords size={30} /></div>
      <div className="idle-copy">
        <h2>{wallet ? "You are cleared to queue." : "Your next rival is waiting."}</h2>
        <p>{wallet ? "Your wallet is ready. The queue starts close, then opens up with time." : "Connect a wallet to enter ranked play. No transaction. Just a signed login."}</p>
      </div>
      <button type="button" className="primary-cta" onClick={wallet ? onStartQueue : onConnect}>{wallet ? "Enter the queue" : "Connect to play"}<ArrowUpRight size={17} /></button>
      <div className="battle-footnote"><span><ShieldCheck size={14} /> Ranked matches use a snapshot</span><span><Timer size={14} /> 5 min max queue wait</span></div>
    </div>
  );
}

function QueueState({ wallet, queueSeconds, searchRange, onLeaveQueue }: { wallet: Wallet | null; queueSeconds: number; searchRange: number; onLeaveQueue: () => void }) {
  const rangeLabel = `±${searchRange} ELO`;
  return (
    <div className="queue-state">
      <div className="queue-orbit"><span /><span /><span /></div>
      <div className="queue-copy"><div className="eyebrow accent-eyebrow">SEARCHING</div><h2>Finding a worthy rival.</h2><p>Starting close at {rangeLabel}. We widen the search as you wait.</p></div>
      <div className="queue-stats"><div><span>YOUR ELO</span><strong>{wallet?.elo ?? 1000}</strong></div><div><span>SEARCH RANGE</span><strong>{rangeLabel}</strong></div><div><span>WAITING</span><strong>{formatQueueTime(queueSeconds)}</strong></div></div>
      <div className="queue-progress"><span style={{ width: `${Math.min((queueSeconds / 300) * 100, 100)}%` }} /></div>
      <button type="button" className="text-button" onClick={onLeaveQueue}>Leave queue</button>
    </div>
  );
}

function BattleCountdown({ wallet, countdown }: { wallet: Wallet | null; countdown: number }) {
  return <div className="battle-stage"><BattlePlayers wallet={wallet} /><div className="countdown-center"><span className="eyebrow accent-eyebrow">RIVAL FOUND</span><div className="countdown-number" key={countdown}>{countdown}</div><p>Locking the match.</p></div></div>;
}

function BattleReveal({ wallet, step, message }: { wallet: Wallet | null; step: number; message: string }) {
  const progress = Math.min((step / battleMessages.length) * 100, 100);
  return <div className="battle-stage"><BattlePlayers wallet={wallet} /><div className="reveal-panel"><div className="reveal-topline"><span>CALCULATING</span><span>{Math.min(step + 1, battleMessages.length)} / {battleMessages.length}</span></div><div className="reveal-track"><span style={{ width: `${progress}%` }} /></div><div className="reveal-message"><span className="message-dot" />{message}</div><p>Both wallets are scored from the same snapshot.</p></div></div>;
}

function BattleResult({ wallet, onResetBattle }: { wallet: Wallet | null; onResetBattle: () => void }) {
  return <div className="result-state"><div className="result-banner"><Crown size={16} /> YOU WON THE ROUND</div><div className="result-players"><ResultPlayer wallet={wallet ?? playerWallet} rating={74} winner /><div className="result-versus">VS</div><ResultPlayer wallet={opponentWallet} rating={68} /></div><div className="elo-change"><span>ELO CHANGE</span><strong>+18</strong><small>1,154 total</small></div><div className="result-actions"><button type="button" className="primary-cta" onClick={onResetBattle}>Queue again <ArrowUpRight size={17} /></button><span>Three different rivals before a rematch.</span></div></div>;
}

function BattlePlayers({ wallet }: { wallet: Wallet | null }) {
  return <div className="battle-players"><BattlePlayer wallet={wallet ?? playerWallet} side="you" /><div className="vs-mark">VS</div><BattlePlayer wallet={opponentWallet} side="rival" /></div>;
}

function BattlePlayer({ wallet, side }: { wallet: Wallet; side: "you" | "rival" }) {
  return <div className={`battle-player ${side === "you" ? "player-you" : ""}`}><WalletAvatar name={wallet.displayName} accent={side === "you" ? "green" : "red"} /><div><strong>{wallet.displayName}</strong><span>{shortAddress(wallet.address)}</span></div><small>{side === "you" ? "YOU" : "RIVAL"}</small></div>;
}

function ResultPlayer({ wallet, rating, winner = false }: { wallet: Wallet; rating: number; winner?: boolean }) {
  return <div className={`result-player ${winner ? "winner" : ""}`}><WalletAvatar name={wallet.displayName} accent={winner ? "green" : "red"} /><span>{wallet.displayName}</span><strong>{rating}</strong><small>{winner ? "WINNER" : "RIVAL"}</small></div>;
}

function MiniLeaderboard() {
  return <div className="sub-card leaderboard-preview"><div className="sub-card-heading"><div><span className="eyebrow">LEADERBOARD</span><h3>Top this month</h3></div><Trophy size={18} /></div><div className="mini-rows">{leaderboardRows.slice(0, 4).map((row) => <div className="mini-row" key={row.rank}><span className="mini-rank">0{row.rank}</span><WalletAvatar name={row.name} accent={row.rank === 1 ? "green" : "white"} /><span className="mini-name">{row.name}</span><strong>{row.elo}</strong></div>)}</div><div className="sub-card-link">Open full leaderboard <ArrowUpRight size={14} /></div></div>;
}

function SeasonCard() {
  return <div className="sub-card season-summary"><div className="season-icon"><Gauge size={20} /></div><span className="eyebrow">SEASON HEALTH</span><h3>Every match counts.</h3><p>ELO resets at the start of each month. The archive keeps the receipts.</p><div className="season-bar"><span /></div><div className="season-bar-label"><span>September progress</span><strong>62%</strong></div></div>;
}

function LeaderboardView({ wallet, onConnect }: { wallet: Wallet | null; onConnect: () => void }) {
  return <div className="page-stack"><section className="page-heading leaderboard-heading"><div><div className="eyebrow accent-eyebrow">SEPTEMBER 2026</div><h1>Who is actually good?</h1><p>ELO is the only thing that moves the board. No vibes. No bag size.</p></div><div className="archive-pill"><Trophy size={16} /> 4 archived seasons</div></section><section className="leaderboard-card"><div className="leaderboard-toolbar"><div><strong>Monthly leaderboard</strong><span>Resets in 18 days</span></div>{!wallet ? <button type="button" className="small-connect" onClick={onConnect}>Connect to play</button> : <span className="signed-in-label"><span className="status-ring" /> You are ranked</span>}</div><div className="leaderboard-table" role="table" aria-label="September 2026 leaderboard"><div className="leaderboard-header" role="row"><span>RANK</span><span>WALLET</span><span>RATING</span><span>ELO</span><span>WINS</span><span>CHANGE</span></div>{leaderboardRows.map((row) => <div className={`leaderboard-row ${row.isYou ? "current-row" : ""}`} role="row" key={row.rank}><span className={`table-rank ${row.rank <= 3 ? "top-rank" : ""}`}>{row.rank <= 3 ? <Crown size={14} /> : null}{row.rank}</span><div className="table-wallet"><WalletAvatar name={row.name} accent={row.rank === 1 ? "green" : row.isYou ? "green" : "white"} /><div><strong>{row.name}</strong><span>{row.address}{row.isYou ? " · you" : ""}</span></div></div><strong className="table-number">{row.rating}</strong><strong className="table-number elo-number">{row.elo}</strong><span className="table-number">{row.wins}</span><span className="change-number">{row.change}</span></div>)}</div><div className="leaderboard-foot"><span>Showing wallets with at least one ranked battle.</span><button type="button">View season archive <ArrowUpRight size={14} /></button></div></section><div className="archive-grid"><ArchiveCard month="August 2026" winner="solace" elo="1,412" /><ArchiveCard month="July 2026" winner="Mantis" elo="1,366" /><ArchiveCard month="June 2026" winner="Pouch" elo="1,298" /></div></div>;
}

function ArchiveCard({ month, winner, elo }: { month: string; winner: string; elo: string }) {
  return <div className="archive-card"><span className="eyebrow">ARCHIVE</span><strong>{month}</strong><div><Crown size={14} /> {winner}<span>{elo} ELO</span></div></div>;
}

function ProfileView({ wallet, onConnect }: { wallet: Wallet | null; onConnect: () => void }) {
  if (!wallet) return <div className="page-stack profile-empty-page"><div className="empty-icon"><UserRound size={24} /></div><div className="eyebrow accent-eyebrow">YOUR PROFILE</div><h1>Claim your place.</h1><p>Connect a wallet to see your ELO, rating, and battle record.</p><button type="button" className="primary-cta" onClick={onConnect}>Connect wallet <ArrowUpRight size={17} /></button></div>;

  return <div className="page-stack"><section className="profile-hero"><div className="profile-identity"><WalletAvatar name={wallet.displayName} accent="green" /><div><span className="eyebrow accent-eyebrow">CONNECTED WALLET</span><h1>{wallet.displayName}</h1><div className="profile-address">{shortAddress(wallet.address)} <span className="verified-mark"><Check size={12} /></span></div></div></div><div className="profile-actions"><button type="button" className="outline-button">Edit display name</button><span className="profile-season">September 2026</span></div></section><section className="profile-stats"><StatBlock label="ELO" value={wallet.elo.toString()} detail="+18 this month" positive /><StatBlock label="BATTLE RATING" value={wallet.rating.toString()} detail="out of 100" /><StatBlock label="BATTLES WON" value={wallet.wins.toString()} detail="ranked only" /><StatBlock label="CURRENT RANK" value="#06" detail="September 2026" /></section><section className="profile-grid"><div className="sub-card profile-score-card"><div className="sub-card-heading"><div><span className="eyebrow">PERFORMANCE</span><h3>How you score</h3></div><Gauge size={18} /></div><div className="score-ring"><strong>{wallet.rating}</strong><span>/ 100</span></div><p>Profit leads the score. Win rate and risk decide the rest.</p><div className="profile-bars"><ScoreBar label="Profit" value={82} color="green" /><ScoreBar label="Win rate" value={67} color="white" /><ScoreBar label="Risk" value={61} color="red" /></div></div><div className="sub-card match-history-card"><div className="sub-card-heading"><div><span className="eyebrow">RECENT MATCHES</span><h3>Last five battles</h3></div><Activity size={18} /></div><div className="match-list"><MatchRow opponent="solace" result="W" elo="+18" /><MatchRow opponent="cold wallet" result="W" elo="+12" /><MatchRow opponent="Viper" result="L" elo="-9" /><MatchRow opponent="Pouch" result="D" elo="0" /><MatchRow opponent="Mantis" result="W" elo="+15" /></div></div></section></div>;
}

function StatBlock({ label, value, detail, positive = false }: { label: string; value: string; detail: string; positive?: boolean }) {
  return <div className="stat-block"><span className="eyebrow">{label}</span><strong>{value}</strong><span className={positive ? "stat-detail positive" : "stat-detail"}>{detail}</span></div>;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: "green" | "white" | "red" }) {
  return <div className="score-bar-row"><div><span>{label}</span><strong>{value}</strong></div><div className="score-bar"><span className={`score-fill ${color}`} style={{ width: `${value}%` }} /></div></div>;
}

function MatchRow({ opponent, result, elo }: { opponent: string; result: string; elo: string }) {
  const draw = result === "D";
  return <div className="match-row"><span className={`match-result ${draw ? "draw" : result === "W" ? "win" : "loss"}`}>{result}</span><span>{opponent}</span><strong className={elo.startsWith("+") ? "positive" : elo.startsWith("-") ? "negative" : ""}>{elo}</strong></div>;
}

function RulesView() {
  return <div className="page-stack rules-page"><section className="page-heading"><div><div className="eyebrow accent-eyebrow">NO MYSTERY MATH</div><h1>How a battle works.</h1><p>Short match. Same snapshot. One number on top.</p></div></section><section className="rules-grid"><RuleCard number="01" icon={<Timer size={18} />} title="Queue close" body="You start near your ELO. The search opens up the longer you wait, up to five minutes." /><RuleCard number="02" icon={<Activity size={18} />} title="Ten-second reveal" body="Both wallets are frozen at the start. We check the last 30 days, then show the work as it happens." /><RuleCard number="03" icon={<Trophy size={18} />} title="Monthly climb" body="Win the rating, win the round, move your ELO. The leaderboard resets at the start of each month." /></section><section className="score-explainer"><div><span className="eyebrow accent-eyebrow">THE 1–100 RATING</span><h2>Profit leads. Risk keeps it honest.</h2><p>Your rating blends net SOL profit, profitable trades, and drawdown over a rolling 30-day window. Free tokens, transfers, and bad price data stay out.</p></div><div className="explainer-pills"><span><strong>50%</strong> profit</span><span><strong>25%</strong> win rate</span><span><strong>25%</strong> risk</span></div></section></div>;
}

function RuleCard({ number, icon, title, body }: { number: string; icon: React.ReactNode; title: string; body: string }) {
  return <div className="rule-card"><div className="rule-card-top"><span>{number}</span><span className="rule-icon">{icon}</span></div><h3>{title}</h3><p>{body}</p><ChevronRight size={16} /></div>;
}
