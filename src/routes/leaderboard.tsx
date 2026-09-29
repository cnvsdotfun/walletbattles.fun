import { createFileRoute, Link } from "@tanstack/react-router";
import { shortenAddress } from "@/components/wallet-provider";
import { getLeaderboard } from "@/lib/server-actions";

export const Route = createFileRoute("/leaderboard")({
  loader: () => getLeaderboard(),
  head: () => ({
    meta: [
      { title: "Monthly leaderboard | walletbattles.fun" },
      { name: "description", content: "See the wallets leading this month's Solana battles." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { players } = Route.useLoaderData();
  const currentMonth = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date());

  return (
    <div className="utility-page leaderboard-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{currentMonth}</p>
          <h1 className="page-title">The monthly mog list.</h1>
          <p className="page-lede">ELO resets at the start of every calendar month. Win ranked battles to climb.</p>
        </div>
        <div className="panel panel-pad">
          <span className="muted">Reset</span>
          <strong className="player-stat-value">00:00 UTC</strong>
        </div>
      </section>

      <section className="table" aria-label="Monthly leaderboard">
        <div className="leaderboard-row leaderboard-heading">
          <span className="leaderboard-rank">Rank</span>
          <span className="leaderboard-wallet">Wallet</span>
          <span className="leaderboard-number">ELO</span>
          <span className="leaderboard-number">Rating</span>
          <span className="leaderboard-number">Wins</span>
        </div>
        {players.length ? players.map((player, index) => (
          <div className="leaderboard-row" key={player.address}>
            <span className="leaderboard-rank">{index + 1}</span>
            <Link className="leaderboard-wallet" to="/profile">
              <span>
                <span className="leaderboard-wallet-name">{player.displayName || shortenAddress(player.address)}</span>
                <span className="leaderboard-wallet-address">{shortenAddress(player.address)}</span>
              </span>
            </Link>
            <span className="leaderboard-number"><strong>{player.elo}</strong></span>
            <span className="leaderboard-number"><strong className="positive">{player.rating}</strong></span>
            <span className="leaderboard-number"><strong>{player.wins}</strong></span>
          </div>
        )) : (
          <div className="leaderboard-empty">
            <h2>No ranked wallets yet.</h2>
            <p>Be the first wallet to complete a ranked battle this month.</p>
            <Link className="primary-button" to="/">Enter ranked queue</Link>
          </div>
        )}
      </section>
    </div>
  );
}
