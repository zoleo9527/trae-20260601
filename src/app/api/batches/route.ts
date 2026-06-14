import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { ExamBatchStatus, RoleType } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ExamBatchStatus | null;
  
  const batches = dataStore.getExamBatches(status || undefined);
  
  return NextResponse.json({
    success: true,
    data: batches,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      examDate, 
      examTime, 
      location, 
      students,
      operatorId,
      operatorName,
      operatorRole 
    } = body;

    const validation = dataStore.validateActionPermission('create_batch', operatorRole as RoleType);
    if (!validation.allowed) {
      return NextResponse.json({
        success: false,
        error: {
          code: validation.errorCode,
          message: validation.message,
        },
      }, { status: 403 });
    }

    const batchNumber = dataStore.generateBatchNumber();
    
    const batch = dataStore.createExamBatch({
      batchNumber,
      examDate,
      examTime,
      location,
      status: 'pending',
      submitterId: operatorId,
      submitterName: operatorName,
      students,
    });

    students.forEach((studentId: string) => {
      const student = dataStore.getStudentById(studentId);
      if (student) {
        dataStore.createNotification({
          batchId: batch.id,
          studentId: student.id,
          studentName: student.name,
          status: 'pending',
        });
      }
    });

    dataStore.addOperationLog({
      operationType: '创建考试批次',
      targetType: 'batch',
      targetId: batch.id,
      operatorId,
      operatorName,
      operatorRole: operatorRole as RoleType,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `创建批次 ${batch.batchNumber}，包含 ${students.length} 名学员`,
    });

    return NextResponse.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'EB001',
        message: '创建批次失败',
      },
    }, { status: 500 });
  }
}