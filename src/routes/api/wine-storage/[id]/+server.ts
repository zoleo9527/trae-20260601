import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWineStorageById, retrieveWine, updateWineStorage, deleteWineStorage } from '$db/wine_storage';
import { createLog } from '$db/operation_logs';

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  const wine = getWineStorageById(id);
  if (!wine) {
    return error(404, { message: '寄存记录不存在' });
  }
  return json({ wine });
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const oldWine = getWineStorageById(id);
  
  if (!oldWine) {
    return error(404, { message: '寄存记录不存在' });
  }
  
  if (body.action === 'retrieve') {
    retrieveWine(id, locals.user.id, body.notes);
    createLog({
      table_name: 'wine_storage',
      record_id: id,
      operation: 'update',
      field_name: 'status',
      old_value: oldWine.status,
      new_value: 'retrieved',
      operator_id: locals.user.id,
      operator_name: locals.user.username,
      notes: body.notes || '取走酒水'
    });
  } else {
    updateWineStorage(id, body, locals.user.id);
    if (body.status !== undefined && body.status !== oldWine.status) {
      createLog({
        table_name: 'wine_storage',
        record_id: id,
        operation: 'update',
        field_name: 'status',
        old_value: oldWine.status,
        new_value: body.status,
        operator_id: locals.user.id,
        operator_name: locals.user.username
      });
    }
  }
  
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  deleteWineStorage(id);
  createLog({
    table_name: 'wine_storage',
    record_id: id,
    operation: 'delete',
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: '删除寄存记录'
  });
  return json({ success: true });
};