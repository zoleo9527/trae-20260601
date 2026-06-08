import dayjs from 'dayjs'

const now = dayjs()
const d = (offset: number, hour = 8, minute = 0) =>
  now.add(offset, 'day').hour(hour).minute(minute).second(0).format('YYYY-MM-DD HH:mm:ss')

export const mockVehicles = [
  { id: 'v1', plateNo: '云A·12345', type: '35座大巴', seatCount: 35, status: 'available' as const },
  { id: 'v2', plateNo: '云A·23456', type: '22座中巴', seatCount: 22, status: 'available' as const },
  { id: 'v3', plateNo: '云A·34567', type: '7座商务', seatCount: 7, status: 'available' as const },
  { id: 'v4', plateNo: '云A·45678', type: '49座大巴', seatCount: 49, status: 'assigned' as const },
  { id: 'v5', plateNo: '云A·56789', type: '35座大巴', seatCount: 35, status: 'maintenance' as const },
]

export const mockSchedules = [
  { id: 'sch001', tripNo: 'TR-20260601-001', vehicleId: 'v1', driverName: '张师傅', guideName: '李导', departTime: d(-7, 7, 30), expectedReturn: d(-7, 18, 0), actualReturn: d(-7, 18, 30), status: 'SETTLED' as const, isSupplement: false, remark: '大理一日游', createdBy: '调度员小王', createdAt: d(-8), updatedAt: d(-6) },
  { id: 'sch002', tripNo: 'TR-20260602-002', vehicleId: 'v2', driverName: '刘师傅', guideName: '赵导', departTime: d(-6, 8, 0), expectedReturn: d(-6, 17, 0), actualReturn: d(-6, 17, 45), status: 'SETTLED' as const, isSupplement: false, remark: '丽江古城半日', createdBy: '调度员小王', createdAt: d(-7), updatedAt: d(-5) },
  { id: 'sch003', tripNo: 'TR-20260603-003', vehicleId: 'v4', driverName: '陈师傅', guideName: '王导', departTime: d(-5, 6, 0), expectedReturn: d(-5, 20, 0), actualReturn: d(-5, 21, 30), status: 'SETTLED' as const, isSupplement: false, remark: '香格里拉两日游第一天', createdBy: '调度员小李', createdAt: d(-6), updatedAt: d(-4) },
  { id: 'sch004', tripNo: 'TR-20260604-004', vehicleId: 'v1', driverName: '张师傅', guideName: '李导', departTime: d(-4, 7, 0), expectedReturn: d(-4, 18, 0), actualReturn: d(-4, 18, 10), status: 'SETTLED' as const, isSupplement: false, remark: '洱海环线', createdBy: '调度员小王', createdAt: d(-5), updatedAt: d(-3) },
  { id: 'sch005', tripNo: 'TR-20260605-005', vehicleId: 'v3', driverName: '杨师傅', guideName: '周导', departTime: d(-3, 9, 0), expectedReturn: d(-3, 12, 0), actualReturn: d(-3, 12, 30), status: 'SETTLED' as const, isSupplement: true, remark: '临时接机（补录）', createdBy: '调度员小王', createdAt: d(-3, 8, 0), updatedAt: d(-2) },
  { id: 'sch006', tripNo: 'TR-20260606-006', vehicleId: 'v2', driverName: '刘师傅', guideName: '赵导', departTime: d(-2, 8, 0), expectedReturn: d(-2, 17, 0), actualReturn: d(-2, 17, 20), status: 'RETURNED' as const, isSupplement: false, remark: '束河古镇', createdBy: '调度员小李', createdAt: d(-3), updatedAt: d(-2, 17, 20) },
  { id: 'sch007', tripNo: 'TR-20260607-007', vehicleId: 'v4', driverName: '陈师傅', guideName: '王导', departTime: d(-1, 7, 0), expectedReturn: d(-1, 19, 0), actualReturn: d(-1, 19, 45), status: 'RETURNED' as const, isSupplement: false, remark: '玉龙雪山', createdBy: '调度员小王', createdAt: d(-2), updatedAt: d(-1, 19, 45) },
  { id: 'sch008', tripNo: 'TR-20260608-008', vehicleId: 'v1', driverName: '张师傅', guideName: '李导', departTime: d(0, 8, 0), expectedReturn: d(0, 18, 0), actualReturn: '', status: 'DEPARTED' as const, isSupplement: false, remark: '大理崇圣寺三塔', createdBy: '调度员小王', createdAt: d(-1), updatedAt: d(0, 8, 0) },
  { id: 'sch009', tripNo: 'TR-20260608-009', vehicleId: 'v3', driverName: '杨师傅', guideName: '周导', departTime: d(0, 9, 30), expectedReturn: d(0, 16, 0), actualReturn: '', status: 'DEPARTED' as const, isSupplement: false, remark: '机场接送', createdBy: '调度员小李', createdAt: d(-1), updatedAt: d(0, 9, 30) },
  { id: 'sch010', tripNo: 'TR-20260609-010', vehicleId: 'v2', driverName: '刘师傅', guideName: '赵导', departTime: d(1, 7, 30), expectedReturn: d(1, 18, 0), actualReturn: '', status: 'PENDING' as const, isSupplement: false, remark: '泸沽湖一日游', createdBy: '调度员小王', createdAt: d(-1), updatedAt: d(-1) },
  { id: 'sch011', tripNo: 'TR-20260609-011', vehicleId: 'v4', driverName: '陈师傅', guideName: '王导', departTime: d(1, 8, 0), expectedReturn: d(1, 20, 0), actualReturn: '', status: 'PENDING' as const, isSupplement: false, remark: '香格里拉', createdBy: '调度员小李', createdAt: d(0), updatedAt: d(0) },
  { id: 'sch012', tripNo: 'TR-20260610-012', vehicleId: 'v1', driverName: '张师傅', guideName: '李导', departTime: d(2, 8, 0), expectedReturn: d(2, 18, 0), actualReturn: '', status: 'PENDING' as const, isSupplement: false, remark: '双廊古镇', createdBy: '调度员小王', createdAt: d(0), updatedAt: d(0) },
  { id: 'sch013', tripNo: 'TR-20260610-013', vehicleId: 'v3', driverName: '杨师傅', guideName: '周导', departTime: d(2, 10, 0), expectedReturn: d(2, 14, 0), actualReturn: '', status: 'PENDING' as const, isSupplement: true, remark: '临时市区送站（补录）', createdBy: '调度员小王', createdAt: d(0, 9, 0), updatedAt: d(0, 9, 0) },
  { id: 'sch014', tripNo: 'TR-20260611-014', vehicleId: 'v2', driverName: '刘师傅', guideName: '赵导', departTime: d(3, 8, 0), expectedReturn: d(3, 17, 0), actualReturn: '', status: 'PENDING' as const, isSupplement: false, remark: '虎跳峡', createdBy: '调度员小李', createdAt: d(0), updatedAt: d(0) },
  { id: 'sch015', tripNo: 'TR-20260612-015', vehicleId: 'v4', driverName: '陈师傅', guideName: '王导', departTime: d(4, 7, 0), expectedReturn: d(4, 19, 0), actualReturn: '', status: 'PENDING' as const, isSupplement: false, remark: '普达措国家公园', createdBy: '调度员小王', createdAt: d(0), updatedAt: d(0) },
]

export const mockSettlements = [
  { id: 'set001', scheduleId: 'sch001', baseFee: 1200, overtimeFee: 0, tollFee: 80, parkingFee: 30, totalFee: 1310, status: 'APPROVED' as const, reviewedBy: '财务张姐', reviewedAt: d(-6, 14, 0), createdBy: '调度员小王', createdAt: d(-6, 9, 0) },
  { id: 'set002', scheduleId: 'sch002', baseFee: 800, overtimeFee: 100, tollFee: 50, parkingFee: 20, totalFee: 970, status: 'APPROVED' as const, reviewedBy: '财务张姐', reviewedAt: d(-5, 10, 0), createdBy: '调度员小王', createdAt: d(-5, 8, 0) },
  { id: 'set003', scheduleId: 'sch003', baseFee: 2000, overtimeFee: 300, tollFee: 120, parkingFee: 40, totalFee: 2460, status: 'APPROVED' as const, reviewedBy: '财务张姐', reviewedAt: d(-4, 11, 0), createdBy: '调度员小李', createdAt: d(-4, 9, 0) },
  { id: 'set004', scheduleId: 'sch004', baseFee: 1200, overtimeFee: 0, tollFee: 60, parkingFee: 25, totalFee: 1285, status: 'REJECTED' as const, reviewedBy: '财务张姐', reviewedAt: d(-3, 15, 0), createdBy: '调度员小王', createdAt: d(-3, 9, 0) },
  { id: 'set005', scheduleId: 'sch005', baseFee: 400, overtimeFee: 50, tollFee: 30, parkingFee: 15, totalFee: 495, status: 'APPROVED' as const, reviewedBy: '财务张姐', reviewedAt: d(-2, 16, 0), createdBy: '调度员小王', createdAt: d(-2, 13, 0) },
  { id: 'set006', scheduleId: 'sch006', baseFee: 800, overtimeFee: 0, tollFee: 50, parkingFee: 20, totalFee: 870, status: 'PENDING_REVIEW' as const, reviewedBy: '', reviewedAt: '', createdBy: '调度员小李', createdAt: d(-1, 18, 0) },
  { id: 'set007', scheduleId: 'sch007', baseFee: 1800, overtimeFee: 150, tollFee: 100, parkingFee: 35, totalFee: 2085, status: 'PENDING_REVIEW' as const, reviewedBy: '', reviewedAt: '', createdBy: '调度员小王', createdAt: d(-1, 20, 0) },
  { id: 'set008', scheduleId: 'sch008', baseFee: 1200, overtimeFee: 0, tollFee: 80, parkingFee: 30, totalFee: 1310, status: 'PENDING_REVIEW' as const, reviewedBy: '', reviewedAt: '', createdBy: '调度员小王', createdAt: d(0, 8, 0) },
]

export const mockRejections = [
  { id: 'rej001', settlementId: 'set004', category: 'amount_anomaly' as const, reason: '路桥费与实际路线不符，请核实后重新提交', rejectedBy: '财务张姐', rejectedAt: d(-3, 15, 0), resubmittedBy: '', resubmittedAt: '', status: 'PENDING' as const },
  { id: 'rej002', settlementId: 'set002', category: 'voucher_missing' as const, reason: '超时费缺少导游签字确认单', rejectedBy: '财务张姐', rejectedAt: d(-20, 10, 0), resubmittedBy: '调度员小王', resubmittedAt: d(-18, 9, 0), status: 'RESOLVED' as const },
  { id: 'rej003', settlementId: 'set003', category: 'timeout_dispute' as const, reason: '超时1.5小时但超时费按2小时计', rejectedBy: '财务张姐', rejectedAt: d(-15, 11, 0), resubmittedBy: '调度员小李', resubmittedAt: d(-13, 14, 0), status: 'RESOLVED' as const },
]

export const mockExceptions = [
  { id: 'exc001', scheduleId: 'sch003', type: 'OVERTIME' as const, description: '返程途中遇大雾封路，延迟1.5小时', reportedBy: '车队老周', reportedAt: d(-5, 21, 30), status: 'resolved' as const },
  { id: 'exc002', scheduleId: 'sch007', type: 'DELAY' as const, description: '游客集合迟到导致出发延迟40分钟', reportedBy: '王导', reportedAt: d(-1, 7, 40), status: 'resolved' as const },
  { id: 'exc003', scheduleId: 'sch005', type: 'EMPTY_TRIP' as const, description: '接机航班取消，车辆空驶返回', reportedBy: '杨师傅', reportedAt: d(-3, 10, 0), status: 'resolved' as const },
  { id: 'exc004', scheduleId: 'sch008', type: 'DELAY' as const, description: '出发时车辆启动困难，延迟20分钟', reportedBy: '张师傅', reportedAt: d(0, 8, 20), status: 'pending' as const },
  { id: 'exc005', scheduleId: 'sch009', type: 'VEHICLE_CHANGE' as const, description: '原派车辆v3临检，更换备用车辆', reportedBy: '车队老周', reportedAt: d(0, 9, 0), status: 'pending' as const },
]

export const mockLogs = [
  { id: 'log001', entityType: 'schedule' as const, entityId: 'sch001', action: 'create' as const, operator: '调度员小王', operatorRole: 'dispatcher' as const, operatedAt: d(-8), beforeValue: null, afterValue: { tripNo: 'TR-20260601-001', status: 'PENDING' } },
  { id: 'log002', entityType: 'schedule' as const, entityId: 'sch001', action: 'depart' as const, operator: '车队老周', operatorRole: 'fleet_manager' as const, operatedAt: d(-7, 7, 30), beforeValue: { status: 'PENDING' }, afterValue: { status: 'DEPARTED' } },
  { id: 'log003', entityType: 'schedule' as const, entityId: 'sch001', action: 'return' as const, operator: '车队老周', operatorRole: 'fleet_manager' as const, operatedAt: d(-7, 18, 30), beforeValue: { status: 'DEPARTED' }, afterValue: { status: 'RETURNED' } },
  { id: 'log004', entityType: 'settlement' as const, entityId: 'set001', action: 'create' as const, operator: '调度员小王', operatorRole: 'dispatcher' as const, operatedAt: d(-6, 9, 0), beforeValue: null, afterValue: { scheduleId: 'sch001', totalFee: 1310 } },
  { id: 'log005', entityType: 'settlement' as const, entityId: 'set001', action: 'approve' as const, operator: '财务张姐', operatorRole: 'finance' as const, operatedAt: d(-6, 14, 0), beforeValue: { status: 'PENDING_REVIEW' }, afterValue: { status: 'APPROVED' } },
  { id: 'log006', entityType: 'schedule' as const, entityId: 'sch005', action: 'supplement' as const, operator: '调度员小王', operatorRole: 'dispatcher' as const, operatedAt: d(-3, 8, 0), beforeValue: null, afterValue: { tripNo: 'TR-20260605-005', isSupplement: true } },
  { id: 'log007', entityType: 'settlement' as const, entityId: 'set004', action: 'reject' as const, operator: '财务张姐', operatorRole: 'finance' as const, operatedAt: d(-3, 15, 0), beforeValue: { status: 'PENDING_REVIEW' }, afterValue: { status: 'REJECTED', reason: '路桥费与实际路线不符' } },
  { id: 'log008', entityType: 'exception' as const, entityId: 'exc003', action: 'exception_mark' as const, operator: '杨师傅', operatorRole: 'fleet_manager' as const, operatedAt: d(-3, 10, 0), beforeValue: null, afterValue: { type: 'EMPTY_TRIP', description: '接机航班取消' } },
  { id: 'log009', entityType: 'schedule' as const, entityId: 'sch008', action: 'depart' as const, operator: '车队老周', operatorRole: 'fleet_manager' as const, operatedAt: d(0, 8, 0), beforeValue: { status: 'PENDING' }, afterValue: { status: 'DEPARTED' } },
  { id: 'log010', entityType: 'schedule' as const, entityId: 'sch009', action: 'depart' as const, operator: '车队老周', operatorRole: 'fleet_manager' as const, operatedAt: d(0, 9, 30), beforeValue: { status: 'PENDING' }, afterValue: { status: 'DEPARTED' } },
  { id: 'log011', entityType: 'exception' as const, entityId: 'exc004', action: 'exception_mark' as const, operator: '张师傅', operatorRole: 'fleet_manager' as const, operatedAt: d(0, 8, 20), beforeValue: null, afterValue: { type: 'DELAY', description: '车辆启动困难' } },
  { id: 'log012', entityType: 'exception' as const, entityId: 'exc005', action: 'exception_mark' as const, operator: '车队老周', operatorRole: 'fleet_manager' as const, operatedAt: d(0, 9, 0), beforeValue: null, afterValue: { type: 'VEHICLE_CHANGE', description: '临检换车' } },
  { id: 'log013', entityType: 'settlement' as const, entityId: 'set006', action: 'create' as const, operator: '调度员小李', operatorRole: 'dispatcher' as const, operatedAt: d(-1, 18, 0), beforeValue: null, afterValue: { scheduleId: 'sch006', totalFee: 870 } },
  { id: 'log014', entityType: 'settlement' as const, entityId: 'set007', action: 'create' as const, operator: '调度员小王', operatorRole: 'dispatcher' as const, operatedAt: d(-1, 20, 0), beforeValue: null, afterValue: { scheduleId: 'sch007', totalFee: 2085 } },
  { id: 'log015', entityType: 'settlement' as const, entityId: 'set008', action: 'create' as const, operator: '调度员小王', operatorRole: 'dispatcher' as const, operatedAt: d(0, 8, 0), beforeValue: null, afterValue: { scheduleId: 'sch008', totalFee: 1310 } },
]

export const mockRiskItems = [
  { id: 'risk001', type: 'settlement_anomaly' as const, severity: 'high' as const, message: '结算单set004路桥费异常，已驳回待处理', relatedId: 'set004', read: false },
  { id: 'risk002', type: 'schedule_conflict' as const, severity: 'medium' as const, message: '6月10日车辆v1同时安排sch012与sch014，时间重叠', relatedId: 'sch012', read: false },
  { id: 'risk003', type: 'overdue_settlement' as const, severity: 'high' as const, message: '排班sch006已回车超过24小时，尚未提交结算', relatedId: 'sch006', read: false },
  { id: 'risk004', type: 'overdue_settlement' as const, severity: 'medium' as const, message: '排班sch007已回车，结算单set007待审核超过12小时', relatedId: 'set007', read: true },
]
