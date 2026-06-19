import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllWineStorage, getWineStorageByPhone, getStoredWines, createWineStorage } from '$db/wine_storage';
import { createLog } from '$db/operation_logs';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const phone = url.searchParams.get('phone');
  const storedOnly = url.searchParams.get('stored') === 'true';
  const wines = storedOnly ? getStoredWines() : (phone ? getWineStorageByPhone(phone) : getAllWineStorage());
  return json({ wines });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const body = await request.json();
  const id = createWineStorage({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: 'wine_storage',
    record_id: id,
    operation: 'create',
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `寄存酒水: ${body.wine_name} (${body.customer_name})`
  });
  return json({ id }, { status: 201 });
};