import type {
  AppState,
  User,
  Vehicle,
  Inspection,
  Rectification,
  Reinspection,
  OperationLog,
  DefectItem,
  RejectRecord,
  SupplementRecord,
  ScheduleRecord,
} from '@/types'

export const mockUsers: User[] = [
  { id: 'u1', name: '李接车', role: 'receiver', roleLabel: '接车员' },
  { id: 'u2', name: '王检测', role: 'inspector', roleLabel: '检测员' },
  { id: 'u3', name: '赵审核', role: 'auditor', roleLabel: '审核员' },
]

export const mockVehicles: Vehicle[] = [
  { id: 'v1', plateNumber: '京A·12345', vehicleType: 'sedan', vehicleTypeLabel: '轿车', ownerName: '张三', ownerPhone: '13800001111', firstRegisterDate: '2019-05-12', vin: 'LFV2A21K5N3012345' },
  { id: 'v2', plateNumber: '京B·88888', vehicleType: 'suv', vehicleTypeLabel: 'SUV', ownerName: '李四', ownerPhone: '13900002222', firstRegisterDate: '2020-08-20', vin: 'LFV2A21K5N3067890' },
  { id: 'v3', plateNumber: '京C·66666', vehicleType: 'truck', vehicleTypeLabel: '货车', ownerName: '王五', ownerPhone: '13700003333', firstRegisterDate: '2018-03-01', vin: 'LVBV3J9B6JE012345' },
  { id: 'v4', plateNumber: '京D·A1B2C', vehicleType: 'bus', vehicleTypeLabel: '客车', ownerName: '京通客运', ownerPhone: '13600004444', firstRegisterDate: '2017-11-15', vin: 'LFMAP22K3F0123456' },
  { id: 'v5', plateNumber: '京E·55555', vehicleType: 'van', vehicleTypeLabel: '面包车', ownerName: '赵六', ownerPhone: '13500005555', firstRegisterDate: '2021-01-30', vin: 'LZWADAGA8GB012345' },
  { id: 'v6', plateNumber: '京F·23456', vehicleType: 'sedan', vehicleTypeLabel: '轿车', ownerName: '孙七', ownerPhone: '13400006666', firstRegisterDate: '2016-07-08', vin: 'LFV2A21K5G3012345' },
  { id: 'v7', plateNumber: '京G·34567', vehicleType: 'truck', vehicleTypeLabel: '货车', ownerName: '周八', ownerPhone: '13300007777', firstRegisterDate: '2019-09-22', vin: 'LVBV3J9B6LE012345' },
  { id: 'v8', plateNumber: '京H·45678', vehicleType: 'suv', vehicleTypeLabel: 'SUV', ownerName: '吴九', ownerPhone: '13200008888', firstRegisterDate: '2022-02-14', vin: 'LFV2A21K5P3012345' },
  { id: 'v9', plateNumber: '京J·56789', vehicleType: 'sedan', vehicleTypeLabel: '轿车', ownerName: '郑十', ownerPhone: '13100009999', firstRegisterDate: '2020-12-03', vin: 'LFV2A21K5L3012345' },
  { id: 'v10', plateNumber: '京K·67890', vehicleType: 'van', vehicleTypeLabel: '面包车', ownerName: '钱十一', ownerPhone: '13000001010', firstRegisterDate: '2018-06-18', vin: 'LZWADAGA8JB012345' },
  { id: 'v11', plateNumber: '京L·78901', vehicleType: 'bus', vehicleTypeLabel: '客车', ownerName: '国都旅运', ownerPhone: '13000002020', firstRegisterDate: '2019-04-10', vin: 'LFMAP22K3K0123456' },
  { id: 'v12', plateNumber: '京M·89012', vehicleType: 'truck', vehicleTypeLabel: '货车', ownerName: '顺通物流', ownerPhone: '13000003030', firstRegisterDate: '2021-10-05', vin: 'LVBV3J9B6ME012345' },
  { id: 'v13', plateNumber: '京N·90123', vehicleType: 'sedan', vehicleTypeLabel: '轿车', ownerName: '冯十二', ownerPhone: '13000004040', firstRegisterDate: '2017-02-28', vin: 'LFV2A21K5H3012345' },
  { id: 'v14', plateNumber: '京P·01234', vehicleType: 'suv', vehicleTypeLabel: 'SUV', ownerName: '陈十三', ownerPhone: '13000005050', firstRegisterDate: '2023-01-11', vin: 'LFV2A21K5R3012345' },
  { id: 'v15', plateNumber: '京Q·11111', vehicleType: 'sedan', vehicleTypeLabel: '轿车', ownerName: '褚十四', ownerPhone: '13000006060', firstRegisterDate: '2015-08-19', vin: 'LFV2A21K5F3012345' },
]

const defectPresets: DefectItem[] = [
  { code: 'B001', name: '制动性能不足', category: '制动', description: '制动力总和小于轴重的60%', severity: 'critical' },
  { code: 'B002', name: '左右制动力差超标', category: '制动', description: '同轴左右制动力差大于20%', severity: 'major' },
  { code: 'L001', name: '前照灯远光亮度不足', category: '灯光', description: '远光光束发光强度小于15000cd', severity: 'minor' },
  { code: 'L002', name: '灯光偏移', category: '灯光', description: '近光光束垂直偏移超标', severity: 'minor' },
  { code: 'E001', name: '尾气排放超标', category: '排放', description: 'CO排放超过限值1.0%', severity: 'major' },
  { code: 'E002', name: 'OBD故障码', category: '排放', description: '检测到P0420催化器效率低', severity: 'major' },
  { code: 'S001', name: '侧滑量超标', category: '转向', description: '侧滑量大于±5m/km', severity: 'major' },
  { code: 'T001', name: '轮胎花纹深度不足', category: '底盘', description: '转向轮花纹深度小于1.6mm', severity: 'critical' },
  { code: 'H001', name: '喇叭声级不足', category: '车身', description: '喇叭声级低于90dB(A)', severity: 'minor' },
]

const now = new Date('2026-06-14T09:30:00')
const timeOffset = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString()
const timeAdd = (iso: string, days: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString()
}
const uid = (p = '') => p + Math.random().toString(36).slice(2, 10)

export const mockInspections: Inspection[] = [
  { id: 'i1', vehicleId: 'v1', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 2 - 120), result: 'failed', odometer: 82340, lane: '1号线', defectItems: [defectPresets[0], defectPresets[2]], remark: '刹车明显疲软' },
  { id: 'i2', vehicleId: 'v2', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 - 180), result: 'failed', odometer: 56120, lane: '2号线', defectItems: [defectPresets[4]] },
  { id: 'i3', vehicleId: 'v3', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 6), result: 'failed', odometer: 210340, lane: '3号线', defectItems: [defectPresets[1], defectPresets[7]], remark: '左前轮胎已磨平' },
  { id: 'i4', vehicleId: 'v4', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 3), result: 'failed', odometer: 420100, lane: '2号线', defectItems: [defectPresets[0], defectPresets[6]] },
  { id: 'i5', vehicleId: 'v5', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 5), result: 'failed', odometer: 98500, lane: '1号线', defectItems: [defectPresets[3], defectPresets[8]] },
  { id: 'i6', vehicleId: 'v6', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 22), result: 'failed', odometer: 155000, lane: '3号线', defectItems: [defectPresets[5]] },
  { id: 'i7', vehicleId: 'v7', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 1.5), result: 'failed', odometer: 320600, lane: '1号线', defectItems: [defectPresets[0], defectPresets[4], defectPresets[7]] },
  { id: 'i8', vehicleId: 'v8', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 3), result: 'failed', odometer: 18700, lane: '2号线', defectItems: [defectPresets[2]] },
  { id: 'i9', vehicleId: 'v9', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 7), result: 'failed', odometer: 66200, lane: '1号线', defectItems: [defectPresets[6]] },
  { id: 'i10', vehicleId: 'v10', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 50), result: 'failed', odometer: 132400, lane: '3号线', defectItems: [defectPresets[1]] },
  { id: 'i11', vehicleId: 'v11', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 4), result: 'failed', odometer: 520800, lane: '2号线', defectItems: [defectPresets[0], defectPresets[4]] },
  { id: 'i12', vehicleId: 'v12', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 80), result: 'failed', odometer: 280000, lane: '1号线', defectItems: [defectPresets[5], defectPresets[7]] },
  { id: 'i13', vehicleId: 'v13', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 10), result: 'passed', odometer: 110500, lane: '1号线', defectItems: [] },
  { id: 'i14', vehicleId: 'v14', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 8), result: 'passed', odometer: 8000, lane: '2号线', defectItems: [] },
  { id: 'i15', vehicleId: 'v15', inspectorId: 'u2', inspectorName: '王检测', inspectTime: timeOffset(60 * 24 * 12), result: 'passed', odometer: 210000, lane: '3号线', defectItems: [] },
]

const makeRejectHistory = (count: number): RejectRecord[] => {
  const arr: RejectRecord[] = []
  for (let i = 0; i < count; i++) {
    arr.push({
      id: uid('rej_'),
      auditorId: 'u3',
      auditorName: '赵审核',
      reason: count === 2
        ? (i === 0
            ? '首次上传照片无日期戳，无法确认维修时间'
            : '第二次整改照片模糊，无法确认刹车片已更换，请到指定修理厂维修并上传完整凭证')
        : (i === 0
            ? '仅提供沟通截图，未上传维修凭证'
            : '整改凭证不完整'),
      timestamp: timeOffset(60 * 24 * (i + 1)),
      rejectedItems: count === 2 ? ['B001', 'L001'] : ['B002'],
    })
  }
  return arr
}

const makeSuppHistory = (count: number): SupplementRecord[] => {
  const arr: SupplementRecord[] = []
  for (let i = 0; i < count; i++) {
    arr.push({
      id: uid('sup_'),
      handlerId: 'u1',
      handlerName: '李接车',
      materials: i === 0
        ? [{ name: '微信沟通截图.png', type: 'screenshot', uploadedAt: timeOffset(60 * 40), uploadedBy: '李接车' }]
        : [{ name: `维修凭证补录${i + 1}.jpg`, type: 'receipt', uploadedAt: timeOffset(60 * 30 * (i + 1)), uploadedBy: '李接车' }],
      description: i === 0 ? '首次提交整改材料' : `第 ${i + 1} 次补录`,
      timestamp: timeOffset(60 * 30 * (i + 1)),
    })
  }
  return arr
}

export const mockRectifications: Rectification[] = [
  {
    id: 'r1', inspectionId: 'i3', vehicleId: 'v3', status: 'pending', rejectCount: 0,
    materials: [], deadline: timeAdd(timeOffset(0), 1), handlerId: 'u1', handlerName: '李接车',
    description: '需更换刹车片与左前轮胎', rejectHistory: [], supplementHistory: [],
  },
  {
    id: 'r2', inspectionId: 'i8', vehicleId: 'v8', status: 'pending', rejectCount: 0,
    materials: [], deadline: timeAdd(timeOffset(0), 2), handlerId: 'u1', handlerName: '李接车',
    description: '前照灯亮度不足，需调整或更换灯泡', rejectHistory: [], supplementHistory: [],
  },
  {
    id: 'r3', inspectionId: 'i10', vehicleId: 'v10', status: 'rejected', rejectCount: 1,
    materials: [{ name: '微信沟通截图.png', type: 'screenshot', uploadedAt: timeOffset(60 * 40), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), -1), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 45),
    description: '同轴制动力差超标',
    rejectHistory: makeRejectHistory(1),
    supplementHistory: makeSuppHistory(1),
    latestRejectReason: '仅提供沟通截图，未上传维修厂盖章的正式维修凭证',
  },
  {
    id: 'r4', inspectionId: 'i12', vehicleId: 'v12', status: 'submitted', rejectCount: 0,
    materials: [
      { name: '维修发票.jpg', type: 'receipt', uploadedAt: timeOffset(60 * 70), uploadedBy: '李接车' },
      { name: '更换轮胎照片.jpg', type: 'photo', uploadedAt: timeOffset(60 * 72), uploadedBy: '李接车' },
    ],
    deadline: timeAdd(timeOffset(0), 1), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 70),
    description: 'OBD故障码、轮胎磨损',
    rejectHistory: [], supplementHistory: makeSuppHistory(1),
  },
  {
    id: 'r5', inspectionId: 'i6', vehicleId: 'v6', status: 'submitted', rejectCount: 0,
    materials: [{ name: '三元催化维修单.pdf', type: 'receipt', uploadedAt: timeOffset(60 * 60 * 20), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), 3), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 20),
    description: 'OBD故障码P0420',
    rejectHistory: [], supplementHistory: makeSuppHistory(1),
  },
  {
    id: 'r6', inspectionId: 'i1', vehicleId: 'v1', status: 'rejected', rejectCount: 2,
    materials: [{ name: '维修店照片1.jpg', type: 'photo', uploadedAt: timeOffset(60 * 60 * 24 * 1.5), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), -2), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 24),
    auditorId: 'u3', auditorName: '赵审核', auditedAt: timeOffset(60 * 60 * 24 + 1800),
    description: '制动性能不足 + 灯光亮度不足',
    rejectHistory: makeRejectHistory(2),
    supplementHistory: makeSuppHistory(2),
    latestRejectReason: '第二次整改照片模糊，无法确认刹车片已更换，请到指定修理厂维修并上传完整凭证',
  },
  {
    id: 'r7', inspectionId: 'i2', vehicleId: 'v2', status: 'rejected', rejectCount: 1,
    materials: [{ name: '尾气复检单.png', type: 'receipt', uploadedAt: timeOffset(60 * 60 * 18), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), 0), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 18),
    auditorId: 'u3', auditorName: '赵审核', auditedAt: timeOffset(60 * 60 * 18 + 2400),
    description: '尾气CO超标',
    rejectHistory: [{
      id: uid('rej_'), auditorId: 'u3', auditorName: '赵审核',
      reason: '未在正规M站维修，数据无效，请至具有M站资质的维修厂维修后提交',
      timestamp: timeOffset(60 * 60 * 18 + 2400),
      rejectedItems: ['E001'],
    }],
    supplementHistory: makeSuppHistory(1),
    latestRejectReason: '未在正规M站维修，数据无效，请重新维修后提交',
  },
  {
    id: 'r8', inspectionId: 'i4', vehicleId: 'v4', status: 'passed', rejectCount: 0,
    materials: [{ name: '制动器维修凭证.jpg', type: 'receipt', uploadedAt: timeOffset(60 * 60 * 24 * 2.5), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), 5), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 24 * 2.5),
    auditorId: 'u3', auditorName: '赵审核', auditedAt: timeOffset(60 * 60 * 24 * 2.5 + 3600),
    description: '制动性能 + 侧滑', rejectHistory: [], supplementHistory: makeSuppHistory(1),
  },
  {
    id: 'r9', inspectionId: 'i5', vehicleId: 'v5', status: 'passed', rejectCount: 1,
    materials: [{ name: '调整灯光照片.jpg', type: 'photo', uploadedAt: timeOffset(60 * 60 * 24 * 4), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), 8), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 24 * 4),
    auditorId: 'u3', auditorName: '赵审核', auditedAt: timeOffset(60 * 60 * 24 * 4 + 1800),
    description: '灯光偏移 + 喇叭声级',
    rejectHistory: [{
      id: uid('rej_'), auditorId: 'u3', auditorName: '赵审核',
      reason: '首次上传照片无日期戳，请重新拍摄含当日日期的照片',
      timestamp: timeOffset(60 * 60 * 24 * 3.5),
      rejectedItems: ['L002'],
    }],
    supplementHistory: makeSuppHistory(2),
    latestRejectReason: '首次上传无日期戳',
  },
  {
    id: 'r10', inspectionId: 'i7', vehicleId: 'v7', status: 'passed', rejectCount: 0,
    materials: [{ name: '全套维修凭证.zip', type: 'other', uploadedAt: timeOffset(60 * 60 * 24 * 1.2), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), 4), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 24 * 1.2),
    auditorId: 'u3', auditorName: '赵审核', auditedAt: timeOffset(60 * 60 * 24 * 1.2 + 5400),
    description: '制动/尾气/轮胎 多项不合格', rejectHistory: [], supplementHistory: makeSuppHistory(1),
  },
  {
    id: 'r11', inspectionId: 'i9', vehicleId: 'v9', status: 'passed', rejectCount: 0,
    materials: [{ name: '四轮定位单据.jpg', type: 'receipt', uploadedAt: timeOffset(60 * 60 * 24 * 6), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), 10), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 24 * 6),
    auditorId: 'u3', auditorName: '赵审核', auditedAt: timeOffset(60 * 60 * 24 * 6 + 3000),
    description: '侧滑量超标', rejectHistory: [], supplementHistory: makeSuppHistory(1),
  },
  {
    id: 'r12', inspectionId: 'i11', vehicleId: 'v11', status: 'passed', rejectCount: 2,
    materials: [{ name: '大修凭证.pdf', type: 'receipt', uploadedAt: timeOffset(60 * 60 * 24 * 3.5), uploadedBy: '李接车' }],
    deadline: timeAdd(timeOffset(0), 6), handlerId: 'u1', handlerName: '李接车',
    submittedAt: timeOffset(60 * 60 * 24 * 3.5),
    auditorId: 'u3', auditorName: '赵审核', auditedAt: timeOffset(60 * 60 * 24 * 3.5 + 7200),
    description: '大客车制动 + 尾气严重不合格',
    rejectHistory: makeRejectHistory(2),
    supplementHistory: makeSuppHistory(3),
    latestRejectReason: '前两次提交凭证不完整',
  },
]

const makeSchedHistory = (count: number, lane: string, baseIso: string): ScheduleRecord[] => {
  const arr: ScheduleRecord[] = []
  for (let i = 0; i < count; i++) {
    const rec: ScheduleRecord = {
      id: uid('sch_'),
      arrangedById: 'u3',
      arrangedByName: '赵审核',
      scheduledTime: i === count - 1
        ? baseIso
        : timeAdd(baseIso, -i - 1),
      lane: i === count - 1 ? lane : (i % 2 === 0 ? '1号线' : '2号线'),
      timestamp: timeOffset(60 * 60 * (i + 1)),
    }
    if (i < count - 1) {
      rec.cancelReason = i === 0 ? '车主临时有事改约' : '检测线设备维护'
      rec.cancelledAt = timeOffset(60 * 60 * i + 1800)
    }
    arr.push(rec)
  }
  return arr
}

export const mockReinspections: Reinspection[] = [
  {
    id: 're1', inspectionId: 'i8', vehicleId: 'v8', status: 'pending',
    scheduleHistory: [],
    remark: '整改已通过，待安排复检时间',
  },
  {
    id: 're2', inspectionId: 'i10', vehicleId: 'v10', status: 'pending',
    scheduleHistory: [],
    remark: '补录后待安排',
  },
  {
    id: 're3', inspectionId: 'i1', vehicleId: 'v1', status: 'abnormal',
    scheduledTime: timeAdd(timeOffset(0), -1).slice(0, 10) + 'T10:00:00',
    lane: '1号线',
    arrangedBy: 'u3', arrangedByName: '赵审核', arrangedAt: timeOffset(60 * 60 * 24),
    abnormalReason: '车主两次爽约未到，电话无人接听，需联系确认',
    scheduleHistory: makeSchedHistory(2, '1号线', timeAdd(timeOffset(0), -1).slice(0, 10) + 'T10:00:00'),
  },
  {
    id: 're4', inspectionId: 'i6', vehicleId: 'v6', status: 'scheduled',
    arrangedBy: 'u3', arrangedByName: '赵审核', arrangedAt: timeOffset(60 * 60),
    scheduledTime: timeAdd(timeOffset(0), 1).slice(0, 10) + 'T10:00:00',
    lane: '2号线',
    scheduleHistory: makeSchedHistory(1, '2号线', timeAdd(timeOffset(0), 1).slice(0, 10) + 'T10:00:00'),
  },
  {
    id: 're5', inspectionId: 'i12', vehicleId: 'v12', status: 'scheduled',
    arrangedBy: 'u3', arrangedByName: '赵审核', arrangedAt: timeOffset(60 * 30),
    scheduledTime: timeAdd(timeOffset(0), 0).slice(0, 10) + 'T14:30:00',
    lane: '3号线',
    scheduleHistory: makeSchedHistory(1, '3号线', timeAdd(timeOffset(0), 0).slice(0, 10) + 'T14:30:00'),
  },
  {
    id: 're6', inspectionId: 'i4', vehicleId: 'v4', status: 'completed',
    arrangedBy: 'u3', arrangedByName: '赵审核', arrangedAt: timeOffset(60 * 60 * 24 * 2),
    scheduledTime: timeAdd(timeOffset(0), 3).slice(0, 10) + 'T09:00:00',
    lane: '2号线',
    inspectorId: 'u2', inspectorName: '王检测',
    completedAt: timeOffset(60 * 60 * 24 * 2 + 5400),
    result: 'passed',
    scheduleHistory: makeSchedHistory(1, '2号线', timeAdd(timeOffset(0), 3).slice(0, 10) + 'T09:00:00'),
    resultDetail: {
      passedItems: ['制动性能不足', '侧滑量超标'],
      failedItems: [],
      completedBy: '王检测',
      completedAt: timeOffset(60 * 60 * 24 * 2 + 5400),
    },
  },
  {
    id: 're7', inspectionId: 'i5', vehicleId: 'v5', status: 'completed',
    arrangedBy: 'u3', arrangedByName: '赵审核', arrangedAt: timeOffset(60 * 60 * 24 * 3.5),
    scheduledTime: timeAdd(timeOffset(0), 5).slice(0, 10) + 'T11:00:00',
    lane: '1号线',
    inspectorId: 'u2', inspectorName: '王检测',
    completedAt: timeOffset(60 * 60 * 24 * 3.5 + 2400),
    result: 'passed',
    scheduleHistory: makeSchedHistory(2, '1号线', timeAdd(timeOffset(0), 5).slice(0, 10) + 'T11:00:00'),
    resultDetail: {
      passedItems: ['灯光偏移', '喇叭声级不足'],
      failedItems: [],
      completedBy: '王检测',
      completedAt: timeOffset(60 * 60 * 24 * 3.5 + 2400),
    },
  },
  {
    id: 're8', inspectionId: 'i9', vehicleId: 'v9', status: 'completed',
    arrangedBy: 'u3', arrangedByName: '赵审核', arrangedAt: timeOffset(60 * 60 * 24 * 5.5),
    scheduledTime: timeAdd(timeOffset(0), 7).slice(0, 10) + 'T15:00:00',
    lane: '3号线',
    inspectorId: 'u2', inspectorName: '王检测',
    completedAt: timeOffset(60 * 60 * 24 * 5.5 + 3600),
    result: 'passed',
    scheduleHistory: makeSchedHistory(1, '3号线', timeAdd(timeOffset(0), 7).slice(0, 10) + 'T15:00:00'),
    resultDetail: {
      passedItems: ['侧滑量超标'],
      failedItems: [],
      completedBy: '王检测',
      completedAt: timeOffset(60 * 60 * 24 * 5.5 + 3600),
    },
  },
]

function buildLogs(): OperationLog[] {
  const logs: OperationLog[] = []
  const mk = (partial: Partial<OperationLog>): OperationLog => ({
    id: uid('log_'),
    vehicleId: '',
    operatorId: 'u1',
    operatorName: '李接车',
    operatorRole: 'receiver',
    operatorRoleLabel: '接车员',
    action: '创建整改任务',
    content: '',
    timestamp: new Date().toISOString(),
    ...partial,
  } as OperationLog)

  mockInspections.forEach(ins => {
    logs.push(mk({
      vehicleId: ins.vehicleId, inspectionId: ins.id,
      operatorId: 'u2', operatorName: '王检测',
      operatorRole: 'inspector', operatorRoleLabel: '检测员',
      action: '检测完成',
      content: ins.result === 'passed' ? '全部项目合格' : `不合格项：${ins.defectItems.map(d => d.name).join('、')}`,
      timestamp: ins.inspectTime,
    }))
  })

  mockRectifications.forEach(r => {
    logs.push(mk({
      vehicleId: r.vehicleId, rectificationId: r.id,
      operatorId: 'u1', operatorName: '李接车',
      operatorRole: 'receiver', operatorRoleLabel: '接车员',
      action: '创建整改任务',
      content: r.description || '整改任务已派发',
      timestamp: timeOffset(60 * 60 * 12),
    }))
    r.supplementHistory.forEach(sup => {
      logs.push(mk({
        vehicleId: r.vehicleId, rectificationId: r.id,
        operatorId: sup.handlerId, operatorName: sup.handlerName,
        operatorRole: 'receiver', operatorRoleLabel: '接车员',
        action: r.rejectCount > 0 && sup !== r.supplementHistory[0] ? '补录整改材料' : '提交整改材料',
        content: sup.description,
        timestamp: sup.timestamp,
      }))
    })
    r.rejectHistory.forEach(rej => {
      logs.push(mk({
        vehicleId: r.vehicleId, rectificationId: r.id,
        operatorId: rej.auditorId, operatorName: rej.auditorName,
        operatorRole: 'auditor', operatorRoleLabel: '审核员',
        action: '驳回整改',
        content: rej.reason,
        timestamp: rej.timestamp,
      }))
    })
    if (r.status === 'passed' && r.auditedAt) {
      logs.push(mk({
        vehicleId: r.vehicleId, rectificationId: r.id,
        operatorId: r.auditorId!, operatorName: r.auditorName!,
        operatorRole: 'auditor', operatorRoleLabel: '审核员',
        action: '审核通过',
        content: `整改合格，${r.rejectCount > 0 ? `历经 ${r.rejectCount} 次驳回后通过` : '一次通过'}，已进入复检安排`,
        timestamp: r.auditedAt,
      }))
    }
  })

  mockReinspections.forEach(re => {
    re.scheduleHistory.forEach((sch, idx) => {
      if (idx === re.scheduleHistory.length - 1 || !sch.cancelReason) {
        logs.push(mk({
          vehicleId: re.vehicleId, reinspectionId: re.id,
          operatorId: sch.arrangedById, operatorName: sch.arrangedByName,
          operatorRole: 'auditor', operatorRoleLabel: '审核员',
          action: idx === 0 ? '安排复检' : '改排复检',
          content: `${sch.scheduledTime.slice(0, 16).replace('T', ' ')} · ${sch.lane}`,
          timestamp: sch.timestamp,
        }))
      }
      if (sch.cancelReason && sch.cancelledAt) {
        logs.push(mk({
          vehicleId: re.vehicleId, reinspectionId: re.id,
          operatorId: 'u3', operatorName: '赵审核',
          operatorRole: 'auditor', operatorRoleLabel: '审核员',
          action: '取消复检安排',
          content: sch.cancelReason,
          timestamp: sch.cancelledAt,
        }))
      }
    })
    if (re.status === 'completed' && re.completedAt) {
      logs.push(mk({
        vehicleId: re.vehicleId, reinspectionId: re.id,
        operatorId: re.inspectorId!, operatorName: re.inspectorName!,
        operatorRole: 'inspector', operatorRoleLabel: '检测员',
        action: '复检完成',
        content: re.result === 'passed' ? '复检合格' : '复检仍不合格',
        timestamp: re.completedAt,
      }))
    }
    if (re.status === 'abnormal') {
      logs.push(mk({
        vehicleId: re.vehicleId, reinspectionId: re.id,
        operatorId: 'u3', operatorName: '赵审核',
        operatorRole: 'auditor', operatorRoleLabel: '审核员',
        action: '复检异常',
        content: re.abnormalReason || '异常',
        timestamp: timeOffset(60 * 60 * 2),
      }))
    }
  })

  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export const mockLogs: OperationLog[] = buildLogs()

export const initialState: AppState = {
  currentUser: mockUsers[0],
  users: mockUsers,
  vehicles: mockVehicles,
  inspections: mockInspections,
  rectifications: mockRectifications,
  reinspections: mockReinspections,
  logs: mockLogs,
}
