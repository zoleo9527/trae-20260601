import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET(request: NextRequest) {
  const students = dataStore.getStudents();
  
  return NextResponse.json({
    success: true,
    data: students,
  });
}