import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGuestById, updateGuest, deleteGuest } from '$db/guests';
import { createLog } from '$db/operation_logs';

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  const guest = getGuestById(id);
  if (!guest) {
    return error(404, { message: '嘉宾不存在' });
  }
  return json({ guest });
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const oldGuest = getGuestById(id);
  
  if (!oldGuest) {
    return error(404, { message: '嘉宾不存在' });
  }
  
  updateGuest(id, body, locals.user.id);
  
  if (body.name !== undefined && body.name !== oldGuest.name) {
    createLog({
      table_name: 'guests',
      record_id: id,
      operation: 'update',
      field_name: 'name',
      old_value: oldGuest.name,
      new_value: body.name,
      operator_id: locals.user.id,
      operator_name: locals.user.username
    });
  }
  if (body.status !== undefined && body.status !== oldGuest.status) {
    createLog({
      table_name: 'guests',
      record_id: id,
      operation: 'update',
      field_name: 'status',
      old_value: oldGuest.status,
      new_value: body.status,
      operator_id: locals.user.id,
      operator_name: locals.user.username
    });
  }
  
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  deleteGuest(id);
  createLog({
    table_name: 'guests',
    record_id: id,
    operation: 'delete',
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: '删除嘉宾'
  });
  return json({ success: true });
};