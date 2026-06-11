import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, '../../data/database.sqlite');

mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS completion_documents (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK(doc_type IN ('布线图', '材料领用单', '现场照片', '测试报告', '验收记录')),
    status TEXT NOT NULL CHECK(status IN ('待整理', '待审核', '待签认', '已签认', '已驳回')) DEFAULT '待整理',
    assignee_name TEXT NOT NULL,
    assignee_role TEXT NOT NULL CHECK(assignee_role IN ('项目负责人', '施工班组长', '资料员')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS remarks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES completion_documents(id),
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    author_role TEXT NOT NULL,
    stage TEXT NOT NULL CHECK(stage IN ('整理', '审核', '签认', '异常处理')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exceptions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES completion_documents(id),
    category TEXT NOT NULL CHECK(category IN ('资料缺失', '照片不符', '材料领用差异', '布线图错误', '其他')),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('待处理', '处理中', '已解决', '已升级')) DEFAULT '待处理',
    handler TEXT,
    handler_role TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS exception_records (
    id TEXT PRIMARY KEY,
    exception_id TEXT NOT NULL REFERENCES exceptions(id),
    action TEXT NOT NULL,
    operator TEXT NOT NULL,
    operator_role TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sign_offs (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES completion_documents(id),
    client_name TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('已签认', '已驳回')),
    comment TEXT,
    signed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_documents_status ON completion_documents(status);
  CREATE INDEX IF NOT EXISTS idx_documents_assignee ON completion_documents(assignee_role);
  CREATE INDEX IF NOT EXISTS idx_remarks_document ON remarks(document_id);
  CREATE INDEX IF NOT EXISTS idx_exceptions_document ON exceptions(document_id);
  CREATE INDEX IF NOT EXISTS idx_signoffs_document ON sign_offs(document_id);
`);

export default db;
