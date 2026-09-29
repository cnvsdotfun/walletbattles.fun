# Project Details

- Name: walletbattles.fun
- Domain: walletbattles.fun

# Tech Stack / Services

- React
- Tanstack Start
- NPM
- Zod
- Tailwind CSS
- Solana
- Solana RPC

- Turso for database
- Vercel for deployment
- Spaceship for domain management
- GitHub for code hosting

# Design Rules

- 8px base unit sizing for everything except outlines and borders
- 1px for outlines/borders
- Smooth animations for things that pop up like a modal, hover effects on buttons, page change effects
- Keep it minimal
- 8px border radii
- Use Inter for every visible UI element and document surface. Do not mix in another display font.
- Use the main text color or placeholder color for text. Reserve positive and negative colors for simple action buttons only.

## Output & Copywriting Rules (Strict)

- **Production-Ready Copy**: Do not output generic placeholder text, "Lorem Ipsum," or stubs like "[Insert Motto Here]" or "Coming Soon." All copy must be written completely, contextually, and immediately ready for public deployment.
- **Eliminate Technical Artifacts**: Never inject "Preview Build," "Draft," "Beta," or environmental debug badges/labels anywhere into the visible UI components.
- **Human-Centric Tone**: Write feature descriptions, mottos, and interface microcopy using short, punchy, active-voice sentences. Avoid typical robotic AI tropes, hype cycles, and marketing buzzwords (e.g., _delve, leverage, game-changing, seamless, paradigm shift_). Keep communication direct, clear, and grounded.

## Color Palette

- Background: #151515
- Cards/Modals/Boxes: #202020
- Outlines/Borders: #303030
- Text/Icon/Logo: #f8f8ff
- Placeholder Text: #505050
- Button: #f8f8ff
- Button Text: #151515
- Positive Color (success/accept/etc.): #29a24d
- Negative Color (error/denied/cancel/etc.): #a51f2d

# Algorithm

- Use a rolling 30-day snapshot.
- Include realized and unrealized net SOL PnL after trading and network fees.
- Use profitable closed-trade win rate and risk performance from drawdown and downside volatility.
- Use total balance only to normalize profit and prevent wallet size from becoming the only path to a high score.
- Hold time is not a standalone bonus; it is retained in the snapshot for future risk analysis.

# Implementation Baseline

- Use TanStack Start with TanStack Router, Vite, and Nitro for the Vercel deployment target.
- Use NPM scripts and Tailwind CSS. Do not replace the stack with Next.js, Vinext, a Cloudflare starter, or a hosted-site starter.
- Use Solana wallet adapter packages for wallet connection and Solana RPC for mainnet reads.
- Use Zod at scoring, server-function, and external-data boundaries.
- Keep Turso access server-side through a small adapter. Never expose database credentials in client code.

# Product Contract

## Core Loop

- Wallet Battles is a live, minimal competition for Solana wallet traders.
- A ranked battle matches two connected wallets from a random queue.
- A ranked battle lasts 10 seconds.
- The battle UI shows a 3-second countdown, then short messages as each scoring step runs.
- The result is a win, loss, or draw.
- Ranked battles affect monthly ELO. Private code matches do not affect ELO, battle history, or win/loss records.
- Players must requeue after a battle.
- A player cannot be matched against the same opponent again until they have faced three different ranked opponents.
- Only wallets that have actually entered the queue or played a battle are analyzed. Connecting a wallet alone must not trigger passive tracking.
- A wallet may queue regardless of how little trading history it has. Low activity must produce a poor algorithm rating rather than blocking the player.
- The leaderboard shows wallets that have completed at least one ranked battle.

## Rating and ELO

- ELO starts at 1000.
- ELO accumulates during a calendar month and is used as the leaderboard ranking.
- Reset at 00:00 UTC on the first day of each calendar month. Use higher ELO volatility for a wallet's first matches, then reduce it as monthly match count grows.
- The algorithm also produces a 1–100 performance rating. It must account for profit, win rate, and risk performance, with the exact formula documented and tested before launch.
- The algorithm must snapshot both wallets at battle start so the result cannot change during the 10-second reveal.
- Show both players' shortened addresses and display names throughout the entire battle.
- Show algorithm progress messages during the countdown and reveal, but do not expose component scores during the battle.
- A draw occurs only when both final 1–100 ratings are exactly equal.

## Wallet Identity and Privacy

- Wallet connection uses a Solana wallet adapter.
- The app must use a signed message to verify wallet ownership. It must not request a transaction for login or gameplay.
- Public profiles use a shortened wallet address and may include a user-selected display name.
- Connected users can wipe their wallet data and rating.
- Wiping wallet data removes the wallet's public profile, battle record, rating, ELO, and stored identity data.
- A wiped wallet must not be remembered or automatically restored as a previous player. If it reconnects later, it starts as a new wallet profile.
- The app must not present unconnected wallets as players or collect their trading history.
- Wallet profiles are intended to be fun and public, but privacy and data deletion behavior must remain explicit in the UI.

## Abuse Rules

- A wallet that is banned cannot enter the queue and must receive a clear in-product explanation.
- A banned wallet's public profile must not remain viewable.
- The system must protect against repeated opponent farming, wash trading, self-transfers, fake PnL, manipulated prices, and low-liquidity marks.
- Known program, exchange, treasury, bot, and other non-trader wallets need an explicit eligibility policy before ranked launch.

## Product Voice

- The experience is minimal, direct, and playful.
- Use “mog” language where it fits naturally.
- Avoid AI-sounding copy, hype, generic crypto promises, and technical debug labels.
- The coin sits behind the brand; the battle remains usable for wallets that do not hold the coin.

## Delivery Constraints

- Mainnet is the target network.
- Keep operating cost at $0 for as long as practical.
- Do not add a dependency, data provider, or external service without asking first.
- Optimize for mobile use, accessibility, SEO, and a low-clutter interface.
- Keep the scoring engine deterministic, independently testable, and explainable in the battle UI.

## Brand Configuration

- Coin name: not created yet.
- Coin ticker: not created yet.
- Coin contract address: not created yet.
- When the contract address exists, show it in the site header or brand menu, the main brand/coin section, and the footer.
- The contract address must be clickable to copy.
- After a successful copy, show the tooltip text `Copied` and expose an equivalent accessible status for keyboard and assistive-technology users.
- Do not show a fake, placeholder, or invented contract address in the public UI.

## Battle Rating Defaults

- The 1–100 battle rating is separate from ELO. The battle rating determines the result of an individual ranked battle; ELO determines leaderboard order.
- Use a rolling 30-day window for the battle rating.
- Use net SOL-denominated trading performance. The scoring engine must include realized and unrealized PnL and subtract trading fees and network fees.
- Exclude deposits, withdrawals, wallet-to-wallet transfers, airdrops, NFTs, staking, liquidity positions, and assets without reliable price or liquidity data.
- Treat free tokens and unsolicited token distributions as non-trading activity.
- Use profitable closed trades for trade win rate. Do not use previous battle wins as an input to the battle rating because ELO already measures battle performance.
- Make profit the strongest component, with risk performance and profitable-trade win rate as supporting components.
- Use a log-scaled profit component so larger wallets receive credit for real profit without making wallet size the only path to winning.
- Use maximum drawdown and downside volatility to measure risk performance. Penalize large losses and unstable results.
- Smooth small samples toward a low-confidence baseline. A wallet with no qualifying activity receives a very low rating but may still queue.
- Clamp every battle rating to the inclusive 1–100 range.
- Store the input snapshot and component scores used for every ranked result so the result can be explained and reproduced.
- Do not expose exact PnL amounts by default on public profiles. Show rating, ELO, public address, display name when present, and ranked battle wins; expose additional performance detail only if the user later chooses it.

## ELO Defaults

- Use a 1000 starting ELO.
- ELO is accumulated within a fixed calendar month and resets at 00:00 UTC on the first day of each month.
- Preserve a public archive of completed monthly leaderboards and winners.
- Use higher rating volatility for a player's first matches, then reduce volatility as the player's monthly match count grows.
- Use only ranked battles for ELO. Code matches never affect ELO, rating history, or ranked win/loss records.

## Queue Defaults

- A player must be connected and signed in with a wallet message before entering the queue.
- Disconnecting cancels the player's queue entry.
- Match randomly within a close ELO band first, then expand the band as wait time increases.
- Show the current queue rules and search range while waiting, including the player's ELO range and how long they have been waiting.
- Cancel a queue search after 5 minutes without a match and explain what happened.
- Do not rematch the same opponent until the player has completed ranked battles against three different wallets. This protection applies in both directions and counts completed ranked battles only; draws count and code matches do not.
- A player must requeue after every battle.

## Wallet Eligibility and Moderation

- Automatically exclude known programs, exchanges, treasuries, deployers, and clearly identified bots from ranked matchmaking when reliable labels are available.
- Do not exclude a wallet solely for trading frequently or holding a large balance.
- Detect self-transfers, wash trading, manipulated prices, illiquid marks, and other activity that can manufacture PnL.
- Label suspicious activity as ineligible rather than quietly producing a misleading rating.
- A banned wallet cannot queue and must receive a clear popup explaining that ranked matchmaking is unavailable.
- Keep moderation controls administrative and server-side. Do not rely on client-side eligibility checks.

## Public Profiles and SEO

- Public profiles are created only after a wallet has entered the queue or completed a battle.
- Show the shortened public address, optional display name, ELO, 1–100 rating, and ranked battle wins. Avoid exposing raw wallet holdings or exact PnL by default.
- Display names may contain normal letters, numbers, and spaces only. Do not allow emoji or decorative symbols.
- Make leaderboard pages and completed wallet profiles indexable for SEO. Do not index empty, unplayed, wiped, or low-information profiles.
- Use canonical profile URLs based on the wallet address and keep display names editable without changing the canonical URL.
- Apply basic display-name filtering and length limits before publishing a name.
