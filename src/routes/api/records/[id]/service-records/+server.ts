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

export async function PATCH({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { serviceId, ...updates } = body;
  
  if (!serviceId) {
    throw error(400, '缺少服务记录ID');
  }
  
  const record = updateServiceRecord(params.id, serviceId, updates);
  if (!record) {
    throw error(404, '记录或服务记录不存在');
  }
  
  return json(record);
}

export function GET({ params }: { params: { id: string } }) {
  const record = getRecordById(params.id);
  if (!record) {
    throw error(404, '记录不存在');
  }
  return json(record.serviceRecords);
}
