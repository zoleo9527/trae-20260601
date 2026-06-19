import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllAttachments, getAttachmentsByRecord, createAttachment, deleteAttachment } from '$db/attachments';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const table = url.searchParams.get('table');
  const recordId = url.searchParams.get('recordId');
  
  const attachments = table && recordId 
    ? getAttachmentsByRecord(table, parseInt(recordId))
    : getAllAttachments();
  
  return json({ attachments });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: '未登录' });
  }
  const body = await request.json();
  const id = createAttachment({ ...body, uploaded_by: locals.user.id });
  return json({ id }, { status: 201 });
};