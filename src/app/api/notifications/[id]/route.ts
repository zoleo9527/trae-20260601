import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { RoleType, StudentNotificationStatus, StudentNotification } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const notification = dataStore.getNotificationById(params.id);
  
  if (!notification) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'SN001',
        message: '学员通知不存在',
      },
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    data: notification,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, operatorId, operatorName, operatorRole, remarks } = body;

    const notification = dataStore.getNotificationById(params.id);
    if (!notification) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SN001',
          message: '学员通知不存在',
        },
      }, { status: 404 });
    }

    let validation;
    let updates: Partial<StudentNotification> = {};
    let logDetails = '';

    switch (action) {
      case 'send':
        validation = dataStore.validateActionPermission('send_notification', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (notification.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: { code: 'SN003', message: '只有待通知的才能发送通知' },
          }, { status: 400 });
        }
        
        updates = {
          status: 'notified',
          notifierId: operatorId,
          notifierName: operatorName,
          notifyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        logDetails = `通知学员 ${notification.studentName}`;
        break;

      case 'confirm':
        validation = dataStore.validateActionPermission('confirm_notification', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (notification.status !== 'notified') {
          return NextResponse.json({
            success: false,
            error: { code: 'SN003', message: '只有已通知的才能确认' },
          }, { status: 400 });
        }
        
        updates = {
          status: 'confirmed',
          confirmerId: operatorId,
          confirmerName: operatorName,
          confirmTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        logDetails = `确认学员 ${notification.studentName} 的通知`;
        break;

      case 'absent':
        validation = dataStore.validateActionPermission('mark_absent', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (notification.status !== 'notified' && notification.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: { code: 'SN003', message: '只有已通知或待通知的才能标记缺考' },
          }, { status: 400 });
        }
        
        updates = {
          status: 'absent',
          remarks: remarks || '学员缺考',
        };
        logDetails = `标记学员 ${notification.studentName} 缺考: ${remarks || '未说明'}`;
        break;

      case 'complete':
        validation = dataStore.validateActionPermission('complete_notification', operatorRole as RoleType);
        if (!validation.allowed) {
          return NextResponse.json({
            success: false,
            error: { code: validation.errorCode, message: validation.message },
          }, { status: 403 });
        }
        
        if (notification.status !== 'confirmed') {
          return NextResponse.json({
            success: false,
            error: { code: 'SN003', message: '只有已确认的才能完成' },
          }, { status: 400 });
        }
        
        updates = { status: 'completed' };
        logDetails = `完成学员 ${notification.studentName} 的通知`;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: { code: 'SN003', message: '未知的操作类型' },
        }, { status: 400 });
    }

    const updatedNotification = dataStore.updateNotification(params.id, updates);
    
    dataStore.addOperationLog({
      operationType: `${action === 'send' ? '发送' : action === 'confirm' ? '确认' : action === 'absent' ? '标记缺考' : '完成'}学员通知`,
      targetType: 'notification',
      targetId: params.id,
      operatorId,
      operatorName,
      operatorRole: operatorRole as RoleType,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: logDetails,
    });

    return NextResponse.json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'SN001',
        message: '操作失败',
      },
    }, { status: 500 });
  }
}