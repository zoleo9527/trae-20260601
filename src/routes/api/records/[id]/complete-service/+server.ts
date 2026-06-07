import { json, error } from '@sveltejs/kit';
import { completeService } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { serviceId, scheduleId, endTime, actualDuration, operator, operatorRole } = body;
  
  if (!serviceId || !scheduleId || !endTime) {
    throw error(400, '缺少必要参数');
  }
  
  const record = completeService(
    params.id, 
    serviceId, 
    scheduleId, 
    new Date(endTime), 
    actualDuration,
    operator,
    operatorRole
  );
  
  if (!record) {
    throw error(400, '状态不合法或记录不存在，请确认订单处于服务中且服务未完成');
  }
  
  return json(record);
}
