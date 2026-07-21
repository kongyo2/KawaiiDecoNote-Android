import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

/**
 * Web版は IndexedDB の kv ストアに state を1件だけ保存していた。
 * このアプリも同じく「キー→JSON文字列」の kv テーブル1枚で持つ。
 */
let db: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync("kawaii-deconote.db");
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS kv(
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function kvGet(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>("SELECT value FROM kv WHERE key = ?", key);
  return row ? row.value : null;
}

export function kvSet(key: string, value: string): void {
  getDb().runSync(
    "INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
