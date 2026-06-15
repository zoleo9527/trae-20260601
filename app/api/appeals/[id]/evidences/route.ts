import { NextResponse } from 'next/server';
import { getEvidencesByAppealId } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(getErrorResponse('APPEAL_NOT_FOUND', '缺少申诉ID'), { status: 400 });
    }
    
    const evidences = getEvidencesByAppealId(id);
    return NextResponse.json({ success: true, data: evidences });
  } catch (error) {
    console.error('Get evidences error:', error);
    return NextResponse.json(getErrorResponse('INTERNAL_ERROR'), { status: 500 });
  }
}