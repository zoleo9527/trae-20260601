import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllGuests, createGuest } from '$db/guests';
import { createLog } from '$db/operation_logs';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const guests = getAllGuests();
  return json({ guests });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const body = await request.json();
  const id = createGuest({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: 'guests',
    record_id: id,
    operation: 'create',
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `新增嘉宾: ${body.name}`
  });
  return json({ id }, { status: 201 });
};