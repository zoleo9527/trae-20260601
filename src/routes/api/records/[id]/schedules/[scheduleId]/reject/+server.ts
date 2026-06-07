import { json, error } from '@sveltejs/kit';
import { rejectSchedule } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string; scheduleId: string } }) {
  const body = await request.json();
  const { reason, supplementaryNotes, operator, operatorRole } = body;
  
  if (!reason || !operator || !operatorRole) {
    throw error(400, '缺少必要参数');
  }
  
  const record = rejectSchedule(params.id, params.scheduleId, reason, supplementaryNotes || '', operator, operatorRole);
  
  if (!record) {
    throw error(404, '记录或排班不存在');
  }
  
  return json(record);
}
