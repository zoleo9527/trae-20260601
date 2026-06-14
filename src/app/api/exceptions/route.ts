import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { ExceptionType } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');
  const type = searchParams.get('type') as ExceptionType | null;
  const resolved = searchParams.get('resolved');
  
  const exceptions = dataStore.getExceptions(
    batchId || undefined,
    type || undefined,
    resolved !== null ? resolved === 'true' : undefined
  );
  
  return NextResponse.json({
    success: true,
    data: exceptions,
  });
}