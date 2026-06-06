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

function toCamelCase(snakeStr: string): string {
  return snakeStr.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(camelStr: string): string {
  return camelStr.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function convertKeysToCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item));
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    result[toCamelCase(key)] = obj[key];
  }
  return result;
}

function convertKeysToSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToSnakeCase(item));
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    result[toSnakeCase(key)] = obj[key];
  }
  return result;
}

export function runQuery(sql: string, params: any[] = []): { lastID: any; changes: number } {
  const db = getDatabase();
  const sqlLower = sql.toLowerCase().trim();

  if (sqlLower.startsWith('insert')) {
    const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i);
    if (match) {
      const tableName = match[1];
      const columns = match[2].split(',').map(c => c.trim());
      
      const id = params[columns.indexOf('id')] !== undefined ? params[columns.indexOf('id')] : uuidv4();
      const newRecord: any = {};
      
      columns.forEach((col, index) => {
        const camelKey = toCamelCase(col);
        newRecord[camelKey] = params[index];
      });
      
      if (columns.indexOf('id') === -1 || newRecord.id === undefined) {
        newRecord.id = id;
      }

      if (tableName === 'users') db.users.push(convertKeysToCamelCase(newRecord) as User);
      else if (tableName === 'halls') db.halls.push(convertKeysToCamelCase(newRecord) as Hall);
      else if (tableName === 'schedules') db.schedules.push(convertKeysToCamelCase(newRecord) as Schedule);
      else if (tableName === 'screening_exceptions') db.screeningExceptions.push(convertKeysToCamelCase(newRecord) as ScreeningException);
      else if (tableName === 'refunds') db.refunds.push(convertKeysToCamelCase(newRecord) as Refund);

      return { lastID: newRecord.id, changes: 1 };
    }
  } else if (sqlLower.startsWith('update')) {
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (match) {
      const tableName = match[1];
      const setClausesStr = match[2];
      const whereClause = match[3];

      const idMatch = whereClause.match(/id\s*=\s*\?/i);
      let targetId: string | null = null;
      if (idMatch) {
        targetId = params[params.length - 1];
      }

      const setMatches: string[] = [];
      let depth = 0;
      let currentClause = '';
      for (let i = 0; i < setClausesStr.length; i++) {
        const char = setClausesStr[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
          setMatches.push(currentClause.trim());
          currentClause = '';
          continue;
        }
        currentClause += char;
      }
      if (currentClause.trim()) {
        setMatches.push(currentClause.trim());
      }

      const updates: { column: string; value: any; isCoalesceResolution?: boolean }[] = [];
      
      let paramIdx = 0;
      for (const clause of setMatches) {
        if (clause.includes('COALESCE(?, resolution)')) {
          updates.push({ column: 'resolution', value: params[paramIdx], isCoalesceResolution: true });
          paramIdx++;
        } else {
          const eqMatch = clause.match(/(\w+)\s*=\s*\?/i);
          if (eqMatch) {
            updates.push({ column: eqMatch[1], value: params[paramIdx] });
            paramIdx++;
          }
        }
      }

      let changes = 0;
      let list: any[] = [];
      
      if (tableName === 'screening_exceptions') list = db.screeningExceptions;
      else if (tableName === 'refunds') list = db.refunds;
      else if (tableName === 'users') list = db.users;
      else if (tableName === 'halls') list = db.halls;
      else if (tableName === 'schedules') list = db.schedules;

      for (const record of list) {
        if (targetId && record.id === targetId) {
          updates.forEach(u => {
            const camelKey = toCamelCase(u.column);
            if (u.isCoalesceResolution) {
              if (u.value !== null && u.value !== undefined) {
                (record as any)[camelKey] = u.value;
              }
            } else {
              (record as any)[camelKey] = u.value;
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

export function getQuery<T = any>(sql: string, params: any[] = []): T | undefined {
  const result = allQuery(sql, params);
  return result[0] as T | undefined;
}

function parseWhereConditions(whereStr: string, params: any[]): { key?: string; op: string; value: any; multiKeys?: string[]; isMultiLike?: boolean }[] {
  const conditions: { key?: string; op: string; value: any; multiKeys?: string[]; isMultiLike?: boolean }[] = [];
  let paramIdx = 0;
  
  const clauses = whereStr.split(/\s+AND\s+(?![^()]*\))/i);
  for (const clause of clauses) {
    let trimmed = clause.trim();
    
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      trimmed = trimmed.slice(1, -1);
    }
    
    if (trimmed.includes('IN (?, ?, ?)')) {
      const keyMatch = trimmed.match(/(\w+)\s+IN/i);
      if (keyMatch) {
        const values = [params[paramIdx], params[paramIdx + 1], params[paramIdx + 2]];
        conditions.push({ key: toCamelCase(keyMatch[1]), op: 'IN', value: values });
        paramIdx += 3;
      }
    } else if (trimmed.toUpperCase().includes('LIKE') && trimmed.toUpperCase().includes('OR')) {
      const likeMatches = trimmed.match(/(\w+)\s+LIKE\s*\?/gi);
      if (likeMatches && likeMatches.length > 0) {
        const keys = likeMatches.map(m => {
          const keyMatch = m.match(/(\w+)\s+LIKE/i);
          return toCamelCase(keyMatch![1]);
        });
        const keyword = params[paramIdx];
        conditions.push({ op: 'MULTI_LIKE', value: keyword, multiKeys: keys, isMultiLike: true });
        paramIdx += keys.length;
      }
    } else if (trimmed.includes('LIKE ?')) {
      const keyMatch = trimmed.match(/(\w+)\s+LIKE/i);
      if (keyMatch) {
        conditions.push({ key: toCamelCase(keyMatch[1]), op: 'LIKE', value: params[paramIdx] });
        paramIdx++;
      }
    } else if (trimmed.includes('>=')) {
      const keyMatch = trimmed.match(/(\w+)\s+>=/);
      if (keyMatch) {
        conditions.push({ key: toCamelCase(keyMatch[1]), op: '>=', value: params[paramIdx] });
        paramIdx++;
      }
    } else if (trimmed.includes('<=')) {
      const keyMatch = trimmed.match(/(\w+)\s+<=/);
      if (keyMatch) {
        let value = params[paramIdx];
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          value = `${value} 23:59:59`;
        }
        conditions.push({ key: toCamelCase(keyMatch[1]), op: '<=', value: value });
        paramIdx++;
      }
    } else if (trimmed.includes('=')) {
      const keyMatch = trimmed.match(/(\w+)\s*=/);
      if (keyMatch) {
        conditions.push({ key: toCamelCase(keyMatch[1]), op: '=', value: params[paramIdx] });
        paramIdx++;
      }
    }
  }
  
  return conditions;
}

function applyConditions<T>(records: T[], conditions: { key?: string; op: string; value: any; multiKeys?: string[]; isMultiLike?: boolean }[]): T[] {
  return records.filter(record => {
    return conditions.every(cond => {
      if (cond.isMultiLike && cond.multiKeys) {
        const searchValue = String(cond.value).replace(/%/g, '');
        return cond.multiKeys.some(key => {
          const recordValue = (record as any)[key];
          return String(recordValue || '').includes(searchValue);
        });
      }
      
      const recordValue = (record as any)[cond.key!];
      
      if (cond.op === '=') {
        return recordValue === cond.value;
      } else if (cond.op === '>=') {
        return new Date(recordValue).getTime() >= new Date(cond.value).getTime();
      } else if (cond.op === '<=') {
        return new Date(recordValue).getTime() <= new Date(cond.value).getTime();
      } else if (cond.op === 'IN') {
        return cond.value.includes(recordValue);
      } else if (cond.op === 'LIKE') {
        const searchValue = String(cond.value).replace(/%/g, '');
        return String(recordValue || '').includes(searchValue);
      }
      return true;
    });
  });
}

export function allQuery<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const sqlLower = sql.toLowerCase();

  if (sqlLower.includes('from screening_exceptions')) {
    let results = [...db.screeningExceptions] as T[];
    
    if (sqlLower.includes('where')) {
      const whereMatch = sql.match(/WHERE\s+(.+?)\s*(ORDER|LIMIT|GROUP|$)/i);
      if (whereMatch) {
        const whereStr = whereMatch[1];
        const conditions = parseWhereConditions(whereStr, params);
        results = applyConditions(results, conditions);
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
      results.sort((a: any, b: any) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
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

    return results;
  }

  if (sqlLower.includes('from refunds')) {
    let results = [...db.refunds] as T[];
    
    if (sqlLower.includes('where')) {
      const whereMatch = sql.match(/WHERE\s+(.+?)\s*(ORDER|LIMIT|GROUP|$)/i);
      if (whereMatch) {
        const whereStr = whereMatch[1];
        const conditions = parseWhereConditions(whereStr, params);
        results = applyConditions(results, conditions);
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
      results.sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
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
      results = (results as any[]).map(r => {
        const schedule = db.schedules.find(s => s.id === r.scheduleId);
        return {
          ...r,
          movieName: schedule?.movieName,
          startTime: schedule?.startTime
        };
      }) as T[];
    }

    return results;
  }

  return [];
}

export function initializeDatabase(): void {
  getDatabase();
  console.log('数据库初始化完成');
}
