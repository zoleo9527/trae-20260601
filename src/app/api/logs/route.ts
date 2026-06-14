import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType') as 'batch' | 'notification' | 'exception' | null;
  const targetId = searchParams.get('targetId');
  
  const logs = dataStore.getOperationLogs(targetType || undefined, targetId || undefined);
  
  return NextResponse.json({
    success: true,
    data: logs,
  });
}