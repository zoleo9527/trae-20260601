import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteAttachment } from '$db/attachments';

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const id = parseInt(params.id);
  deleteAttachment(id);
  return json({ success: true });
};