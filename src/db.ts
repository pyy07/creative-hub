import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    initTables(_db);
  }
  return _db;
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

// --- Articles ---

export function listArticles() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM articles ORDER BY updated_at DESC').all() as any[];
  return rows.map(parseArticle);
}

export function getArticle(id: string) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
  return row ? parseArticle(row) : null;
}

export function createArticle(data: {
  title: string;
  content: string;
  status: string;
  platforms: string[];
  tags: string[];
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO articles (id, title, content, status, platforms, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.title, data.content, data.status, JSON.stringify(data.platforms), JSON.stringify(data.tags), now, now);
  return getArticle(id)!;
}

export function updateArticle(id: string, data: Partial<{
  title: string;
  content: string;
  status: string;
  platforms: string[];
  tags: string[];
}>) {
  const db = getDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { sets.push('content = ?'); values.push(data.content); }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
  if (data.platforms !== undefined) { sets.push('platforms = ?'); values.push(JSON.stringify(data.platforms)); }
  if (data.tags !== undefined) { sets.push('tags = ?'); values.push(JSON.stringify(data.tags)); }

  values.push(id);
  db.prepare(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getArticle(id);
}

export function deleteArticle(id: string) {
  const db = getDb();
  db.prepare('DELETE FROM articles WHERE id = ?').run(id);
}

function parseArticle(row: any) {
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

// --- Materials ---

export function listMaterials() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM materials ORDER BY created_at DESC').all() as any[];
  return rows.map(parseMaterial);
}

export function createMaterial(data: {
  title: string;
  type: string;
  content: string;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO materials (id, title, type, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.title, data.type, data.content, now);
  return { id, ...data, createdAt: now };
}

export function deleteMaterial(id: string) {
  const db = getDb();
  db.prepare('DELETE FROM materials WHERE id = ?').run(id);
}

function parseMaterial(row: any) {
  return {
    id: row.id,
    title: row.title,
    type: row.type as 'link' | 'text' | 'image',
    content: row.content,
    createdAt: row.created_at,
  };
}

// --- Inspirations ---

export function createInspiration(data: {
  query: string;
  results: string;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO inspirations (id, query, results, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, data.query, data.results, now);
  return { id, ...data, createdAt: now };
}

// --- Publications ---

export function listPublications(articleId?: string) {
  const db = getDb();
  let rows: any[];
  if (articleId) {
    rows = db.prepare('SELECT * FROM publications WHERE article_id = ? ORDER BY created_at DESC').all(articleId) as any[];
  } else {
    rows = db.prepare('SELECT * FROM publications ORDER BY created_at DESC').all() as any[];
  }
  return rows.map(parsePublication);
}

export function createPublication(data: {
  articleId: string;
  platform: string;
  title: string;
  content: string;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO publications (id, article_id, platform, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.articleId, data.platform, data.title, data.content, now);
  return { id, ...data, createdAt: now };
}

export function deletePublication(id: string) {
  const db = getDb();
  db.prepare('DELETE FROM publications WHERE id = ?').run(id);
}

function parsePublication(row: any) {
  return {
    id: row.id,
    articleId: row.article_id,
    platform: row.platform as 'wechat' | 'xiaohongshu',
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
  };
}
