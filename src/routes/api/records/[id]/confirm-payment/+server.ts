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
    throw error(404, '记录不存在');
  }
  
  return json(record);
}
