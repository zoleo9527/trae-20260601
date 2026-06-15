import { NextResponse } from 'next/server';
import { getSummary } from '@/server/data';
import { getErrorResponse } from '@/utils/errors';

export async function GET() {
  try {
    const summary = getSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get summary error:', error);
    return NextResponse.json(getErrorResponse('INTERNAL_ERROR'), { status: 500 });
  }
}