import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    budget REAL NOT NULL,
    bidding_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    handler TEXT NOT NULL,
    document_handler TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    content TEXT,
    handler TEXT NOT NULL,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS qa_records (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    answered_by TEXT NOT NULL,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id)
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL UNIQUE,
    scheduled_at DATETIME NOT NULL,
    location TEXT NOT NULL,
    evaluators TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (document_id) REFERENCES documents(id)
  );

  CREATE TABLE IF NOT EXISTS status_histories (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_projects_handler ON projects(handler);
  CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
  CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
  CREATE INDEX IF NOT EXISTS idx_status_histories_entity ON status_histories(entity_type, entity_id);
`);

const existingProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
if (existingProjects.count === 0) {
  const projects = [
    {
      id: uuidv4(),
      name: 'XX单位办公楼装修招标',
      client: 'XX单位',
      budget: 5000000,
      bidding_type: '公开招标',
      status: 'approved',
      handler: '张三',
      document_handler: '李四',
      reason: '委托单位已完成内部审批流程，项目资金已落实，需要通过招标选择装修施工单位。',
    },
    {
      id: uuidv4(),
      name: 'YY学校智慧教室设备采购',
      client: 'YY学校',
      budget: 2800000,
      bidding_type: '公开招标',
      status: 'initial_review',
      handler: '张三',
      document_handler: '王五',
      reason: '学校信息化建设项目，申请政府补贴资金，教学设备更新需求紧迫。',
    },
    {
      id: uuidv4(),
      name: 'ZZ医院信息系统升级',
      client: 'ZZ医院',
      budget: 1500000,
      bidding_type: '竞争性谈判',
      status: 'draft',
      handler: '李四',
      document_handler: '王五',
      reason: '医院现有信息系统老旧，需要升级改造，已完成前期调研和需求分析。',
    },
  ];

  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, client, budget, bidding_type, status, handler, document_handler, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHistory = db.prepare(`
    INSERT INTO status_histories (id, entity_type, entity_id, from_status, to_status, changed_by, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const project of projects) {
    insertProject.run(
      project.id,
      project.name,
      project.client,
      project.budget,
      project.bidding_type,
      project.status,
      project.handler,
      project.document_handler,
      project.reason
    );

    const statusLabels: Record<string, string> = {
      draft: '创建项目',
      initial_review: '提交初审',
      approved: '立项通过',
    };

    insertHistory.run(
      uuidv4(),
      'project',
      project.id,
      null,
      project.status,
      project.handler,
      statusLabels[project.status] || '状态更新'
    );

    if (project.status === 'approved') {
      const docId = uuidv4();
      db.prepare(`
        INSERT INTO documents (id, project_id, status, handler, content)
        VALUES (?, ?, ?, ?, ?)
      `).run(docId, project.id, 'drafting', project.document_handler, '# 招标文件\n\n## 1. 招标范围\n\n本项目包括以下内容...\n\n## 2. 投标人资格要求\n\n...');

      insertHistory.run(
        uuidv4(),
        'document',
        docId,
        null,
        'drafting',
        project.document_handler,
        '开始编制招标文件'
      );
    }
  }

  const approvedProject = projects.find(p => p.status === 'approved');
  if (approvedProject) {
    const doc = db.prepare('SELECT id FROM documents WHERE project_id = ?').get(approvedProject.id) as { id: string } | undefined;
    if (doc) {
      db.prepare(`
        INSERT INTO qa_records (id, document_id, question, answer, answered_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        doc.id,
        '招标文件第5条关于工期要求如何理解？',
        '工期要求为中标后60日历天内完成，具体以合同约定为准。',
        '李四'
      );

      db.prepare(`
        INSERT INTO evaluations (id, document_id, scheduled_at, location, evaluators, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        doc.id,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        '评标室A',
        JSON.stringify(['评委甲', '评委乙', '评委丙', '评委丁', '评委戊']),
        'pending'
      );
    }
  }
}

export default db;
