import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
} from '../../database/database.js';

export { getDatabase, initializeDatabase, resetDatabase };

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid database identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function buildWhereClause(where = {}) {
  const entries = Object.entries(where);

  if (entries.length === 0) {
    return { clause: '', values: [] };
  }

  return {
    clause: ` WHERE ${entries.map(([column]) => `${quoteIdentifier(column)} = ?`).join(' AND ')}`,
    values: entries.map(([, value]) => value),
  };
}

export function createRow(table, data) {
  const connection = getDatabase();
  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) {
    return { changes: 0 };
  }

  const columns = Object.keys(rows[0]);
  const statement = connection.prepare(
    `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
  );

  const insert = connection.transaction((items) => {
    for (const row of items) {
      statement.run(...columns.map((column) => row[column] ?? null));
    }
  });
  insert(rows);

  return { changes: rows.length, lastInsertRowid: connection.lastInsertRowid };
}

export function readRow(table, { where = {}, orderBy = [] } = {}) {
  const connection = getDatabase();
  const whereClause = buildWhereClause(where);
  const ordering = orderBy.length > 0
    ? ` ORDER BY ${orderBy.map(quoteIdentifier).join(', ')}`
    : '';

  return connection
    .prepare(`SELECT * FROM ${quoteIdentifier(table)}${whereClause.clause}${ordering}`)
    .all(...whereClause.values);
}

export function updateRow(table, data, where) {
  const connection = getDatabase();
  const assignments = Object.keys(data);
  const whereClause = buildWhereClause(where);

  if (assignments.length === 0 || whereClause.values.length === 0) {
    throw new Error('updateRow requires data and a non-empty where clause');
  }

  return connection
    .prepare(
      `UPDATE ${quoteIdentifier(table)} SET ${assignments.map((column) => `${quoteIdentifier(column)} = ?`).join(', ')}${whereClause.clause}`,
    )
    .run(...assignments.map((column) => data[column] ?? null), ...whereClause.values);
}

export function deleteRow(table, where) {
  const connection = getDatabase();
  const whereClause = buildWhereClause(where);

  if (whereClause.values.length === 0) {
    throw new Error('deleteRow requires a non-empty where clause');
  }

  return connection
    .prepare(`DELETE FROM ${quoteIdentifier(table)}${whereClause.clause}`)
    .run(...whereClause.values);
}