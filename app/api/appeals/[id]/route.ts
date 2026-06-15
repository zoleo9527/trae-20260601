import { NextResponse } from 'next/server';
import { getAppealById } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(getErrorResponse('APPEAL_NOT_FOUND', '缺少申诉ID'), { status: 400 });
    }
    
    const appeal = getAppealById(id);
    if (!appeal) {
      return NextResponse.json(getErrorResponse('APPEAL_NOT_FOUND'), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: appeal });
  } catch (error) {
    console.error('Get appeal error:', error);
    return NextResponse.json(getErrorResponse('INTERNAL_ERROR'), { status: 500 });
  }
}