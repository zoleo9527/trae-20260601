import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { StudentNotificationStatus, RoleType } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');
  const status = searchParams.get('status') as StudentNotificationStatus | null;
  
  const notifications = dataStore.getNotifications(batchId || undefined, status || undefined);
  
  return NextResponse.json({
    success: true,
    data: notifications,
  });
}