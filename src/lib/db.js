import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'data.json');

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function createInitialData() {
  const data = {
    pawn_orders: [],
    status_transitions: [],
    notifications: [],
    attachments: [],
    _seq: { pawn_orders: 0, status_transitions: 0, notifications: 0, attachments: 0 }
  };

  const orders = [
    {
      order_no: 'PD20260601001', customer_name: '张三', customer_phone: '13800138001',
      item_name: '黄金项链', item_desc: '24K金，约35克，周大福品牌',
      appraised_value: 28000, loan_amount: 20000,
      pawn_date: '2026-05-01', due_date: '2026-06-01',
      current_status: 'OVERDUE_PENDING',
      transition: { from_status: 'NORMAL', to_status: 'OVERDUE_PENDING', action_type: 'INITIATE_OVERDUE', actor_role: 'APPRAISER', actor_name: '李评估', notes: '到期未赎，柜台评估师李评估确认逾期，当物外观完好无损坏' }
    },
    {
      order_no: 'PD20260515002', customer_name: '李四', customer_phone: '13800138002',
      item_name: '劳力士手表', item_desc: '潜航者系列，绿水鬼，9成新',
      appraised_value: 85000, loan_amount: 60000,
      pawn_date: '2026-04-15', due_date: '2026-05-15',
      current_status: 'OVERDUE_CONFIRMED',
      transition: { from_status: 'OVERDUE_PENDING', to_status: 'OVERDUE_CONFIRMED', action_type: 'CONFIRM_OVERDUE', actor_role: 'APPRAISER', actor_name: '李评估', notes: '库管王核验：手表走时正常，表壳无明显划痕，封签完好' }
    },
    {
      order_no: 'PD20260401003', customer_name: '王五', customer_phone: '13800138003',
      item_name: '翡翠手镯', item_desc: '冰种飘绿，内径58mm，国家级鉴定证书',
      appraised_value: 150000, loan_amount: 100000,
      pawn_date: '2026-03-01', due_date: '2026-04-01',
      current_status: 'STORAGE_CHECKED',
      transition: { from_status: 'OVERDUE_CONFIRMED', to_status: 'STORAGE_CHECKED', action_type: 'STORAGE_AUDIT', actor_role: 'STORAGE', actor_name: '王库管', notes: '二次库房清点：证书齐全，手镯无裂纹，封条完整' }
    },
    {
      order_no: 'PD20260315004', customer_name: '赵六', customer_phone: '13800138004',
      item_name: '钻石戒指', item_desc: '1克拉，D色VVS1，GIA证书',
      appraised_value: 120000, loan_amount: 80000,
      pawn_date: '2026-02-15', due_date: '2026-03-15',
      current_status: 'FINANCIAL_SETTLED',
      transition: { from_status: 'STORAGE_CHECKED', to_status: 'FINANCIAL_SETTLED', action_type: 'FINANCIAL_SETTLE', actor_role: 'FINANCE', actor_name: '陈财务', notes: '财务核算：逾期61天，违约金累计￥4,880，待处置底价￥84,880' }
    },
    {
      order_no: 'PD20260101005', customer_name: '孙七', customer_phone: '13800138005',
      item_name: '和田玉把件', item_desc: '羊脂玉，约120克，大师工艺',
      appraised_value: 65000, loan_amount: 45000,
      pawn_date: '2025-12-01', due_date: '2026-01-01',
      current_status: 'CUSTOMER_NOTIFIED',
      transition: { from_status: 'FINANCIAL_SETTLED', to_status: 'CUSTOMER_NOTIFIED', action_type: 'NOTIFY_CUSTOMER', actor_role: 'APPRAISER', actor_name: '李评估', notes: '多渠道通知完成，客户微信确认知晓处置事宜' }
    },
    {
      order_no: 'PD20260610006', customer_name: '周八', customer_phone: '13800138006',
      item_name: '银币收藏套装', item_desc: '2008奥运纪念金币套装，原盒原证',
      appraised_value: 45000, loan_amount: 30000,
      pawn_date: '2026-05-10', due_date: '2026-06-10',
      current_status: 'NORMAL',
      transition: null
    }
  ];

  orders.forEach((order, idx) => {
    const orderId = idx + 1;
    data._seq.pawn_orders = orderId;
    const created = now();
    data.pawn_orders.push({
      id: orderId,
      ...order,
      transition: undefined,
      created_at: created,
      updated_at: created
    });
    if (order.transition) {
      const tId = ++data._seq.status_transitions;
      data.status_transitions.push({
        id: tId,
        order_id: orderId,
        from_status: order.transition.from_status,
        to_status: order.transition.to_status,
        actor_role: order.transition.actor_role,
        actor_name: order.transition.actor_name,
        action_type: order.transition.action_type,
        notes: order.transition.notes,
        has_alert: 0,
        alert_message: null,
        created_at: created
      });
    }
  });

  data.notifications = [
    { id: 1, order_id: 5, transition_id: 5, notify_method: 'FORMAL', notify_channel: 'WECHAT',
      content: '孙七先生您好，您于2025-12-01典当的和田玉把件已逾期164天，请于收到通知后7日内前来办理赎当或续当手续，逾期我方将按合同约定处置当物。',
      sent_by_role: 'APPRAISER', sent_by_name: '李评估', customer_ack: 1, ack_method: 'WECHAT',
      ack_notes: '客户微信回复"知道了，下周过来处理"', sent_at: '2026-06-10 10:00:00', ack_at: '2026-06-10 14:30:00' },
    { id: 2, order_id: 5, transition_id: 5, notify_method: 'FORMAL', notify_channel: 'SMS',
      content: '【XX典当】孙七先生，您典当的和田玉把件已逾期，请尽快处理。询：400-xxx-xxxx',
      sent_by_role: 'APPRAISER', sent_by_name: '李评估', customer_ack: 0, ack_method: null,
      ack_notes: null, sent_at: '2026-06-10 10:05:00', ack_at: null },
    { id: 3, order_id: 5, transition_id: 5, notify_method: 'FORMAL', notify_channel: 'PHONE',
      content: '电话沟通记录：客户表示资金紧张，希望再宽限15天',
      sent_by_role: 'APPRAISER', sent_by_name: '李评估', customer_ack: 1, ack_method: 'PHONE',
      ack_notes: '通话时长3分20秒，客户确认宽限期', sent_at: '2026-06-11 10:15:00', ack_at: '2026-06-11 10:18:20' }
  ];
  data._seq.notifications = 3;

  data.attachments = [
    { id: 1, order_id: 5, transition_id: 5, notification_id: null, file_name: '微信通知截图.jpg',
      file_type: 'IMG', file_size: 0, uploaded_by_role: 'APPRAISER', uploaded_by_name: '李评估',
      storage_path: null, is_placeholder: 1, created_at: '2026-06-10 14:35:00' },
    { id: 2, order_id: 2, transition_id: 2, notification_id: null, file_name: '手表核验照片-正面.jpg',
      file_type: 'IMG', file_size: 0, uploaded_by_role: 'STORAGE', uploaded_by_name: '王库管',
      storage_path: null, is_placeholder: 1, created_at: '2026-06-08 09:20:00' }
  ];
  data._seq.attachments = 2;

  return data;
}

let store = null;

function load() {
  if (store) return store;
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      store = JSON.parse(raw);
    } else {
      store = createInitialData();
      save();
    }
  } catch (e) {
    store = createInitialData();
    save();
  }
  return store;
}

function save() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

function insert(table, row) {
  load();
  const id = ++store._seq[table];
  const created = now();
  const fullRow = { id, ...row, created_at: row.created_at || created };
  if (table === 'pawn_orders') fullRow.updated_at = row.updated_at || created;
  store[table].push(fullRow);
  save();
  return fullRow;
}

function update(table, id, row) {
  load();
  const idx = store[table].findIndex(r => r.id === id);
  if (idx >= 0) {
    if (table === 'pawn_orders') row.updated_at = now();
    store[table][idx] = { ...store[table][idx], ...row };
    save();
    return store[table][idx];
  }
  return null;
}

function query(table, whereFn, orderBy = null, limit = null) {
  load();
  let rows = store[table].slice();
  if (whereFn) rows = rows.filter(whereFn);
  if (orderBy) rows.sort(orderBy);
  if (limit) rows = rows.slice(0, limit);
  return rows;
}

function findOne(table, whereFn) {
  load();
  return store[table].find(whereFn) || null;
}

export const db = {
  transaction(fn) {
    load();
    const result = fn({
      prepare: (sql) => ({
        run: (...args) => {
          if (sql.startsWith('INSERT')) {
            const tableMatch = sql.match(/INTO\s+(\w+)/);
            const colsMatch = sql.match(/\(([^)]+)\)/);
            const table = tableMatch[1];
            const cols = colsMatch[1].split(',').map(s => s.trim());
            const row = {};
            cols.forEach((c, i) => { row[c] = args[i]; });
            const inserted = insert(table, row);
            return { lastInsertRowid: inserted.id, changes: 1 };
          } else if (sql.startsWith('UPDATE')) {
            const tableMatch = sql.match(/UPDATE\s+(\w+)/);
            const setMatch = sql.match(/SET\s+([^W]+)/);
            const whereMatch = sql.match(/WHERE\s+(.+)/);
            const table = tableMatch[1];
            const sets = setMatch[1].split(',').map(s => s.trim());
            const setCols = []; const setVals = [];
            sets.forEach(s => {
              const [col, , placeholder] = s.split(' ').filter(Boolean);
              setCols.push(col); setVals.push(placeholder === '?' ? null : placeholder);
            });
            const idIdx = setCols.includes('id') ? setCols.indexOf('id') : -1;
            let whereId = null;
            if (whereMatch && whereMatch[1].includes('id = ?')) {
              const argStart = setVals.filter(v => v === null).length;
              whereId = args[args.length - 1];
            }
            const argIdx = { i: 0 };
            const row = {};
            setCols.forEach((c) => {
              if (c === 'updated_at') {
                row[c] = args[argIdx.i++] ?? now();
              } else {
                row[c] = args[argIdx.i++];
              }
            });
            if (whereId) {
              const updated = update(table, whereId, row);
              return { changes: updated ? 1 : 0 };
            }
            return { changes: 0 };
          } else if (sql.startsWith('SELECT')) {
            const tableMatch = sql.match(/FROM\s+(\w+)/);
            const whereMatch = sql.match(/WHERE\s+([^O]+)/);
            const countMatch = sql.match(/COUNT\(\*\)/);
            const table = tableMatch ? tableMatch[1] : null;
            if (countMatch) {
              let cnt = table ? store[table].length : 0;
              if (whereMatch) {
                const whereStr = whereMatch[1].trim();
                if (whereStr.includes('IN')) {
                  cnt = store[table].length;
                }
              }
              return { get: () => ({ cnt }) };
            }
            return { get: () => null, all: () => [] };
          }
          return { lastInsertRowid: 0, changes: 0 };
        },
        get: (...args) => {
          const tableMatch = sql.match(/FROM\s+(\w+)/);
          const table = tableMatch ? tableMatch[1] : null;
          const whereMatch = sql.match(/WHERE\s+(.+)/);
          if (!table) return null;
          if (whereMatch && whereMatch[1].includes('id = ?')) {
            return findOne(table, r => r.id === args[0]);
          } else if (whereMatch && whereMatch[1].includes('order_no = ?')) {
            return findOne(table, r => r.order_no === args[0]);
          }
          return null;
        },
        all: (...args) => {
          const tableMatch = sql.match(/FROM\s+(\w+)/);
          const table = tableMatch ? tableMatch[1] : null;
          if (!table) return [];
          const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/);
          const orderMatch = sql.match(/ORDER BY\s+(.+)/);
          let rows = query(table);
          if (whereMatch) {
            const whereStr = whereMatch[1].trim();
            if (whereStr.includes('IN (')) {
              const inMatch = whereStr.match(/IN\s*\(\s*\?\s*(,\s*\?\s*)*\)/);
              const colMatch = whereStr.match(/(\w+)\s+IN/);
              if (colMatch && inMatch) {
                const col = colMatch[1];
                const placeholders = whereStr.match(/\?/g).length;
                const vals = args.slice(0, placeholders);
                rows = rows.filter(r => vals.includes(r[col]));
              }
            } else if (whereStr.includes('order_id = ?')) {
              rows = rows.filter(r => r.order_id === args[0]);
            } else if (whereStr.includes('notification_id = ?')) {
              rows = rows.filter(r => r.notification_id === args[0]);
            }
          }
          if (orderMatch) {
            const orderStr = orderMatch[1].trim();
            if (orderStr.includes('created_at') || orderStr.includes('sent_at')) {
              const isDesc = orderStr.includes('DESC');
              const field = orderStr.includes('sent_at') ? 'sent_at' : 'created_at';
              rows.sort((a, b) => {
                const cmp = new Date(a[field]) - new Date(b[field]);
                return isDesc ? -cmp : cmp;
              });
            }
          }
          return rows;
        }
      })
    });
    save();
    return result;
  },
  prepare(sql) {
    load();
    if (sql.startsWith('INSERT')) {
      const tableMatch = sql.match(/INTO\s+(\w+)/);
      const colsMatch = sql.match(/\(([^)]+)\)/);
      const table = tableMatch[1];
      const cols = colsMatch[1].split(',').map(s => s.trim());
      return {
        run: (...args) => {
          const row = {};
          cols.forEach((c, i) => { row[c] = args[i]; });
          const inserted = insert(table, row);
          return { lastInsertRowid: inserted.id, changes: 1 };
        },
        get: (...args) => {
          const row = {};
          cols.forEach((c, i) => { row[c] = args[i]; });
          const inserted = insert(table, row);
          return findOne(table, r => r.id === inserted.id);
        }
      };
    }
    if (sql.startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+(\w+)/);
      const setMatch = sql.match(/SET\s+([^W]+)/);
      const whereMatch = sql.match(/WHERE\s+(.+)/);
      const table = tableMatch[1];
      const setStr = setMatch[1];
      const setParts = setStr.split(',').map(s => s.trim());
      const setCols = [];
      setParts.forEach(s => {
        const [col] = s.split(' ').filter(Boolean);
        setCols.push(col);
      });
      return {
        run: (...args) => {
          const nCols = setCols.length;
          const whereId = args[nCols];
          const row = {};
          setCols.forEach((c, i) => { row[c] = args[i]; });
          const updated = update(table, whereId, row);
          return { changes: updated ? 1 : 0 };
        }
      };
    }
    if (sql.startsWith('SELECT COUNT')) {
      const tableMatch = sql.match(/FROM\s+(\w+)/);
      const whereMatch = sql.match(/WHERE\s+(.+)/);
      const table = tableMatch ? tableMatch[1] : null;
      const countStar = sql.includes('COUNT(*) as cnt') || sql.includes('COUNT(*)');
      return {
        get: (...args) => {
          if (!table) return { cnt: 0 };
          let rows = query(table);
          if (whereMatch) {
            const whereStr = whereMatch[1].trim();
            if (whereStr.includes('NOT IN')) {
              const notInMatch = whereStr.match(/NOT\s+IN\s*\(([^)]+)\)/);
              const colMatch = whereStr.match(/(\w+)\s+NOT\s+IN/);
              if (colMatch && notInMatch) {
                const col = colMatch[1];
                const vals = notInMatch[1].split(',').map(s => s.trim().replace(/'/g, ''));
                rows = rows.filter(r => !vals.includes(r[col]));
              }
            } else if (whereStr.includes('IN')) {
              const inMatch = whereStr.match(/IN\s*\(([^)]+)\)/);
              const colMatch = whereStr.match(/(\w+)\s+IN/);
              if (colMatch && inMatch) {
                const col = colMatch[1];
                const vals = inMatch[1].split(',').map(s => s.trim().replace(/'/g, ''));
                rows = rows.filter(r => vals.includes(r[col]));
              }
            } else if (whereStr.includes('has_alert = ?')) {
              rows = rows.filter(r => r.has_alert === args[0]);
            }
          }
          if (sql.includes('GROUP BY')) {
            const groupCol = sql.match(/GROUP BY\s+(\w+)/)?.[1];
            if (groupCol) {
              const groups = {};
              query(table).forEach(r => {
                const k = r[groupCol];
                groups[k] = (groups[k] || 0) + 1;
              });
              return Object.entries(groups).map(([k, v]) => ({ [groupCol]: k, cnt: v }));
            }
          }
          return { cnt: rows.length };
        },
        all: () => {
          const groupCol = sql.match(/GROUP BY\s+(\w+)/)?.[1];
          if (groupCol && table) {
            const groups = {};
            query(table).forEach(r => {
              const k = r[groupCol];
              groups[k] = (groups[k] || 0) + 1;
            });
            return Object.entries(groups).map(([k, v]) => ({ [groupCol]: k, cnt: v }));
          }
          return [];
        }
      };
    }
    if (sql.startsWith('SELECT')) {
      const tableMatch = sql.match(/FROM\s+(\w+)/);
      const table = tableMatch ? tableMatch[1] : null;
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/);
      const orderMatch = sql.match(/ORDER BY\s+(.+?)(?:LIMIT|$)/);
      const limitMatch = sql.match(/LIMIT\s+(\d+)/);
      return {
        get: (...args) => {
          if (!table) return null;
          let rows = query(table);
          if (whereMatch) {
            const whereStr = whereMatch[1].trim();
            if (whereStr.includes('id = ?')) {
              rows = rows.filter(r => r.id === args[0]);
            } else if (whereStr.includes('order_no = ?')) {
              rows = rows.filter(r => r.order_no === args[0]);
            }
          }
          return rows[0] || null;
        },
        all: (...args) => {
          if (!table) return [];
          let rows = query(table);
          if (whereMatch) {
            const whereStr = whereMatch[1].trim();
            if (whereStr.includes('order_id = ?')) {
              rows = rows.filter(r => r.order_id === args[0]);
            } else if (whereStr.includes('notification_id = ?')) {
              rows = rows.filter(r => r.notification_id === args[0]);
            }
          }
          if (orderMatch) {
            const orderStr = orderMatch[1].trim();
            const field = orderStr.includes('sent_at') ? 'sent_at' :
                          orderStr.includes('updated_at') ? 'updated_at' :
                          orderStr.includes('created_at') ? 'created_at' : 'id';
            const isDesc = orderStr.includes('DESC');
            rows.sort((a, b) => {
              const va = a[field]; const vb = b[field];
              if (!va || !vb) return 0;
              const cmp = new Date(va) - new Date(vb);
              return isDesc ? -cmp : cmp;
            });
          }
          if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1]));
          return rows;
        }
      };
    }
    return {
      run: () => ({ lastInsertRowid: 0, changes: 0 }),
      get: () => null,
      all: () => []
    };
  },
  exec(sql) {
    load();
  },
  pragma() {}
};

export default db;
