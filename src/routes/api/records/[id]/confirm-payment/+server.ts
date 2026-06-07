import { json, error } from '@sveltejs/kit';
import { confirmPaymentAndComplete } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { amount, operator, operatorRole } = body;
  
  if (amount === undefined || amount === null) {
    throw error(400, '缺少金额参数');
  }
  
  const record = confirmPaymentAndComplete(params.id, amount, operator, operatorRole);
  
  if (!record) {
    throw error(400, '状态不合法或记录不存在，请确认订单处于服务完成状态');
  }
  
  return json(record);
}
