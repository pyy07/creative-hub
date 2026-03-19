import Database from 'better-sqlite3';
import { createClient, type Client } from '@libsql/client';
import path from 'path';

// --- 类型定义 ---

export type DbProvider = 'sqlite' | 'turso';

export interface DbConfig {
  provider: DbProvider;
  // SQLite
  sqlitePath?: string;
  // Turso
  tursoUrl?: string;
  tursoToken?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  platforms: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  title: string;
  type: 'link' | 'text' | 'image';
  content: string;
  createdAt: string;
}

export interface Inspiration {
  id: string;
  query: string;
  results: string;
  createdAt: string;
}

export interface Publication {
  id: string;
  articleId: string;
  platform: 'wechat' | 'xiaohongshu';
  title: string;
  content: string;
  createdAt: string;
}

// --- Provider 抽象层 ---

interface IDatabase {
  exec(sql: string): void | Promise<void>;
  prepare(sql: string): IStatement;
}

interface IStatement {
  run(...params: any[]): any;
  get(...params: any[]): any;
  all(...params: any[]): any;
}

// --- Provider 实现 ---

class SQLiteDatabase implements IDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    initTables(this.db);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): IStatement {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params: any[]) => stmt.run(...params),
      get: (...params: any[]) => stmt.get(...params),
      all: (...params: any[]) => stmt.all(...params),
    };
  }
}

class TursoDatabase implements IDatabase {
  private client: Client;

  constructor(url: string, token: string) {
    this.client = createClient({
      url,
      authToken: token,
    });
  }

  async initTables(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        platforms TEXT NOT NULL DEFAULT '[]',
        tags TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        content TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS inspirations (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        results TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS publications (
        id TEXT PRIMARY KEY,
        article_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
    ];
    for (const sql of tables) {
      await this.client.execute(sql);
    }
  }

  exec(sql: string): void {
    // 同步 exec 在 Turso 中不适用
    throw new Error('Turso does not support sync exec');
  }

  prepare(sql: string): IStatement {
    const client = this.client;
    return {
      run: async (...params: any[]) => {
        const result = await client.execute({
          sql,
          args: params,
        });
        return result;
      },
      get: async (...params: any[]) => {
        const result = await client.execute({
          sql,
          args: params,
        });
        return result.rows?.[0] || null;
      },
      all: async (...params: any[]) => {
        const result = await client.execute({
          sql,
          args: params,
        });
        return result.rows || [];
      },
    };
  }
}

// --- 初始化 ---

function getConfig(): DbConfig {
  const provider = (process.env.DB_PROVIDER as DbProvider) || 'sqlite';

  if (provider === 'turso') {
    return {
      provider: 'turso',
      tursoUrl: process.env.TURSO_DATABASE_URL || '',
      tursoToken: process.env.TURSO_AUTH_TOKEN || '',
    };
  }

  return {
    provider: 'sqlite',
    sqlitePath: process.env.SQLITE_PATH || path.join(process.cwd(), 'data.db'),
  };
}

let _db: IDatabase | null = null;
let _dbConfig: DbConfig | null = null;
let _initPromise: Promise<IDatabase> | null = null;

export async function initDb(): Promise<IDatabase> {
  if (_db) return _db;

  // 防止并发初始化
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    _dbConfig = getConfig();
    const { provider } = _dbConfig;

    if (provider === 'turso') {
      const { tursoUrl, tursoToken } = _dbConfig;
      if (!tursoUrl || !tursoToken) {
        throw new Error('Turso requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables');
      }
      const turso = new TursoDatabase(tursoUrl, tursoToken);
      await turso.initTables();
      _db = turso;
    } else {
      const { sqlitePath } = _dbConfig;
      _db = new SQLiteDatabase(sqlitePath!);
    }

    return _db;
  })();

  return _initPromise;
}

function getDb(): IDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _db;
}

function getDbConfig(): DbConfig {
  if (!_dbConfig) {
    _dbConfig = getConfig();
  }
  return _dbConfig;
}

export function isTurso(): boolean {
  return getDbConfig().provider === 'turso';
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      platforms TEXT NOT NULL DEFAULT '[]',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inspirations (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      results TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}

// --- Articles CRUD (统一异步接口) ---

export async function listArticles(): Promise<Article[]> {
  const db = await initDb();
  const rows = await db.prepare('SELECT * FROM articles ORDER BY updated_at DESC').all();
  return rows.map(parseArticle);
}

export async function getArticle(id: string): Promise<Article | null> {
  const db = await initDb();
  const row = await db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  return row ? parseArticle(row) : null;
}

export async function createArticle(data: {
  title: string;
  content: string;
  status: string;
  platforms: string[];
  tags: string[];
}): Promise<Article> {
  const db = await initDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO articles (id, title, content, status, platforms, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.title, data.content, data.status, JSON.stringify(data.platforms), JSON.stringify(data.tags), now, now);
  return (await getArticle(id))!;
}

export async function updateArticle(id: string, data: Partial<{
  title: string;
  content: string;
  status: string;
  platforms: string[];
  tags: string[];
}>): Promise<Article | null> {
  const db = await initDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { sets.push('content = ?'); values.push(data.content); }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
  if (data.platforms !== undefined) { sets.push('platforms = ?'); values.push(JSON.stringify(data.platforms)); }
  if (data.tags !== undefined) { sets.push('tags = ?'); values.push(JSON.stringify(data.tags)); }

  values.push(id);
  await db.prepare(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return await getArticle(id);
}

export async function deleteArticle(id: string): Promise<void> {
  const db = await initDb();
  await db.prepare('DELETE FROM articles WHERE id = ?').run(id);
}

function parseArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status as 'draft' | 'published',
    platforms: JSON.parse(row.platforms || '[]'),
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --- Materials CRUD ---

export async function listMaterials(): Promise<Material[]> {
  const db = await initDb();
  const rows = await db.prepare('SELECT * FROM materials ORDER BY created_at DESC').all();
  return rows.map(parseMaterial);
}

export async function createMaterial(data: {
  title: string;
  type: string;
  content: string;
}): Promise<Material> {
  const db = await initDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO materials (id, title, type, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.title, data.type, data.content, now);
  return { id, title: data.title, type: data.type as Material['type'], content: data.content, createdAt: now };
}

export async function deleteMaterial(id: string): Promise<void> {
  const db = await initDb();
  await db.prepare('DELETE FROM materials WHERE id = ?').run(id);
}

function parseMaterial(row: any): Material {
  return {
    id: row.id,
    title: row.title,
    type: row.type as 'link' | 'text' | 'image',
    content: row.content,
    createdAt: row.created_at,
  };
}

// --- Inspirations CRUD ---

export async function createInspiration(data: {
  query: string;
  results: string;
}): Promise<Inspiration> {
  const db = await initDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO inspirations (id, query, results, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, data.query, data.results, now);
  return { id, ...data, createdAt: now };
}

// --- Publications CRUD ---

export async function listPublications(articleId?: string): Promise<Publication[]> {
  const db = await initDb();
  let rows: any[];
  if (articleId) {
    rows = await db.prepare('SELECT * FROM publications WHERE article_id = ? ORDER BY created_at DESC').all(articleId);
  } else {
    rows = await db.prepare('SELECT * FROM publications ORDER BY created_at DESC').all();
  }
  return rows.map(parsePublication);
}

export async function createPublication(data: {
  articleId: string;
  platform: string;
  title: string;
  content: string;
}): Promise<Publication> {
  const db = await initDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO publications (id, article_id, platform, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.articleId, data.platform, data.title, data.content, now);
  return { id, articleId: data.articleId, platform: data.platform as Publication['platform'], title: data.title, content: data.content, createdAt: now };
}

export async function deletePublication(id: string): Promise<void> {
  const db = await initDb();
  await db.prepare('DELETE FROM publications WHERE id = ?').run(id);
}

function parsePublication(row: any): Publication {
  return {
    id: row.id,
    articleId: row.article_id,
    platform: row.platform as 'wechat' | 'xiaohongshu',
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
  };
}
