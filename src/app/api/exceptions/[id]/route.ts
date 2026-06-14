import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { RoleType, ExceptionType } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const exception = dataStore.getExceptionById(params.id);
  
  if (!exception) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'EX001',
        message: '异常记录不存在',
      },
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    data: exception,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { operatorId, operatorName, operatorRole } = body;

    const validation = dataStore.validateActionPermission('handle_exception', operatorRole as RoleType);
    if (!validation.allowed) {
      return NextResponse.json({
        success: false,
        error: { code: validation.errorCode, message: validation.message },
      }, { status: 403 });
    }

    const exception = dataStore.getExceptionById(params.id);
    if (!exception) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'EX001',
          message: '异常记录不存在',
        },
      }, { status: 404 });
    }
    
    if (exception.resolved) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'EX002',
          message: '异常已处理完成',
        },
      }, { status: 400 });
    }

    const updatedException = dataStore.updateException(params.id, {
      resolved: true,
      handlerId: operatorId,
      handlerName: operatorName,
      handledAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    const notification = dataStore.getNotifications(exception.batchId)
      .find(n => n.studentId === exception.studentId);
    
    if (notification && notification.status === 'pending') {
      dataStore.updateNotification(notification.id, {
        status: 'notified',
        remarks: `异常已处理: ${exception.description}`,
      });
      
      dataStore.addOperationLog({
        operationType: '更新学员通知',
        targetType: 'notification',
        targetId: notification.id,
        operatorId,
        operatorName,
        operatorRole: operatorRole as RoleType,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `因异常处理更新学员 ${notification.studentName} 的通知状态`,
      });
    }

    dataStore.addOperationLog({
      operationType: '处理异常记录',
      targetType: 'exception',
      targetId: params.id,
      operatorId,
      operatorName,
      operatorRole: operatorRole as RoleType,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `处理${exception.studentName}的异常: ${exception.description}`,
    });

    return NextResponse.json({
      success: true,
      data: updatedException,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'EX001',
        message: '处理失败',
      },
    }, { status: 500 });
  }
}