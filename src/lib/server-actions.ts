import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getTursoClient } from "./turso";

const AuthSchema = z.object({
  address: z.string().min(32).max(50),
  message: z.string().min(40).max(300),
  signature: z.array(z.number().int().min(0).max(255)).length(64),
});

const DisplayNameSchema = z.string().trim().max(24).regex(/^[A-Za-z0-9 ]*$/);

const ProfileInputSchema = z.object({
  auth: AuthSchema,
  displayName: DisplayNameSchema,
});

const QueueInputSchema = z.object({ auth: AuthSchema });

export type WalletAuth = z.infer<typeof AuthSchema>;

export type LeaderboardPlayer = {
  address: string;
  displayName: string | null;
  elo: number;
  rating: number | null;
  wins: number;
};

type DbClient = NonNullable<ReturnType<typeof getTursoClient>>;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS wallets (
    address TEXT PRIMARY KEY NOT NULL,
    display_name TEXT,
    elo INTEGER NOT NULL DEFAULT 1000,
    rating INTEGER,
    ranked_wins INTEGER NOT NULL DEFAULT 0,
    ranked_battles INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS queue_entries (
    address TEXT PRIMARY KEY NOT NULL,
    elo INTEGER NOT NULL DEFAULT 1000,
    queued_at TEXT NOT NULL,
    FOREIGN KEY (address) REFERENCES wallets(address) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_wallets_monthly_leaderboard ON wallets (ranked_battles, elo DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_entries_elo ON queue_entries (elo, queued_at)`,
];

async function ensureSchema(db: DbClient) {
  for (const statement of schemaStatements) await db.execute(statement);
}

function decodeBase58(value: string) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = [0];

  for (const character of value) {
    const digit = alphabet.indexOf(character);
    if (digit < 0) return null;
    let carry = digit;
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 255;
      carry >>= 8;
    }
    while (carry) {
      bytes.push(carry & 255);
      carry >>= 8;
    }
  }

  for (const character of value) {
    if (character !== "1") break;
    bytes.push(0);
  }

  return Uint8Array.from(bytes.reverse());
}

async function verifyWalletAuth(auth: WalletAuth) {
  const expected = new RegExp(`^walletbattles\\.fun sign in\\n\\nWallet: ${auth.address}\\nIssued: (.+)$`);
  const match = expected.exec(auth.message);
  if (!match) return false;

  const issuedAt = Date.parse(match[1]);
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > 5 * 60 * 1000) return false;

  const publicKey = decodeBase58(auth.address);
  if (!publicKey || publicKey.length !== 32) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      publicKey,
      { name: "Ed25519" } as AlgorithmIdentifier,
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      Uint8Array.from(auth.signature),
      new TextEncoder().encode(auth.message),
    );
  } catch {
    return false;
  }
}

function toPlayer(row: Record<string, unknown>): LeaderboardPlayer {
  return {
    address: String(row.address),
    displayName: row.display_name ? String(row.display_name) : null,
    elo: Number(row.elo),
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    wins: Number(row.ranked_wins),
  };
}

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const db = getTursoClient();
  if (!db) return { configured: false, players: [] as LeaderboardPlayer[] };

  await ensureSchema(db);
  const result = await db.execute(
    "SELECT address, display_name, elo, rating, ranked_wins FROM wallets WHERE ranked_battles > 0 ORDER BY elo DESC, ranked_wins DESC LIMIT 100",
  );

  return {
    configured: true,
    players: result.rows.map((row) => toPlayer(row as Record<string, unknown>)),
  };
});

export const getWalletProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => QueueInputSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await verifyWalletAuth(data.auth))) return { ok: false as const, profile: null };
    const db = getTursoClient();
    if (!db) return { ok: false as const, profile: null };

    await ensureSchema(db);
    const result = await db.execute({
      sql: "SELECT address, display_name, elo, rating, ranked_wins, ranked_battles FROM wallets WHERE address = ?",
      args: [data.auth.address],
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return { ok: true as const, profile: null };

    return {
      ok: true as const,
      profile: {
        displayName: row.display_name ? String(row.display_name) : "",
        elo: Number(row.elo),
        rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
        wins: Number(row.ranked_wins),
        battles: Number(row.ranked_battles),
      },
    };
  });

export const saveWalletProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ProfileInputSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await verifyWalletAuth(data.auth))) return { ok: false as const, message: "Wallet verification expired. Sign in again." };
    const db = getTursoClient();
    if (!db) return { ok: false as const, message: "Profiles are temporarily unavailable. Try again shortly." };

    const now = new Date().toISOString();
    await ensureSchema(db);
    await db.execute({
      sql: `INSERT INTO wallets (address, display_name, elo, ranked_wins, ranked_battles, created_at, updated_at)
        VALUES (?, ?, 1000, 0, 0, ?, ?)
        ON CONFLICT(address) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at`,
      args: [data.auth.address, data.displayName || null, now, now],
    });
    return { ok: true as const, message: "Display name saved." };
  });

export const joinRankedQueue = createServerFn({ method: "POST" })
  .validator((data: unknown) => QueueInputSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await verifyWalletAuth(data.auth))) return { ok: false as const, message: "Wallet verification expired. Sign in again." };
    const db = getTursoClient();
    if (!db) return { ok: false as const, message: "Ranked queue is temporarily unavailable. Try again shortly." };

    const now = new Date().toISOString();
    await ensureSchema(db);
    await db.execute({
      sql: `INSERT INTO wallets (address, elo, ranked_wins, ranked_battles, created_at, updated_at)
        VALUES (?, 1000, 0, 0, ?, ?)
        ON CONFLICT(address) DO UPDATE SET updated_at = excluded.updated_at`,
      args: [data.auth.address, now, now],
    });
    await db.execute({
      sql: "INSERT OR REPLACE INTO queue_entries (address, elo, queued_at) SELECT address, elo, ? FROM wallets WHERE address = ?",
      args: [now, data.auth.address],
    });
    return { ok: true as const, message: "You are in the ranked queue." };
  });

export const leaveRankedQueue = createServerFn({ method: "POST" })
  .validator((data: unknown) => QueueInputSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await verifyWalletAuth(data.auth))) return { ok: false as const };
    const db = getTursoClient();
    if (!db) return { ok: true as const };
    await ensureSchema(db);
    await db.execute({ sql: "DELETE FROM queue_entries WHERE address = ?", args: [data.auth.address] });
    return { ok: true as const };
  });
