import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initializeDatabase() {
  const db = await open({
    // Changed to v5 to include yearly_closings table
    filename: './database_v5.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cost_price INTEGER NOT NULL,
      default_sales_price INTEGER
    );

    CREATE TABLE IF NOT EXISTS openings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opening_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('sales', 'expense')),
      item_name TEXT,
      amount INTEGER NOT NULL,
      cost INTEGER DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY(opening_id) REFERENCES openings(id)
    );

    CREATE TABLE IF NOT EXISTS yearly_closings (
      year INTEGER PRIMARY KEY,
      status TEXT DEFAULT 'closed',
      closed_at TEXT
    );
  `);

  console.log('Database initialized (v5)');
  return db;
}
