import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { RoleType, ExamBatchStatus, ExamBatch } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const batch = dataStore.getExamBatchById(params.id);
  
  if (!batch) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'EB001',
        message: '考试批次不存在',
      },
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    data: batch,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, operatorId, operatorName, operatorRole } = body;

    const batch = dataStore.getExamBatchById(params.id);
    if (!batch) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'EB001',
          message: '考试批次不存在',
        },
      }, { status: 404 });
    }

    let validation;
    let updates: Partial<ExamBatch> = {};
    let logDetails = '';

    switch (action) {
      case 'submit':
        validation = dataStore.validateActionPermission('submit_batch', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (batch.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: { code: 'EB002', message: '只有待提交的批次才能提交' },
          }, { status: 400 });
        }
        
        updates = {
          status: 'submitted',
          submitterId: operatorId,
          submitterName: operatorName,
          submitTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        logDetails = `提交批次 ${batch.batchNumber}`;
        break;

      case 'confirm':
        validation = dataStore.validateActionPermission('confirm_batch', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (batch.status !== 'submitted') {
          return NextResponse.json({
            success: false,
            error: { code: 'EB002', message: '只有已提交的批次才能确认' },
          }, { status: 400 });
        }
        
        updates = {
          status: 'confirmed',
          confirmerId: operatorId,
          confirmerName: operatorName,
          confirmTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        logDetails = `确认批次 ${batch.batchNumber}`;
        break;

      case 'complete':
        validation = dataStore.validateActionPermission('complete_exam', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (batch.status !== 'confirmed') {
          return NextResponse.json({
            success: false,
            error: { code: 'EB002', message: '只有已确认的批次才能完成考试' },
          }, { status: 400 });
        }
        
        updates = { status: 'exam_completed' };
        logDetails = `完成批次 ${batch.batchNumber} 的考试`;
        break;

      case 'cancel':
        validation = dataStore.validateActionPermission('cancel_batch', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (batch.status === 'exam_completed') {
          return NextResponse.json({
            success: false,
            error: { code: 'EB002', message: '已完成的考试不能取消' },
          }, { status: 400 });
        }
        
        updates = { status: 'cancelled' };
        logDetails = `取消批次 ${batch.batchNumber}`;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: { code: 'EB002', message: '未知的操作类型' },
        }, { status: 400 });
    }

    const updatedBatch = dataStore.updateExamBatch(params.id, updates);
    
    dataStore.addOperationLog({
      operationType: `${action === 'submit' ? '提交' : action === 'confirm' ? '确认' : action === 'complete' ? '完成考试' : '取消'}考试批次`,
      targetType: 'batch',
      targetId: params.id,
      operatorId,
      operatorName,
      operatorRole: operatorRole as RoleType,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: logDetails,
    });

    return NextResponse.json({
      success: true,
      data: updatedBatch,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'EB001',
        message: '操作失败',
      },
    }, { status: 500 });
  }
}