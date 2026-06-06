import { getDatabase } from './connection';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, ScreeningExceptionType, ScreeningExceptionStatus, RefundStatus, RefundReason } from '../types';

export function seedDatabase() {
  const db = getDatabase();

  console.log('开始插入测试数据...');

  const halls = [
    { id: 'hall-001', name: '1号激光厅', capacity: 120, status: 'normal' as const, equipmentStatus: '良好' },
    { id: 'hall-002', name: '2号IMAX厅', capacity: 200, status: 'normal' as const, equipmentStatus: '良好' },
    { id: 'hall-003', name: '3号杜比厅', capacity: 150, status: 'maintenance' as const, equipmentStatus: '音响故障维修中' },
    { id: 'hall-004', name: '4号普通厅', capacity: 100, status: 'normal' as const, equipmentStatus: '良好' },
    { id: 'hall-005', name: '5号VIP厅', capacity: 50, status: 'normal' as const, equipmentStatus: '良好' }
  ];
  db.halls = halls;
  console.log(`已插入 ${halls.length} 个影厅`);

  const schedules = [
    { id: 'sched-001', movieName: '流浪地球3', hallId: 'hall-001', startTime: '2026-06-06 10:00:00', endTime: '2026-06-06 12:30:00', totalSeats: 120, soldSeats: 85, status: 'scheduled' as const },
    { id: 'sched-002', movieName: '哪吒之魔童闹海', hallId: 'hall-002', startTime: '2026-06-06 14:00:00', endTime: '2026-06-06 16:10:00', totalSeats: 200, soldSeats: 180, status: 'scheduled' as const },
    { id: 'sched-003', movieName: '复仇者联盟5', hallId: 'hall-001', startTime: '2026-06-06 19:00:00', endTime: '2026-06-06 21:45:00', totalSeats: 120, soldSeats: 110, status: 'scheduled' as const },
    { id: 'sched-004', movieName: '唐人街探案4', hallId: 'hall-004', startTime: '2026-06-06 15:30:00', endTime: '2026-06-06 17:45:00', totalSeats: 100, soldSeats: 60, status: 'scheduled' as const },
    { id: 'sched-005', movieName: '速度与激情11', hallId: 'hall-002', startTime: '2026-06-06 20:00:00', endTime: '2026-06-06 22:30:00', totalSeats: 200, soldSeats: 150, status: 'scheduled' as const }
  ];
  db.schedules = schedules;
  console.log(`已插入 ${schedules.length} 个排片`);

  const users = [
    { id: 'user-schedule-001', username: 'schedule_mgr', name: '张伟', role: UserRole.SCHEDULE_MANAGER, createdAt: '2026-01-01 00:00:00' },
    { id: 'user-ticket-001', username: 'ticket_sup', name: '李娜', role: UserRole.TICKET_SUPERVISOR, createdAt: '2026-01-01 00:00:00' },
    { id: 'user-duty-001', username: 'duty_mgr', name: '王强', role: UserRole.DUTY_MANAGER, createdAt: '2026-01-01 00:00:00' }
  ];
  db.users = users;
  console.log(`已插入 ${users.length} 个用户`);

  const exceptions = [
    {
      id: 'exc-001',
      scheduleId: 'sched-001',
      type: ScreeningExceptionType.EQUIPMENT_FAILURE,
      status: ScreeningExceptionStatus.CLOSED,
      title: '1号厅放映机故障',
      description: '开场前30分钟发现放映机灯泡烧坏，无法正常放映',
      reportedBy: 'user-schedule-001',
      reportedAt: '2026-06-06 09:30:00',
      currentHallId: 'hall-001',
      targetHallId: 'hall-004',
      affectedTicketCount: 85,
      handledBy: 'user-duty-001',
      handledAt: '2026-06-06 09:50:00',
      resolution: '已将观众转移至4号厅，剩余不愿换厅观众已办理退票，异常处理完成'
    },
    {
      id: 'exc-002',
      scheduleId: 'sched-002',
      type: ScreeningExceptionType.GROUP_TICKET_CONFUSION,
      status: ScreeningExceptionStatus.CLOSED,
      title: '团体票核销混乱',
      description: '某企业团购150张票，现场核销时出现重复核销和漏核销情况',
      reportedBy: 'user-ticket-001',
      reportedAt: '2026-06-06 13:15:00',
      currentHallId: 'hall-002',
      affectedTicketCount: 150,
      handledBy: 'user-duty-001',
      handledAt: '2026-06-06 13:45:00',
      resolution: '已与企业负责人核对名单，补核销23张，退回重复核销5张，观众全部入场'
    },
    {
      id: 'exc-003',
      scheduleId: 'sched-003',
      type: ScreeningExceptionType.TEMP_HALL_CHANGE,
      status: ScreeningExceptionStatus.PROCESSING,
      title: '临时换厅需求',
      description: '因1号厅空调系统突发故障，需要将晚上19点场次临时换至其他厅',
      reportedBy: 'user-schedule-001',
      reportedAt: '2026-06-06 17:00:00',
      currentHallId: 'hall-001',
      targetHallId: undefined,
      affectedTicketCount: 110,
      handledBy: 'user-schedule-001',
      handledAt: '2026-06-06 17:10:00',
      resolution: undefined
    },
    {
      id: 'exc-004',
      scheduleId: 'sched-005',
      type: ScreeningExceptionType.EQUIPMENT_FAILURE,
      status: ScreeningExceptionStatus.REPORTED,
      title: 'IMAX厅音响系统异常',
      description: '巡场发现2号IMAX厅环绕音响有杂音，可能影响观影体验',
      reportedBy: 'user-duty-001',
      reportedAt: '2026-06-06 18:30:00',
      currentHallId: 'hall-002',
      targetHallId: undefined,
      affectedTicketCount: 150,
      handledBy: undefined,
      handledAt: undefined,
      resolution: undefined
    },
    {
      id: 'exc-005',
      scheduleId: 'sched-004',
      type: ScreeningExceptionType.CONTENT_ABNORMAL,
      status: ScreeningExceptionStatus.REFUND_INITIATED,
      title: '影片内容播放异常',
      description: '放映20分钟后出现画面卡顿，随后影片无法继续播放',
      reportedBy: 'user-schedule-001',
      reportedAt: '2026-06-06 15:50:00',
      currentHallId: 'hall-004',
      affectedTicketCount: 60,
      handledBy: 'user-duty-001',
      handledAt: '2026-06-06 16:00:00',
      resolution: '正在办理全场退票'
    },
    {
      id: 'exc-006',
      scheduleId: 'sched-002',
      type: ScreeningExceptionType.EQUIPMENT_FAILURE,
      status: ScreeningExceptionStatus.RESOLVED,
      title: '3D眼镜发放设备故障',
      description: '3D眼镜消毒柜故障，导致无法正常发放眼镜',
      reportedBy: 'user-ticket-001',
      reportedAt: '2026-06-06 13:30:00',
      currentHallId: 'hall-002',
      affectedTicketCount: 0,
      handledBy: 'user-duty-001',
      handledAt: '2026-06-06 13:55:00',
      resolution: '已启用备用消毒柜，观众可正常领取眼镜'
    }
  ];
  db.screeningExceptions = exceptions;
  console.log(`已插入 ${exceptions.length} 条放映异常记录`);
  console.log('  - 正常关闭: 2条 (exc-001, exc-002)');
  console.log('  - 处理中卡住: 1条 (exc-003)');
  console.log('  - 待处理卡住: 1条 (exc-004)');
  console.log('  - 退票流程中: 1条 (exc-005)');
  console.log('  - 已解决待关闭: 1条 (exc-006)');

  const refunds = [
    {
      id: 'refund-001', orderId: 'ORD20260606001', scheduleId: 'sched-001', exceptionId: 'exc-001',
      userId: 'u001', userName: '张三', phone: '13800138001', ticketCount: 2, totalAmount: 98.00,
      reason: RefundReason.SCREENING_EXCEPTION, status: RefundStatus.PROCESSED, appliedAt: '2026-06-06 09:35:00',
      approvedBy: 'user-ticket-001', approvedAt: '2026-06-06 09:40:00', processedAt: '2026-06-06 09:45:00', rejectReason: undefined, remark: undefined
    },
    {
      id: 'refund-002', orderId: 'ORD20260606002', scheduleId: 'sched-001', exceptionId: 'exc-001',
      userId: 'u002', userName: '李四', phone: '13800138002', ticketCount: 3, totalAmount: 147.00,
      reason: RefundReason.SCREENING_EXCEPTION, status: RefundStatus.PROCESSED, appliedAt: '2026-06-06 09:36:00',
      approvedBy: 'user-ticket-001', approvedAt: '2026-06-06 09:41:00', processedAt: '2026-06-06 09:46:00', rejectReason: undefined, remark: undefined
    },
    {
      id: 'refund-003', orderId: 'ORD20260606003', scheduleId: 'sched-004', exceptionId: 'exc-005',
      userId: 'u003', userName: '王五', phone: '13800138003', ticketCount: 2, totalAmount: 80.00,
      reason: RefundReason.SCREENING_EXCEPTION, status: RefundStatus.PENDING, appliedAt: '2026-06-06 15:55:00',
      approvedBy: undefined, approvedAt: undefined, processedAt: undefined, rejectReason: undefined, remark: undefined
    },
    {
      id: 'refund-004', orderId: 'ORD20260606004', scheduleId: 'sched-004', exceptionId: 'exc-005',
      userId: 'u004', userName: '赵六', phone: '13800138004', ticketCount: 4, totalAmount: 160.00,
      reason: RefundReason.SCREENING_EXCEPTION, status: RefundStatus.APPROVED, appliedAt: '2026-06-06 15:56:00',
      approvedBy: 'user-ticket-001', approvedAt: '2026-06-06 16:00:00', processedAt: undefined, rejectReason: undefined, remark: undefined
    },
    {
      id: 'refund-005', orderId: 'ORD20260606005', scheduleId: 'sched-003',
      userId: 'u005', userName: '孙七', phone: '13800138005', ticketCount: 2, totalAmount: 100.00,
      reason: RefundReason.USER_REQUEST, status: RefundStatus.PENDING, appliedAt: '2026-06-06 18:00:00',
      approvedBy: undefined, approvedAt: undefined, processedAt: undefined, rejectReason: undefined, remark: undefined
    },
    {
      id: 'refund-006', orderId: 'ORD20260606006', scheduleId: 'sched-002', exceptionId: 'exc-002',
      userId: 'u006', userName: '周八', phone: '13800138006', ticketCount: 5, totalAmount: 225.00,
      reason: RefundReason.GROUP_TICKET_ISSUE, status: RefundStatus.REJECTED, appliedAt: '2026-06-06 13:20:00',
      approvedBy: 'user-ticket-001', approvedAt: '2026-06-06 13:35:00', processedAt: undefined,
      rejectReason: '团体票已核销且用户已入场，不符合退票条件', remark: undefined
    },
    {
      id: 'refund-007', orderId: 'ORD20260606007', scheduleId: 'sched-004', exceptionId: 'exc-005',
      userId: 'u007', userName: '吴九', phone: '13800138007', ticketCount: 1, totalAmount: 40.00,
      reason: RefundReason.SCREENING_EXCEPTION, status: RefundStatus.PENDING, appliedAt: '2026-06-06 15:57:00',
      approvedBy: undefined, approvedAt: undefined, processedAt: undefined, rejectReason: undefined, remark: undefined
    }
  ];
  db.refunds = refunds;
  console.log(`已插入 ${refunds.length} 条退票记录`);
  console.log('  - 已处理完成: 2条');
  console.log('  - 待审核: 3条');
  console.log('  - 已审批待退款: 1条');
  console.log('  - 已驳回: 1条');

  console.log('');
  console.log('测试数据初始化完成！');
  console.log('');
  console.log('异常状态分布:');
  console.log('  reported(已上报): 1条');
  console.log('  processing(处理中): 1条');
  console.log('  refund_initiated(退票中): 1条');
  console.log('  resolved(已解决): 1条');
  console.log('  closed(已关闭): 2条');
}
