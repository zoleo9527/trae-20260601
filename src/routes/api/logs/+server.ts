import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllLogs, getLogsByTable, getLogsByRecord } from '$db/operation_logs';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const table = url.searchParams.get('table');
  const recordId = url.searchParams.get('recordId');
  
  let logs;
  if (table && recordId) {
    logs = getLogsByRecord(table, parseInt(recordId));
  } else if (table) {
    logs = getLogsByTable(table);
  } else {
    logs = getAllLogs();
  }
  
  return json({ logs });
};