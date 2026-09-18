import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

let database;
const databasePath = fileURLToPath(new URL('../database.sqlite', import.meta.url));

function createSchema(connection) {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS ports (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      name TEXT NOT NULL,
      value INTEGER,
      FOREIGN KEY (node_id) REFERENCES nodes (id) ON DELETE CASCADE,
      UNIQUE (node_id, id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_port_id TEXT NOT NULL,
      target_port_id TEXT NOT NULL,
      FOREIGN KEY (source_port_id) REFERENCES ports (id) ON DELETE CASCADE,
      FOREIGN KEY (target_port_id) REFERENCES ports (id) ON DELETE CASCADE,
      UNIQUE (source_port_id),
      UNIQUE (target_port_id),
      CHECK (source_port_id <> target_port_id)
    );
  `);
}

export function initializeDatabase() {
  if (!database) {
    database = new Database(databasePath);
    database.pragma('foreign_keys = ON');
    createSchema(database);
  }

  return database;
}

export function getDatabase() {
  return initializeDatabase();
}

export function resetDatabase() {
  const connection = initializeDatabase();
  connection.exec(`
    DROP TABLE IF EXISTS connections;
    DROP TABLE IF EXISTS ports;
    DROP TABLE IF EXISTS nodes;
  `);
  createSchema(connection);
  return connection;
}