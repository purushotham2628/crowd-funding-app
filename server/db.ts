import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';

// Create SQLite database file in the project root
const dbPath = path.resolve(process.cwd(), 'blockfund.db');
const sqlite: Database.Database = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

export const db = drizzle({ client: sqlite, schema });
