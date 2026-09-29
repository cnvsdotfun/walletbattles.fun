CREATE TABLE IF NOT EXISTS wallets (
  address TEXT PRIMARY KEY NOT NULL,
  display_name TEXT,
  elo INTEGER NOT NULL DEFAULT 1000,
  rating INTEGER,
  ranked_wins INTEGER NOT NULL DEFAULT 0,
  ranked_battles INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS queue_entries (
  address TEXT PRIMARY KEY NOT NULL,
  elo INTEGER NOT NULL DEFAULT 1000,
  queued_at TEXT NOT NULL,
  FOREIGN KEY (address) REFERENCES wallets(address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallets_monthly_leaderboard
  ON wallets (ranked_battles, elo DESC);

CREATE INDEX IF NOT EXISTS idx_queue_entries_elo
  ON queue_entries (elo, queued_at);
