/**
 * SQLite через встроенный node:sqlite (Node 22.5+, experimental).
 * Запуск: node --experimental-sqlite … (см. package.json scripts).
 *
 * Без нативных npm-зависимостей и сборок.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.SQLITE_PATH ?? './data/domofon.sqlite';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db: DatabaseSync = new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode = WAL`);

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    push_token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    intercom_id TEXT NOT NULL,
    sip_uri TEXT,
    status TEXT NOT NULL,
    snapshot_url TEXT,
    answered_by TEXT,
    answered_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
