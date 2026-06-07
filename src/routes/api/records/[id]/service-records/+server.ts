import { json, error } from '@sveltejs/kit';
import { addServiceRecord, getRecordById, updateServiceRecord } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { scheduleId, startTime, notes } = body;
  
  if (!scheduleId || !startTime) {
    throw error(400, '缺少必要参数');
  }
  
  const record = addServiceRecord(params.id, {
    scheduleId,
    startTime: new Date(startTime),
    endTime: null,
    actualDuration: null,
    completed: false,
    notes: notes || ''
  });
  
  if (!record) {
    throw error(404, '记录不存在');
  }
  
  return json(record);
}

export async function PATCH() {
  throw error(403, '该接口已停用，请使用 /complete-service 收口接口结束服务');
}

export function GET({ params }: { params: { id: string } }) {
  const record = getRecordById(params.id);
  if (!record) {
    throw error(404, '记录不存在');
  }
  return json(record.serviceRecords);
}
