import { json, error } from '@sveltejs/kit';
import { addSchedule, getRecordById, updateSchedule } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { technicianId, technicianName, technicianNo, serviceItem, duration, roomNo, notes } = body;
  
  if (!technicianId || !serviceItem || !duration || !roomNo) {
    throw error(400, '缺少必要参数');
  }
  
  const record = addSchedule(params.id, {
    technicianId,
    technicianName,
    technicianNo,
    serviceItem,
    startTime: null,
    endTime: null,
    duration,
    roomNo,
    notes: notes || ''
  });
  
  if (!record) {
    throw error(404, '记录不存在');
  }
  
  return json(record);
}

export async function PATCH({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { scheduleId, ...updates } = body;
  
  if (!scheduleId) {
    throw error(400, '缺少排班ID');
  }
  
  const record = updateSchedule(params.id, scheduleId, updates);
  if (!record) {
    throw error(404, '记录或排班不存在');
  }
  
  return json(record);
}

export function GET({ params }: { params: { id: string } }) {
  const record = getRecordById(params.id);
  if (!record) {
    throw error(404, '记录不存在');
  }
  return json(record.schedules);
}
