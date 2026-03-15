import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const dataDir = path.join(os.homedir(), ".issue-foundry");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "kanban.db");

const db: import("better-sqlite3").Database = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    project_path TEXT UNIQUE DEFAULT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS columns (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id   INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cards (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id   INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    position    INTEGER NOT NULL DEFAULT 0,
    labels      TEXT DEFAULT '[]',
    due_date    TEXT DEFAULT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id    INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    author     TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id   INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    author     TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id, position);
  CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id, position);
  CREATE INDEX IF NOT EXISTS idx_comments_card ON comments(card_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_documents_board ON documents(board_id);
`);

const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];

function createBoardColumns(boardId: number | bigint) {
  const insertCol = db.prepare("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)");
  DEFAULT_COLUMNS.forEach((name, i) => insertCol.run(boardId, name, i));
}

export function getOrCreateProjectBoard(projectPath: string): { id: number; name: string; project_path: string } {
  const resolved = path.resolve(projectPath);
  const existing = db.prepare("SELECT * FROM boards WHERE project_path = ?").get(resolved) as { id: number; name: string; project_path: string } | undefined;
  if (existing) return existing;

  const name = path.basename(resolved);
  const info = db.prepare("INSERT INTO boards (name, project_path) VALUES (?, ?)").run(name, resolved);
  createBoardColumns(info.lastInsertRowid);
  return db.prepare("SELECT * FROM boards WHERE id = ?").get(info.lastInsertRowid) as { id: number; name: string; project_path: string };
}

export default db;
