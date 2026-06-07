import { json, error } from '@sveltejs/kit';
import { getRecordById, updateRecordStatus, addNote } from '$lib/data/store';

export function GET({ params }: { params: { id: string } }) {
  const record = getRecordById(params.id);
  if (!record) {
    throw error(404, '记录不存在');
  }
  return json(record);
}

export async function PATCH({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { status } = body;
  
  if (status) {
    const record = updateRecordStatus(params.id, status);
    if (!record) {
      throw error(404, '记录不存在');
    }
    return json(record);
  }
  
  throw error(400, '无效的请求');
}
