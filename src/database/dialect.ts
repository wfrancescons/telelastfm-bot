import {
  CompiledQuery,
  type DatabaseConnection,
  type Dialect,
  type DialectAdapter,
  type Driver,
  type Kysely,
  type QueryCompiler,
  type QueryResult,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import type { DatabaseSync } from "node:sqlite";

export class NodeSqliteConnection implements DatabaseConnection {
  #db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.#db = db;
  }

  // deno-lint-ignore require-await
  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;
    const stmt = this.#db.prepare(sql);
    const params = parameters as Parameters<typeof stmt.all>;

    // If the query returns columns (SELECT, PRAGMA, RETURNING, etc.)
    if (stmt.columns().length > 0) {
      const rows = stmt.all(...params) as R[];
      return {
        rows,
      };
    }

    const { changes, lastInsertRowid } = stmt.run(...params);

    return {
      numAffectedRows: changes != null ? BigInt(changes) : undefined,
      insertId: lastInsertRowid != null ? BigInt(lastInsertRowid) : undefined,
      rows: [],
    };
  }

  // deno-lint-ignore require-yield
  async *streamQuery<R>(
    _compiledQuery: CompiledQuery,
    _chunkSize?: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("NodeSqliteDialect does not support streaming queries");
  }
}

export class NodeSqliteDriver implements Driver {
  #db: DatabaseSync;
  #connection: NodeSqliteConnection;

  constructor(db: DatabaseSync) {
    this.#db = db;
    this.#connection = new NodeSqliteConnection(db);
  }

  // deno-lint-ignore require-await
  async init(): Promise<void> {
    // Recommended SQLite settings
    this.#db.exec("PRAGMA journal_mode = WAL;");
    this.#db.exec("PRAGMA foreign_keys = ON;");
  }

  // deno-lint-ignore require-await
  async acquireConnection(): Promise<DatabaseConnection> {
    return this.#connection;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  async releaseConnection(): Promise<void> {
    // No-op for single synchronous SQLite connection
  }

  // deno-lint-ignore require-await
  async destroy(): Promise<void> {
    this.#db.close();
  }
}

export class NodeSqliteDialect implements Dialect {
  #db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.#db = db;
  }

  createDriver(): Driver {
    return new NodeSqliteDriver(this.#db);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  createIntrospector(db: Kysely<unknown>) {
    return new SqliteIntrospector(db);
  }
}

