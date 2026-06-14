import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET(request: NextRequest) {
  const users = dataStore.getUsers();
  
  return NextResponse.json({
    success: true,
    data: users,
  });
}