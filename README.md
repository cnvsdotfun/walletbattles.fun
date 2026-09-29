# walletbattles.fun

walletbattles.fun is a minimal Solana wallet battle site. Two connected wallets enter a ten-second ranked battle, receive a 1-100 performance rating, and compete for monthly ELO.

## Stack

- React and TanStack Start
- TanStack Router file routes
- Vite and Nitro for Vercel
- Tailwind CSS
- Zod scoring boundaries
- Solana wallet adapters and mainnet RPC
- Turso server adapter

## Run locally

```bash
npm install
npm run dev
```

The local site runs at `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` for local work. Set `VITE_SOLANA_RPC_URL` for a preferred Solana RPC endpoint. Set `VITE_COIN_ADDRESS` only after the coin contract exists. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for server-side database access.

The production queue and leaderboard use Turso. The schema is in `db/schema.sql` and is also created on first server access. Wallet actions require a fresh Phantom signature; no transaction is requested.

## Project shape

- `src/routes/` contains TanStack Start file routes.
- `src/components/` contains the wallet provider and shared shell.
- `src/lib/scoring.ts` contains the deterministic, Zod-validated rating engine.
- `src/lib/server-actions.ts` contains the server-only Turso-backed queue, profile, and leaderboard actions.
- `src/lib/turso.ts` contains the server-side Turso client factory.
- `db/schema.sql` contains the production tables and indexes.
- `vercel.json` selects the TanStack Start Vercel framework.
