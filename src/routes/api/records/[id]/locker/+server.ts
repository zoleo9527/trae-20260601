import { json, error } from '@sveltejs/kit';
import { updateLockerStatus } from '$lib/data/store';

export async function PATCH({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { status, reason, supplementaryNotes, operator, operatorRole } = body;
  
  if (!status) {
    throw error(400, '缺少状态参数');
  }
  
  const record = updateLockerStatus(params.id, status, reason, supplementaryNotes, operator, operatorRole);
  if (!record) {
    throw error(404, '记录不存在');
  }
  
  return json(record);
}
