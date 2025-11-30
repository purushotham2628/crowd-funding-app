import { drizzle } from 'drizzle-orm/better-sqlite3';
// better-sqlite3 doesn't expose types under its `exports` map in some Node/npm setups.
// Provide a minimal ambient declaration in `types/` and suppress the compiler here.
// @ts-ignore
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';

// Create SQLite database file in the project root
const dbPath = path.resolve(process.cwd(), 'blockfund.db');
const sqlite: any = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

export const sqliteDb = sqlite;
export const db = drizzle({ client: sqlite, schema });

// Initialize DB schema (create tables if they don't exist)
export async function initDb() {
	const createTablesSql = `
	PRAGMA foreign_keys = ON;

	CREATE TABLE IF NOT EXISTS sessions (
		sid TEXT PRIMARY KEY,
		sess TEXT NOT NULL,
		expire INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT UNIQUE,
		password_hash TEXT,
		first_name TEXT,
		last_name TEXT,
		profile_image_url TEXT,
		created_at INTEGER DEFAULT (strftime('%s','now')),
		updated_at INTEGER DEFAULT (strftime('%s','now'))
	);

	CREATE TABLE IF NOT EXISTS projects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		creator_id TEXT NOT NULL REFERENCES users(id),
		title TEXT NOT NULL,
		description TEXT NOT NULL,
		category TEXT NOT NULL DEFAULT 'other',
		goal_amount TEXT NOT NULL,
		current_amount TEXT NOT NULL DEFAULT '0',
		deadline INTEGER NOT NULL,
		image_url TEXT,
		is_active INTEGER NOT NULL DEFAULT 1,
		withdrawn INTEGER NOT NULL DEFAULT 0,
		created_at INTEGER DEFAULT (strftime('%s','now'))
	);

	CREATE TABLE IF NOT EXISTS transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		project_id INTEGER NOT NULL REFERENCES projects(id),
		donor_id TEXT REFERENCES users(id),
		donor_wallet_address TEXT,
		amount TEXT NOT NULL,
		transaction_type TEXT NOT NULL DEFAULT 'demo',
		transaction_hash TEXT,
		created_at INTEGER DEFAULT (strftime('%s','now'))
	);

	CREATE TABLE IF NOT EXISTS refund_requests (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		project_id INTEGER NOT NULL REFERENCES projects(id),
		donor_id TEXT NOT NULL REFERENCES users(id),
		transaction_id INTEGER REFERENCES transactions(id),
		amount TEXT NOT NULL,
		creator_id TEXT NOT NULL REFERENCES users(id),
		approved INTEGER NOT NULL DEFAULT 0,
		created_at INTEGER DEFAULT (strftime('%s','now'))
	);
	`;

	// Run in a single exec to apply all statements
	sqlite.exec(createTablesSql);

	// Migration: add columns if older DB was missing them (idempotent)
	try {
		const refundInfo = sqlite.prepare("PRAGMA table_info('refund_requests')").all();
		const refundCols = refundInfo.map((c: any) => c.name);
		if (!refundCols.includes('transaction_id')) {
			sqlite.exec("ALTER TABLE refund_requests ADD COLUMN transaction_id INTEGER REFERENCES transactions(id);");
		}
		if (!refundCols.includes('amount')) {
			sqlite.exec("ALTER TABLE refund_requests ADD COLUMN amount TEXT DEFAULT '0';");
		}

		// Migration: add password_hash to users if missing
		const usersInfo = sqlite.prepare("PRAGMA table_info('users')").all();
		const usersCols = usersInfo.map((c: any) => c.name);
		if (!usersCols.includes('password_hash')) {
			sqlite.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
		}
	} catch (err: any) {
		console.warn('DB migration warning (refund_requests):', err?.message || err);
	}
}
