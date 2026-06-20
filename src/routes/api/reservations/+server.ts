import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllReservations, getReservationsByDate, checkDuplicateReservation, createReservation } from '$db/reservations';
import { createLog } from '$db/operation_logs';
import { normalizeTimeSlot } from '$lib/constants';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const date = url.searchParams.get('date');
  const reservations = date ? getReservationsByDate(date) : getAllReservations();
  return json({ reservations });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const body = await request.json();
  
  const normalizedTimeSlot = normalizeTimeSlot(body.time_slot);
  body.time_slot = normalizedTimeSlot;
  
  if (checkDuplicateReservation(body.date, body.table_number, body.time_slot)) {
    return error(409, { message: '该台号在该时段已被预订' });
  }
  
  const id = createReservation({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: 'reservations',
    record_id: id,
    operation: 'create',
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `预订台${body.table_number}: ${body.customer_name}`
  });
  return json({ id }, { status: 201 });
};