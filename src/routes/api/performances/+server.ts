import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllPerformances, getPerformancesByDate, createPerformance } from '$db/performances';
import { createLog } from '$db/operation_logs';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const date = url.searchParams.get('date');
  const performances = date ? getPerformancesByDate(date) : getAllPerformances();
  return json({ performances });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const body = await request.json();
  const id = createPerformance({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: 'performances',
    record_id: id,
    operation: 'create',
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `安排演出: 嘉宾${body.guest_id}`
  });
  return json({ id }, { status: 201 });
};