import { json, error } from '@sveltejs/kit';
import { rejectCheckout } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { reason, supplementaryNotes, operator, operatorRole } = body;
  
  if (!reason || !operator || !operatorRole) {
    throw error(400, '缺少必要参数');
  }
  
  const record = rejectCheckout(params.id, reason, supplementaryNotes || '', operator, operatorRole);
  
  if (!record) {
    throw error(404, '记录不存在');
  }
  
  return json(record);
}
