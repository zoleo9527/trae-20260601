import { NextResponse } from 'next/server';
import { getAuditLogsByAppealId } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(getErrorResponse('APPEAL_NOT_FOUND', '缺少申诉ID'), { status: 400 });
    }
    
    const logs = getAuditLogsByAppealId(id);
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(getErrorResponse('INTERNAL_ERROR'), { status: 500 });
  }
}