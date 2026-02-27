// db.js
const Database = require("better-sqlite3");

const db = new Database("data.sqlite");

// جداول الموقع
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  discord_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  value TEXT NOT NULL CHECK(value IN ('positive','neutral','negative')),
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ratings_staff ON ratings(staff_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ip ON ratings(ip_hash);
`);

module.exports = db;