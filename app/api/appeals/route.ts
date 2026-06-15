import { NextResponse } from 'next/server';
import { getAppeals } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export async function GET() {
  try {
    const appeals = getAppeals();
    return NextResponse.json({ success: true, data: appeals });
  } catch (error) {
    console.error('Get appeals error:', error);
    return NextResponse.json(getErrorResponse('INTERNAL_ERROR'), { status: 500 });
  }
}