import { json } from '@sveltejs/kit';
import { getMembers, getRechargeRecords, rechargeMember } from '$lib/data/store';
import type { UserRole } from '$lib/types';

export function GET() {
  return json(getMembers());
}

export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const { memberId, amount, bonus, paymentMethod, operator, bookingId } = body;
  
  const record = rechargeMember(memberId, amount, bonus, paymentMethod, operator, bookingId);
  if (!record) {
    return json({ error: '会员不存在' }, { status: 404 });
  }
  
  return json(record);
}
