import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReservationById, checkDuplicateReservation, updateReservation, deleteReservation } from '$db/reservations';
import { createLog } from '$db/operation_logs';

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  const reservation = getReservationById(id);
  if (!reservation) {
    return error(404, { message: '订台不存在' });
  }
  return json({ reservation });
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const oldReservation = getReservationById(id);
  
  if (!oldReservation) {
    return error(404, { message: '订台不存在' });
  }
  
  if (body.table_number !== undefined && body.date !== undefined && body.time_slot !== undefined) {
    if (checkDuplicateReservation(body.date, body.table_number, body.time_slot, id)) {
      return error(409, { message: '该台号在该时段已被预订' });
    }
  }
  
  updateReservation(id, body, locals.user.id);
  
  if (body.status !== undefined && body.status !== oldReservation.status) {
    createLog({
      table_name: 'reservations',
      record_id: id,
      operation: 'update',
      field_name: 'status',
      old_value: oldReservation.status,
      new_value: body.status,
      operator_id: locals.user.id,
      operator_name: locals.user.username,
      notes: body.notes
    });
  }
  
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  deleteReservation(id);
  createLog({
    table_name: 'reservations',
    record_id: id,
    operation: 'delete',
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: '删除订台'
  });
  return json({ success: true });
};