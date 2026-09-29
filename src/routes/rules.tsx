import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules and rating | walletbattles.fun" },
      { name: "description", content: "How wallet battles, ratings, ELO, and queue rules work." },
    ],
  }),
  component: RulesPage,
});

const rules = [
  ["01", "Connect and sign", "Connect a Solana wallet and sign one message to prove ownership. No transaction is requested."],
  ["02", "Queue for ranked", "Ranked matchmaking starts close to your ELO and expands the search every 15 seconds. The search ends after 5 minutes."],
  ["03", "Battle for 10 seconds", "A 3-second countdown starts the battle. The algorithm locks both snapshots, then shows its work in short messages."],
  ["04", "Rating calls the result", "Profit carries the most weight. Profitable trade win rate and risk performance support it. A rating always lands between 1 and 100."],
  ["05", "ELO runs monthly", "Ranked wins and losses change your ELO. It starts at 1000 and resets at 00:00 UTC on the first day of each month."],
  ["06", "Mog different wallets", "You cannot see the same opponent again until you have completed ranked battles against three other wallets. Draws count."],
];

function RulesPage() {
  return (
    <div className="utility-page rules-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">No mystery math</p>
          <h1 className="page-title">Know what you are fighting for.</h1>
          <p className="page-lede">The battle stays short. The rules stay clear.</p>
        </div>
      </section>
      <section className="rules-list">
        {rules.map(([number, title, body]) => (
          <article className="rule-item" key={number}>
            <span className="rule-number">{number}</span>
            <div>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
