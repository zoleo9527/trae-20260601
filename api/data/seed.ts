import type {
  Project, CableType, Team, Requisition, CheckIn,
  CablePoint, Shortage, ReturnRecord
} from '../../shared/types'

export const projects: Project[] = [
  {
    id: 'p1',
    name: '智慧园区A栋弱电工程',
    address: '上海市浦东新区张江高科技园区博云路2号',
    manager: '王建国',
    status: 'active',
    startDate: '2026-05-15'
  },
  {
    id: 'p2',
    name: '数据中心机房综合布线',
    address: '北京市海淀区永丰产业基地丰德东路10号',
    manager: '李明远',
    status: 'active',
    startDate: '2026-06-01'
  }
]

export const cables: CableType[] = [
  {
    id: 'c1',
    model: 'CAT6-305',
    name: '六类非屏蔽双绞线',
    unit: '卷(305米)',
    spec: 'UTP CAT6 23AWG 4PR PVC',
    stock: 86,
    designQty: 20
  },
  {
    id: 'c2',
    model: 'CAT6A-305',
    name: '六类增强型屏蔽双绞线',
    unit: '卷(305米)',
    spec: 'FTP CAT6A 23AWG 4PR LSZH',
    stock: 42,
    designQty: 10
  },
  {
    id: 'c3',
    model: 'SMF-9/125-12',
    name: '单模室外光缆12芯',
    unit: '米',
    spec: 'GYTA-12B1.3 金属铠装',
    stock: 5200,
    designQty: 3000
  },
  {
    id: 'c4',
    model: 'RVV-2x1.5',
    name: '聚氯乙烯护套电源线',
    unit: '米',
    spec: 'RVV 300/500V 2×1.5mm²',
    stock: 8600,
    designQty: 5000
  }
]

export const teams: Team[] = [
  {
    id: 't1',
    name: '张伟施工班',
    leader: '张伟',
    phone: '138-0000-1001',
    members: ['张伟', '陈涛', '刘海']
  },
  {
    id: 't2',
    name: '李强施工班',
    leader: '李强',
    phone: '139-0000-1002',
    members: ['李强', '王磊', '赵强', '孙明']
  }
]

const photoUrls = (seed: number, count: number) =>
  Array.from({ length: count }, (_, i) =>
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
      `弱电施工现场 线缆布线 接线盒 配线架 工业感 专业摄影 第${seed + i}张`
    )}&image_size=square`
  )

export const requisitions: Requisition[] = [
  {
    id: 'r1',
    code: 'LL-20260601-001',
    projectId: 'p1',
    teamId: 't1',
    items: [
      { cableId: 'c1', cableModel: 'CAT6-305', cableName: '六类非屏蔽双绞线', quantity: 10, designQty: 10, overFlag: false }
    ],
    status: 'completed',
    tags: ['normal'],
    applicant: '张伟',
    applyTime: '2026-06-01 08:30:00',
    approver: '王建国',
    approveTime: '2026-06-01 09:15:00',
    approverRemark: '用量合理，同意发放',
    issuer: '仓库刘主管',
    issueTime: '2026-06-01 10:00:00',
    remark: 'A栋1-3层点位布线'
  },
  {
    id: 'r2',
    code: 'LL-20260602-002',
    projectId: 'p1',
    teamId: 't2',
    items: [
      { cableId: 'c1', cableModel: 'CAT6-305', cableName: '六类非屏蔽双绞线', quantity: 25, designQty: 20, overFlag: true },
      { cableId: 'c4', cableModel: 'RVV-2x1.5', cableName: '聚氯乙烯护套电源线', quantity: 2500, designQty: 2000, overFlag: true }
    ],
    status: 'issued',
    tags: ['over'],
    applicant: '李强',
    applyTime: '2026-06-02 08:45:00',
    approver: '王建国',
    approveTime: '2026-06-02 09:30:00',
    approverRemark: '超领25%，要求施工后退回剩余材料并附使用明细',
    issuer: '仓库刘主管',
    issueTime: '2026-06-02 10:15:00',
    remark: 'A栋4-8层主干布线，包含预留冗余'
  },
  {
    id: 'r3',
    code: 'LL-20260603-003',
    projectId: 'p1',
    teamId: 't1',
    items: [
      { cableId: 'c2', cableModel: 'CAT6A-305', cableName: '六类增强型屏蔽双绞线', quantity: 5, designQty: 5, overFlag: false }
    ],
    status: 'completed',
    tags: ['wrong'],
    applicant: '张伟',
    applyTime: '2026-06-03 08:20:00',
    approver: '王建国',
    approveTime: '2026-06-03 09:00:00',
    approverRemark: '机房专用线缆',
    issuer: '仓库刘主管',
    issueTime: '2026-06-03 09:45:00',
    relatedId: 'r1',
    remark: '【错领】现场需CAT6误领CAT6A，已调换3卷回CAT6，2卷机房自留'
  },
  {
    id: 'r4',
    code: 'LL-20260604-004',
    projectId: 'p1',
    teamId: 't2',
    items: [
      { cableId: 'c1', cableModel: 'CAT6-305', cableName: '六类非屏蔽双绞线', quantity: 5, designQty: 0, overFlag: false }
    ],
    status: 'issued',
    tags: ['supplement'],
    applicant: '李强',
    applyTime: '2026-06-04 09:30:00',
    approver: '王建国',
    approveTime: '2026-06-04 10:00:00',
    approverRemark: '关联缺料单QL-20260603-001，紧急补领，即日送达',
    issuer: '仓库刘主管',
    issueTime: '2026-06-04 11:00:00',
    relatedId: 's1',
    remark: '【补领】B区主干布线路由变更导致缺料'
  },
  {
    id: 'r5',
    code: 'LL-20260605-005',
    projectId: 'p2',
    teamId: 't1',
    items: [
      { cableId: 'c3', cableModel: 'SMF-9/125-12', cableName: '单模室外光缆12芯', quantity: 1500, designQty: 1500, overFlag: false }
    ],
    status: 'pending',
    tags: ['normal'],
    applicant: '张伟',
    applyTime: '2026-06-05 08:50:00',
    remark: '数据中心园区主干光缆敷设'
  },
  {
    id: 'r6',
    code: 'LL-20260605-006',
    projectId: 'p2',
    teamId: 't2',
    items: [
      { cableId: 'c2', cableModel: 'CAT6A-305', cableName: '六类增强型屏蔽双绞线', quantity: 30, designQty: 28, overFlag: true },
      { cableId: 'c4', cableModel: 'RVV-2x1.5', cableName: '聚氯乙烯护套电源线', quantity: 3000, designQty: 2800, overFlag: true }
    ],
    status: 'pending',
    tags: ['over'],
    applicant: '李强',
    applyTime: '2026-06-05 09:15:00',
    remark: '机房列头柜至机柜配线，含7%预留'
  },
  {
    id: 'r7',
    code: 'LL-20260605-007',
    projectId: 'p1',
    teamId: 't1',
    items: [
      { cableId: 'c1', cableModel: 'CAT6-305', cableName: '六类非屏蔽双绞线', quantity: 15, designQty: 15, overFlag: false }
    ],
    status: 'approved',
    tags: ['normal'],
    applicant: '张伟',
    applyTime: '2026-06-05 10:00:00',
    approver: '王建国',
    approveTime: '2026-06-05 10:30:00',
    approverRemark: '同意发放，请仓库按单发料',
    remark: 'A栋9-12层办公区点位布线'
  },
  {
    id: 'r8',
    code: 'LL-20260605-008',
    projectId: 'p1',
    teamId: 't2',
    items: [
      { cableId: 'c1', cableModel: 'CAT6-305', cableName: '六类非屏蔽双绞线', quantity: 50, designQty: 10, overFlag: true }
    ],
    status: 'rejected',
    tags: ['over'],
    applicant: '李强',
    applyTime: '2026-06-05 11:00:00',
    approver: '王建国',
    approveTime: '2026-06-05 11:20:00',
    approverRemark: '超领400%，严重超出设计用量，请重新核实需求后再提交',
    remark: 'B区扩容，预估量偏大'
  }
]

export const checkins: CheckIn[] = [
  {
    id: 'ck1',
    projectId: 'p1',
    teamId: 't1',
    checkInTime: '2026-06-02 07:45:00',
    checkOutTime: '2026-06-02 18:05:00',
    location: { lat: 31.2048, lng: 121.5970, address: '张江博云路2号A栋1层' },
    workers: ['张伟', '陈涛', '刘海'],
    weather: '晴',
    remark: '今日计划完成1层50个点位'
  },
  {
    id: 'ck2',
    projectId: 'p1',
    teamId: 't2',
    checkInTime: '2026-06-03 07:50:00',
    checkOutTime: '2026-06-03 18:20:00',
    location: { lat: 31.2048, lng: 121.5970, address: '张江博云路2号A栋4层' },
    workers: ['李强', '王磊', '赵强', '孙明'],
    weather: '多云',
    remark: '4层主干布放，进度60%'
  },
  {
    id: 'ck3',
    projectId: 'p1',
    teamId: 't2',
    checkInTime: '2026-06-04 07:55:00',
    checkOutTime: '2026-06-04 17:30:00',
    location: { lat: 31.2048, lng: 121.5970, address: '张江博云路2号A栋6层' },
    workers: ['李强', '王磊', '赵强', '孙明'],
    weather: '小雨',
    remark: '等待补料到10点半，下午继续6层'
  },
  {
    id: 'ck4',
    projectId: 'p1',
    teamId: 't1',
    checkInTime: '2026-06-05 08:00:00',
    checkOutTime: undefined,
    location: { lat: 31.2048, lng: 121.5970, address: '张江博云路2号A栋机房' },
    workers: ['张伟', '陈涛', '刘海'],
    weather: '晴',
    remark: '剩余材料整理退回，终端打标'
  }
]

export const points: CablePoint[] = [
  { id: 'pt1', checkInId: 'ck1', requisitionId: 'r1', projectId: 'p1', pointCode: 'A-01-001', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 28, startPoint: '1FD-MDF-01', endPoint: '1F-办公区-工位01', photos: photoUrls(1, 2), tester: '陈涛', testResult: 'pass', remark: '水平链路，FLUKE测试合格', createTime: '2026-06-02 10:30:00' },
  { id: 'pt2', checkInId: 'ck1', requisitionId: 'r1', projectId: 'p1', pointCode: 'A-01-002', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 32, startPoint: '1FD-MDF-01', endPoint: '1F-办公区-工位02', photos: photoUrls(3, 2), tester: '陈涛', testResult: 'pass', remark: '水平链路', createTime: '2026-06-02 11:00:00' },
  { id: 'pt3', checkInId: 'ck1', requisitionId: 'r1', projectId: 'p1', pointCode: 'A-01-003', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 25, startPoint: '1FD-MDF-01', endPoint: '1F-办公区-工位03', photos: photoUrls(5, 2), tester: '陈涛', testResult: 'pass', remark: '水平链路', createTime: '2026-06-02 11:30:00' },
  { id: 'pt4', checkInId: 'ck1', requisitionId: 'r1', projectId: 'p1', pointCode: 'A-01-025', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 40, startPoint: '1FD-MDF-01', endPoint: '1F-会议室-投影', photos: photoUrls(7, 2), tester: '刘海', testResult: 'pass', remark: '超长链路，双端加固', createTime: '2026-06-02 15:00:00' },
  { id: 'pt5', checkInId: 'ck1', requisitionId: 'r1', projectId: 'p1', pointCode: 'A-01-050', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 35, startPoint: '1FD-MDF-02', endPoint: '1F-前台-信息点', photos: photoUrls(9, 2), tester: '刘海', testResult: 'pass', remark: '', createTime: '2026-06-02 17:20:00' },
  { id: 'pt6', checkInId: 'ck2', requisitionId: 'r2', projectId: 'p1', pointCode: 'A-04-001', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 55, startPoint: '4FD-IDF-01', endPoint: '4F-数据区-R01', photos: photoUrls(11, 3), tester: '王磊', testResult: 'pass', remark: '主干垂直布放', createTime: '2026-06-03 10:00:00' },
  { id: 'pt7', checkInId: 'ck2', requisitionId: 'r2', projectId: 'p1', pointCode: 'A-04-002', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 60, startPoint: '4FD-IDF-01', endPoint: '4F-数据区-R02', photos: photoUrls(14, 2), tester: '王磊', testResult: 'fail', remark: '近端串扰不合格，重新打线', createTime: '2026-06-03 11:10:00' },
  { id: 'pt8', checkInId: 'ck2', requisitionId: 'r2', projectId: 'p1', pointCode: 'A-04-100', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 45, startPoint: '4FD-IDF-02', endPoint: '4F-办公区-东北角', photos: photoUrls(16, 2), tester: '赵强', testResult: 'pass', remark: '', createTime: '2026-06-03 16:40:00' },
  { id: 'pt9', checkInId: 'ck2', requisitionId: 'r2', projectId: 'p1', pointCode: 'A-BK-001', cableId: 'c4', cableModel: 'RVV-2x1.5', usedMeters: 180, startPoint: '4F-配电箱A', endPoint: '4F-无线AP-01~12', photos: photoUrls(18, 2), tester: '孙明', testResult: 'pass', remark: 'AP供电主干，共12点位，并联走线', createTime: '2026-06-03 17:15:00' },
  { id: 'pt10', checkInId: 'ck2', requisitionId: 'r2', projectId: 'p1', pointCode: 'A-BK-002', cableId: 'c4', cableModel: 'RVV-2x1.5', usedMeters: 220, startPoint: '4F-配电箱B', endPoint: '4F-监控摄像头-C01~08', photos: photoUrls(20, 2), tester: '孙明', testResult: 'pass', remark: '监控供电，8路', createTime: '2026-06-03 17:45:00' },
  { id: 'pt11', checkInId: 'ck3', requisitionId: 'r4', projectId: 'p1', pointCode: 'A-06-B01', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 68, startPoint: '6FD-IDF-01', endPoint: '6F-B区-工位B01', photos: photoUrls(22, 2), tester: '王磊', testResult: 'pass', remark: '补线-路由变更后加长', createTime: '2026-06-04 13:30:00' },
  { id: 'pt12', checkInId: 'ck3', requisitionId: 'r4', projectId: 'p1', pointCode: 'A-06-B02', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 72, startPoint: '6FD-IDF-01', endPoint: '6F-B区-工位B02', photos: photoUrls(24, 2), tester: '王磊', testResult: 'pass', remark: '补线', createTime: '2026-06-04 14:00:00' },
  { id: 'pt13', checkInId: 'ck3', requisitionId: 'r4', projectId: 'p1', pointCode: 'A-06-B30', cableId: 'c1', cableModel: 'CAT6-305', usedMeters: 58, startPoint: '6FD-IDF-02', endPoint: '6F-B区-工位B30', photos: photoUrls(26, 2), tester: '赵强', testResult: 'pending', remark: '待测试', createTime: '2026-06-04 17:00:00' },
  { id: 'pt14', checkInId: 'ck4', requisitionId: 'r3', projectId: 'p1', pointCode: 'A-JF-001', cableId: 'c2', cableModel: 'CAT6A-305', usedMeters: 42, startPoint: '机房-核心柜01', endPoint: '机房-接入柜07-P01', photos: photoUrls(28, 3), tester: '张伟', testResult: 'pass', remark: '机房屏蔽线缆，接地良好', createTime: '2026-06-05 09:30:00' },
  { id: 'pt15', checkInId: 'ck4', requisitionId: 'r3', projectId: 'p1', pointCode: 'A-JF-002', cableId: 'c2', cableModel: 'CAT6A-305', usedMeters: 38, startPoint: '机房-核心柜01', endPoint: '机房-接入柜07-P02', photos: photoUrls(31, 2), tester: '张伟', testResult: 'pass', remark: '', createTime: '2026-06-05 10:15:00' }
]

export const shortages: Shortage[] = [
  {
    id: 's1',
    code: 'QL-20260603-001',
    projectId: 'p1',
    checkInId: 'ck2',
    cableId: 'c1',
    cableModel: 'CAT6-305',
    shortageQty: 5,
    priority: 'critical',
    photos: photoUrls(50, 2),
    reporter: '李强',
    reportTime: '2026-06-03 15:20:00',
    status: 'supplied',
    supplementReqId: 'r4',
    remark: '【紧急】6层B区原设计路由改走弱电井绕行，每点位增加8~12米，预估缺料5卷(1525米)。今日停工待料，影响明天甲方节点验收'
  }
]

export const returns: ReturnRecord[] = [
  {
    id: 'rt1',
    code: 'TH-20260605-001',
    requisitionId: 'r2',
    projectId: 'p1',
    teamId: 't2',
    items: [
      { cableId: 'c1', cableModel: 'CAT6-305', returnQty: 2, condition: 'good' },
      { cableId: 'c4', cableModel: 'RVV-2x1.5', returnQty: 120, condition: 'partial' }
    ],
    returner: '李强',
    returnTime: '2026-06-05 15:30:00',
    receiver: '仓库刘主管',
    receiveTime: '2026-06-05 16:15:00',
    photos: photoUrls(60, 3),
    status: 'received',
    remark: 'CAT6整卷未拆封2卷原封退回；RVV电源线整卷500米，余约120米带盘退回。附使用明细清单，照片已上传'
  }
]
