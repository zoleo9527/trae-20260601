import { json, error } from '@sveltejs/kit';
import { addNote, getRecordById } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { content, createdBy, createdByRole, type } = body;
  
  if (!content || !createdBy || !createdByRole) {
    throw error(400, '缺少必要参数');
  }
  
  const record = addNote(params.id, {
    content,
    createdBy,
    createdByRole,
    type: type || 'general'
  });
  
  if (!record) {
    throw error(404, '记录不存在');
  }
  
  return json(record);
}

export function GET({ params }: { params: { id: string } }) {
  const record = getRecordById(params.id);
  if (!record) {
    throw error(404, '记录不存在');
  }
  return json(record.notes);
}
