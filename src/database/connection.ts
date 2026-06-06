import { v4 as uuidv4 } from 'uuid';
import { User, Hall, Schedule, ScreeningException, Refund } from '../types';

interface DatabaseData {
  users: User[];
  halls: Hall[];
  schedules: Schedule[];
  screeningExceptions: ScreeningException[];
  refunds: Refund[];
}

let dbInstance: DatabaseData | null = null;

export function getDatabase(): DatabaseData {
  if (!dbInstance) {
    dbInstance = {
      users: [],
      halls: [],
      schedules: [],
      screeningExceptions: [],
      refunds: []
    };
    console.log('内存数据库初始化成功');
  }
  return dbInstance;
}

export function runQuery(sql: string, params: any[] = []): { lastID: any; changes: number } {
  const db = getDatabase();
  const sqlLower = sql.toLowerCase().trim();

  if (sqlLower.startsWith('insert')) {
    const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i);
    if (match) {
      const tableName = match[1];
      const columns = match[2].split(',').map(c => c.trim());
      
      let newId = uuidv4();
      const newRecord: any = {};
      
      columns.forEach((col, index) => {
        if (col === 'id' && params[index] === undefined) {
          newRecord[col] = newId;
        } else {
          newRecord[col] = params[index];
        }
      });

      if (tableName === 'users') db.users.push(newRecord as User);
      else if (tableName === 'halls') db.halls.push(newRecord as Hall);
      else if (tableName === 'schedules') db.schedules.push(newRecord as Schedule);
      else if (tableName === 'screening_exceptions') db.screeningExceptions.push(newRecord as ScreeningException);
      else if (tableName === 'refunds') db.refunds.push(newRecord as Refund);

      return { lastID: newRecord.id || newId, changes: 1 };
    }
  } else if (sqlLower.startsWith('update')) {
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (match) {
      const tableName = match[1];
      const setClauses = match[2];
      const whereClause = match[3];

      const idMatch = whereClause.match(/id\s*=\s*\?/i);
      let targetId: string | null = null;
      if (idMatch) {
        targetId = params[params.length - 1];
      }

      const updates = setClauses.split(',').map(s => {
        const [col, val] = s.trim().split('=').map(p => p.trim());
        return { column: col, value: val };
      });

      let changes = 0;
      let list: any[] = [];
      
      if (tableName === 'screening_exceptions') list = db.screeningExceptions;
      else if (tableName === 'refunds') list = db.refunds;
      else if (tableName === 'users') list = db.users;
      else if (tableName === 'halls') list = db.halls;
      else if (tableName === 'schedules') list = db.schedules;

      let paramIdx = 0;
      for (const record of list) {
        if (targetId && record.id === targetId) {
          updates.forEach(u => {
            const paramVal = params[paramIdx];
            paramIdx++;
            if (u.value === 'COALESCE(?, resolution)') {
              if (paramVal !== null) record.resolution = paramVal;
            } else if (u.value === '?') {
              (record as any)[u.column] = paramVal;
            }
          });
          changes++;
          break;
        }
      }

      return { lastID: targetId, changes };
    }
  }

  return { lastID: null, changes: 0 };
}

function mapRowToCamelCase(row: any): any {
  if (!row) return row;
  const result: any = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

export function getQuery<T = any>(sql: string, params: any[] = []): T | undefined {
  const result = allQuery(sql, params);
  return result[0] as T | undefined;
}

export function allQuery<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const sqlLower = sql.toLowerCase();

  if (sqlLower.includes('from screening_exceptions')) {
    let results = [...db.screeningExceptions];
    
    if (sqlLower.includes('where')) {
      const whereMatch = sql.match(/WHERE\s+(.+?)\s*(ORDER|LIMIT|$)/i);
      if (whereMatch) {
        const whereStr = whereMatch[1];
        let paramIdx = 0;
        
        if (whereStr.includes('status = ?')) {
          results = results.filter(r => r.status === params[paramIdx]);
          paramIdx++;
        }
        if (whereStr.includes('type = ?')) {
          results = results.filter(r => r.type === params[paramIdx]);
          paramIdx++;
        }
        if (whereStr.includes('schedule_id = ?')) {
          results = results.filter(r => r.scheduleId === params[paramIdx]);
          paramIdx++;
        }
        if (whereStr.includes('id = ?')) {
          results = results.filter(r => r.id === params[paramIdx]);
          paramIdx++;
        }
      }
    }

    if (sqlLower.includes('group by status')) {
      const counts: Record<string, number> = {};
      db.screeningExceptions.forEach(e => {
        counts[e.status] = (counts[e.status] || 0) + 1;
      });
      return Object.entries(counts).map(([status, count]) => ({ status, count })) as T[];
    }

    if (sqlLower.includes('order by reported_at desc')) {
      results.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    }

    if (sqlLower.includes('limit')) {
      const limitMatch = sql.match(/LIMIT\s+(\d+)\s+OFFSET\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        const offset = parseInt(limitMatch[2]);
        results = results.slice(offset, offset + limit);
      }
    }

    if (sqlLower.includes('count(*)')) {
      return [{ total: results.length }] as T[];
    }

    return results as T[];
  }

  if (sqlLower.includes('from refunds')) {
    let results = [...db.refunds];
    
    if (sqlLower.includes('where')) {
      let paramIdx = 0;
      if (sqlLower.includes('status = ?')) {
        results = results.filter(r => r.status === params[paramIdx]);
        paramIdx++;
      }
      if (sqlLower.includes('exception_id = ?')) {
        results = results.filter(r => r.exceptionId === params[paramIdx]);
        paramIdx++;
      }
      if (sqlLower.includes('schedule_id = ?')) {
        results = results.filter(r => r.scheduleId === params[paramIdx]);
        paramIdx++;
      }
      if (sqlLower.includes('id = ?')) {
        results = results.filter(r => r.id === params[paramIdx]);
        paramIdx++;
      }
      if (sqlLower.includes('status IN (?, ?, ?)')) {
        const statuses = [params[0], params[1], params[2]];
        results = results.filter(r => statuses.includes(r.status));
      }
      if (sqlLower.includes('user_name like')) {
        const keyword = params[paramIdx] as string;
        const cleanKeyword = keyword.replace(/%/g, '');
        results = results.filter(r => 
          r.userName.includes(cleanKeyword) || 
          r.phone.includes(cleanKeyword) || 
          r.orderId.includes(cleanKeyword)
        );
      }
    }

    if (sqlLower.includes('group by status')) {
      const stats: Record<string, { count: number; amount: number }> = {};
      db.refunds.forEach(r => {
        if (!stats[r.status]) stats[r.status] = { count: 0, amount: 0 };
        stats[r.status].count++;
        stats[r.status].amount += r.totalAmount;
      });
      return Object.entries(stats).map(([status, data]) => ({ status, count: data.count, amount: data.amount })) as T[];
    }

    if (sqlLower.includes('order by applied_at desc')) {
      results.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    }

    if (sqlLower.includes('limit')) {
      const limitMatch = sql.match(/LIMIT\s+(\d+)\s+OFFSET\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        const offset = parseInt(limitMatch[2]);
        results = results.slice(offset, offset + limit);
      }
    }

    if (sqlLower.includes('count(*)')) {
      return [{ total: results.length }] as T[];
    }

    if (sqlLower.includes('left join schedules')) {
      results = results.map(r => {
        const schedule = db.schedules.find(s => s.id === r.scheduleId);
        return {
          ...r,
          movieName: schedule?.movieName,
          startTime: schedule?.startTime
        };
      });
    }

    return results as T[];
  }

  return [];
}

export function initializeDatabase(): void {
  getDatabase();
  console.log('数据库初始化完成');
}
