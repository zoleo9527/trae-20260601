import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'data.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    resident_name TEXT NOT NULL,
    resident_id_card TEXT NOT NULL,
    resident_phone TEXT NOT NULL,
    contract_no TEXT NOT NULL UNIQUE,
    contract_type TEXT NOT NULL,
    service_package TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    team_doctor TEXT NOT NULL,
    team_nurse TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    archive_no TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    processed_by TEXT,
    return_reason TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    archive_id TEXT,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_by_role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (archive_id) REFERENCES archives(id)
  );

  CREATE TABLE IF NOT EXISTS change_logs (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT NOT NULL,
    changed_by_role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    archive_id TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    target_role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (archive_id) REFERENCES archives(id)
  );

  CREATE TABLE IF NOT EXISTS recent_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    accessed_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
  CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
  CREATE INDEX IF NOT EXISTS idx_archives_contract_id ON archives(contract_id);
  CREATE INDEX IF NOT EXISTS idx_archives_status ON archives(status);
  CREATE INDEX IF NOT EXISTS idx_notes_contract_id ON notes(contract_id);
  CREATE INDEX IF NOT EXISTS idx_change_logs_contract_id ON change_logs(contract_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_recent_items_user_accessed ON recent_items(user_id, accessed_at);
`)

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

const contractCount = db.prepare('SELECT COUNT(*) as cnt FROM contracts').get() as { cnt: number }

if (contractCount.cnt === 0) {
  const now = new Date().toISOString()
  const contracts = [
    {
      id: genId(), resident_name: '张建国', resident_id_card: '320102198501122018',
      resident_phone: '13812345678', contract_no: 'HT20260601001', contract_type: '家庭签约',
      service_package: '基础服务包', period_start: '2026-01-01T00:00:00.000Z', period_end: '2026-12-31T23:59:59.000Z',
      team_doctor: '李明华', team_nurse: '王秀芳', status: 'draft', created_by: '李明华',
      created_at: '2026-06-01T08:00:00.000Z', updated_at: '2026-06-01T08:00:00.000Z'
    },
    {
      id: genId(), resident_name: '刘美玲', resident_id_card: '320102199203152024',
      resident_phone: '13987654321', contract_no: 'HT20260601002', contract_type: '家庭签约',
      service_package: '老年人服务包', period_start: '2026-03-01T00:00:00.000Z', period_end: '2027-02-28T23:59:59.000Z',
      team_doctor: '李明华', team_nurse: '陈晓燕', status: 'pending_review', created_by: '李明华',
      created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z'
    },
    {
      id: genId(), resident_name: '陈志强', resident_id_card: '320102197805082013',
      resident_phone: '15012348765', contract_no: 'HT20260601003', contract_type: '个人签约',
      service_package: '慢性病管理包', period_start: '2026-02-01T00:00:00.000Z', period_end: '2027-01-31T23:59:59.000Z',
      team_doctor: '赵国栋', team_nurse: '王秀芳', status: 'approved', created_by: '赵国栋',
      created_at: '2026-05-15T10:00:00.000Z', updated_at: '2026-05-20T14:00:00.000Z'
    },
    {
      id: genId(), resident_name: '王淑芬', resident_id_card: '320102194512302028',
      resident_phone: '18654321098', contract_no: 'HT20260601004', contract_type: '家庭签约',
      service_package: '老年人服务包', period_start: '2026-01-01T00:00:00.000Z', period_end: '2026-12-31T23:59:59.000Z',
      team_doctor: '李明华', team_nurse: '陈晓燕', status: 'returned', created_by: '李明华',
      created_at: '2026-04-10T08:30:00.000Z', updated_at: '2026-05-25T11:00:00.000Z'
    },
    {
      id: genId(), resident_name: '孙伟民', resident_id_card: '320102198907212017',
      resident_phone: '13711223344', contract_no: 'HT20260601005', contract_type: '家庭签约',
      service_package: '基础服务包', period_start: '2026-06-01T00:00:00.000Z', period_end: '2027-05-31T23:59:59.000Z',
      team_doctor: '赵国栋', team_nurse: '王秀芳', status: 'in_archive', created_by: '赵国栋',
      created_at: '2026-05-01T09:00:00.000Z', updated_at: '2026-05-28T16:00:00.000Z'
    },
    {
      id: genId(), resident_name: '周丽华', resident_id_card: '320102199511082026',
      resident_phone: '15899887766', contract_no: 'HT20260601006', contract_type: '个人签约',
      service_package: '孕产妇服务包', period_start: '2026-03-15T00:00:00.000Z', period_end: '2027-03-14T23:59:59.000Z',
      team_doctor: '李明华', team_nurse: '陈晓燕', status: 'in_archive', created_by: '李明华',
      created_at: '2026-03-15T10:00:00.000Z', updated_at: '2026-04-01T09:00:00.000Z'
    },
    {
      id: genId(), resident_name: '吴建平', resident_id_card: '320102196503182011',
      resident_phone: '13655443322', contract_no: 'HT20260601007', contract_type: '家庭签约',
      service_package: '慢性病管理包', period_start: '2026-01-01T00:00:00.000Z', period_end: '2026-12-31T23:59:59.000Z',
      team_doctor: '赵国栋', team_nurse: '王秀芳', status: 'closed', created_by: '赵国栋',
      created_at: '2025-06-01T08:00:00.000Z', updated_at: '2025-12-31T23:59:59.000Z'
    },
    {
      id: genId(), resident_name: '黄晓峰', resident_id_card: '320102200108152019',
      resident_phone: '17788996655', contract_no: 'HT20260601008', contract_type: '个人签约',
      service_package: '基础服务包', period_start: '2026-06-01T00:00:00.000Z', period_end: '2027-05-31T23:59:59.000Z',
      team_doctor: '李明华', team_nurse: '陈晓燕', status: 'pending_review', created_by: '李明华',
      created_at: '2026-06-02T08:00:00.000Z', updated_at: '2026-06-02T08:00:00.000Z'
    },
    {
      id: genId(), resident_name: '马秀兰', resident_id_card: '320102195208062022',
      resident_phone: '13344556677', contract_no: 'HT20260601009', contract_type: '家庭签约',
      service_package: '老年人服务包', period_start: '2026-02-01T00:00:00.000Z', period_end: '2027-01-31T23:59:59.000Z',
      team_doctor: '赵国栋', team_nurse: '王秀芳', status: 'approved', created_by: '赵国栋',
      created_at: '2026-02-01T10:00:00.000Z', updated_at: '2026-02-15T14:00:00.000Z'
    },
    {
      id: genId(), resident_name: '杨志远', resident_id_card: '320102198312252015',
      resident_phone: '15566778899', contract_no: 'HT20260601010', contract_type: '家庭签约',
      service_package: '慢性病管理包', period_start: '2026-04-01T00:00:00.000Z', period_end: '2027-03-31T23:59:59.000Z',
      team_doctor: '李明华', team_nurse: '陈晓燕', status: 'in_archive', created_by: '李明华',
      created_at: '2026-04-01T09:00:00.000Z', updated_at: '2026-05-10T11:00:00.000Z'
    }
  ]

  const insertContract = db.prepare(`
    INSERT INTO contracts (id, resident_name, resident_id_card, resident_phone, contract_no, contract_type,
      service_package, period_start, period_end, team_doctor, team_nurse, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertArchive = db.prepare(`
    INSERT INTO archives (id, contract_id, archive_no, status, processed_by, return_reason, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertNote = db.prepare(`
    INSERT INTO notes (id, contract_id, archive_id, content, source, created_by, created_by_role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertChangeLog = db.prepare(`
    INSERT INTO change_logs (id, contract_id, field, old_value, new_value, changed_by, changed_by_role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, contract_id, archive_id, type, title, summary, is_read, target_role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const seed = db.transaction(() => {
    for (const c of contracts) {
      insertContract.run(c.id, c.resident_name, c.resident_id_card, c.resident_phone, c.contract_no,
        c.contract_type, c.service_package, c.period_start, c.period_end, c.team_doctor, c.team_nurse,
        c.status, c.created_by, c.created_at, c.updated_at)
    }

    const archive1Id = genId()
    insertArchive.run(archive1Id, contracts[4].id, 'DA20260528001', 'completed', '公共卫生科张主任', null,
      '2026-06-01T10:00:00.000Z', '2026-05-28T16:00:00.000Z', '2026-06-01T10:00:00.000Z')

    const archive2Id = genId()
    insertArchive.run(archive2Id, contracts[5].id, 'DA20260401001', 'processing', '公共卫生科李科员', null, null,
      '2026-04-01T09:00:00.000Z', '2026-04-05T10:00:00.000Z')

    const archive3Id = genId()
    insertArchive.run(archive3Id, contracts[9].id, 'DA20260510001', 'returned', null, '缺少既往病史记录',
      null, '2026-05-10T11:00:00.000Z', '2026-05-15T09:00:00.000Z')

    const archive4Id = genId()
    insertArchive.run(archive4Id, contracts[2].id, 'DA20260520001', 'pending', null, null, null,
      '2026-05-20T14:00:00.000Z', '2026-05-20T14:00:00.000Z')

    insertNote.run(genId(), contracts[0].id, null, '已与家属确认签约意向，待补充材料', 'contract', '李明华', 'doctor', '2026-06-01T08:30:00.000Z')
    insertNote.run(genId(), contracts[1].id, null, '老年人服务包已选择，需护士长审核', 'contract', '李明华', 'doctor', '2026-06-01T09:15:00.000Z')
    insertNote.run(genId(), contracts[3].id, null, '档案退回，需补录过敏史信息', 'return', '公共卫生科张主任', 'public_health', '2026-05-25T11:00:00.000Z')
    insertNote.run(genId(), contracts[3].id, null, '已联系家属，正在补录中', 'contract', '李明华', 'doctor', '2026-05-26T09:00:00.000Z')
    insertNote.run(genId(), contracts[4].id, archive1Id, '健康档案已完成建档', 'archive', '公共卫生科张主任', 'public_health', '2026-06-01T10:00:00.000Z')
    insertNote.run(genId(), contracts[5].id, archive2Id, '孕产期档案正在整理中', 'archive', '公共卫生科李科员', 'public_health', '2026-04-10T14:00:00.000Z')
    insertNote.run(genId(), contracts[9].id, archive3Id, '既往病史记录缺失，需补充', 'return', '公共卫生科张主任', 'public_health', '2026-05-15T09:00:00.000Z')
    insertNote.run(genId(), contracts[2].id, archive4Id, '慢性病管理档案已提交，等待处理', 'archive', '赵国栋', 'doctor', '2026-05-20T14:30:00.000Z')
    insertNote.run(genId(), contracts[7].id, null, '年轻人基础体检签约，需审核', 'contract', '李明华', 'doctor', '2026-06-02T08:30:00.000Z')

    insertChangeLog.run(genId(), contracts[4].id, 'service_package', '基础服务包', '基础服务包+体检加项', '李明华', 'doctor', '2026-05-30T10:00:00.000Z')
    insertChangeLog.run(genId(), contracts[4].id, 'period_end', '2026-12-31T23:59:59.000Z', '2027-05-31T23:59:59.000Z', '李明华', 'doctor', '2026-05-30T10:01:00.000Z')
    insertChangeLog.run(genId(), contracts[9].id, 'service_package', '基础服务包', '慢性病管理包', '李明华', 'doctor', '2026-05-12T09:00:00.000Z')

    insertNotification.run(genId(), contracts[4].id, archive1Id, 'contract_changed', '签约信息变更通知', '孙伟民的签约服务包和期限已变更', 0, 'public_health', '2026-05-30T10:02:00.000Z')
    insertNotification.run(genId(), contracts[9].id, archive3Id, 'archive_return', '档案退回通知', '杨志远的健康档案因缺少既往病史记录被退回', 0, 'doctor', '2026-05-15T09:01:00.000Z')
    insertNotification.run(genId(), contracts[4].id, archive1Id, 'archive_completed', '档案完成通知', '孙伟民的健康档案已完成建档', 0, 'doctor', '2026-06-01T10:01:00.000Z')
    insertNotification.run(genId(), contracts[3].id, null, 'contract_returned', '签约退回通知', '王淑芬的签约档案已退回，需补录信息', 0, 'doctor', '2026-05-25T11:01:00.000Z')
    insertNotification.run(genId(), contracts[2].id, archive4Id, 'contract_changed', '签约信息变更通知', '陈志强的签约已审批通过，档案待处理', 1, 'public_health', '2026-05-20T14:01:00.000Z')
  })

  seed()
}

export default db
