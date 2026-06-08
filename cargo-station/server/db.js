let acceptanceRecords = []
let verificationRecords = []
let auditLogs = []
let nextAcceptanceId = 1
let nextVerificationId = 1
let nextAuditId = 1

const PERSONNEL = {
  station_receiver: ['张建国', '李明辉', '王秀兰'],
  security_inspector: ['赵国安', '钱卫东', '孙磊'],
  warehouse_dispatcher: ['周调度', '吴承恩', '郑国栋']
}

const CARGO_TYPES = ['普货', '锂电池', '危险化学品', '生鲜冷链', '药品', '精密仪器', '纺织品', '文件资料']
const FLIGHT_PREFIXES = ['CA', 'MU', 'CZ', 'HU', '3U', 'FM', 'ZH', 'SC']

const STATUS_FLOW = {
  '待受理': ['受理中'],
  '受理中': ['待单证校验'],
  '待单证校验': ['单证校验中'],
  '单证校验中': ['校验通过', '校验退回'],
  '校验退回': ['受理中'],
  '校验通过': ['待入库'],
  '待入库': ['已入库'],
  '已入库': []
}

const DOC_TYPES = ['航空运单', '安检申报单', '危险品申报表', '货物交接清单', '温控记录单', '特殊货物审批件']

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomFlightNo() {
  return randomFrom(FLIGHT_PREFIXES) + String(Math.floor(1000 + Math.random() * 9000))
}

function padId(id) {
  return String(id).padStart(4, '0')
}

function nowISO() {
  return new Date().toISOString()
}

function beijingNow() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

function addAudit(recordId, recordType, fromStatus, toStatus, operator, operatorRole, note) {
  auditLogs.push({
    id: nextAuditId++,
    recordId,
    recordType,
    fromStatus,
    toStatus,
    operator,
    operatorRole,
    note: note || '',
    timestamp: nowISO(),
    displayTime: beijingNow()
  })
}

function generateSeedData() {
  const scenarios = [
    { status: '已入库', docsComplete: true, cargoType: '普货', hasIssue: false },
    { status: '已入库', docsComplete: true, cargoType: '生鲜冷链', hasIssue: false },
    { status: '待入库', docsComplete: true, cargoType: '药品', hasIssue: false },
    { status: '校验通过', docsComplete: true, cargoType: '精密仪器', hasIssue: false },
    { status: '单证校验中', docsComplete: true, cargoType: '锂电池', hasIssue: true },
    { status: '待单证校验', docsComplete: true, cargoType: '危险化学品', hasIssue: false },
    { status: '受理中', docsComplete: false, cargoType: '锂电池', hasIssue: true },
    { status: '校验退回', docsComplete: false, cargoType: '危险化学品', hasIssue: true },
    { status: '待受理', docsComplete: false, cargoType: '普货', hasIssue: false },
    { status: '待受理', docsComplete: false, cargoType: '纺织品', hasIssue: false },
    { status: '受理中', docsComplete: false, cargoType: '药品', hasIssue: true },
    { status: '已入库', docsComplete: true, cargoType: '文件资料', hasIssue: false },
  ]

  const baseTime = new Date()
  baseTime.setHours(baseTime.getHours() - 8)

  scenarios.forEach((scenario, idx) => {
    const id = nextAcceptanceId++
    const receiver = randomFrom(PERSONNEL.station_receiver)
    const flightNo = randomFlightNo()
    const waybillNo = `${flightNo}-${padId(id)}`
    const shipper = ['上海捷运物流', '北京恒达贸易', '广州华南冷链', '深圳鹏程电子', '成都蜀通医药', '杭州丝绸集团'][idx % 6]

    const record = {
      id,
      waybillNo,
      flightNo,
      shipper,
      cargoType: scenario.cargoType,
      weight: (Math.floor(Math.random() * 5000) + 50) / 10,
      pieces: Math.floor(Math.random() * 50) + 1,
      status: scenario.status,
      currentHandler: getCurrentHandler(scenario.status),
      currentHandlerRole: getCurrentHandlerRole(scenario.status),
      createdAt: new Date(baseTime.getTime() + idx * 15 * 60000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + idx * 15 * 60000 + 300000).toISOString()
    }
    acceptanceRecords.push(record)

    const docs = DOC_TYPES.filter(d => {
      if (scenario.cargoType === '普货' || scenario.cargoType === '纺织品' || scenario.cargoType === '文件资料') {
        return ['航空运单', '安检申报单', '货物交接清单'].includes(d)
      }
      if (scenario.cargoType === '锂电池' || scenario.cargoType === '危险化学品') {
        return true
      }
      if (scenario.cargoType === '生鲜冷链') {
        return ['航空运单', '安检申报单', '货物交接清单', '温控记录单'].includes(d)
      }
      if (scenario.cargoType === '药品') {
        return ['航空运单', '安检申报单', '货物交接清单', '特殊货物审批件', '温控记录单'].includes(d)
      }
      if (scenario.cargoType === '精密仪器') {
        return ['航空运单', '安检申报单', '货物交接清单', '特殊货物审批件'].includes(d)
      }
      return ['航空运单', '安检申报单', '货物交接清单'].includes(d)
    })

    const verification = {
      id: nextVerificationId++,
      acceptanceId: id,
      waybillNo,
      documents: docs.map(docName => ({
        docType: docName,
        submitted: scenario.status !== '待受理',
        verified: ['校验通过', '待入库', '已入库'].includes(scenario.status) && (scenario.docsComplete || !scenario.hasIssue),
        hasIssue: scenario.hasIssue && (docName === '危险品申报表' || docName === '温控记录单' || docName === '特殊货物审批件'),
        issueNote: scenario.hasIssue && (docName === '危险品申报表' || docName === '温控记录单' || docName === '特殊货物审批件')
          ? `${docName}信息与运单不一致，需重新提交`
          : '',
        submittedBy: scenario.status !== '待受理' ? receiver : '',
        submittedAt: scenario.status !== '待受理' ? record.createdAt : '',
        verifiedBy: ['校验通过', '待入库', '已入库'].includes(scenario.status) && (scenario.docsComplete || !scenario.hasIssue)
          ? randomFrom(PERSONNEL.security_inspector) : '',
        verifiedAt: ['校验通过', '待入库', '已入库'].includes(scenario.status) && (scenario.docsComplete || !scenario.hasIssue)
          ? new Date(new Date(record.createdAt).getTime() + 120000).toISOString() : ''
      })),
      overallResult: scenario.status === '校验退回' ? '退回' : (['校验通过', '待入库', '已入库'].includes(scenario.status) ? '通过' : '待校验'),
      rejectReason: scenario.status === '校验退回' ? '危险品申报表信息与运单不符，缺少UN编号' : '',
      verifiedBy: ['校验通过', '待入库', '已入库'].includes(scenario.status) ? randomFrom(PERSONNEL.security_inspector) : (scenario.status === '校验退回' ? randomFrom(PERSONNEL.security_inspector) : ''),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
    verificationRecords.push(verification)

    const statusSequence = getStatusSequence(scenario.status)
    let seqTime = new Date(record.createdAt)
    statusSequence.forEach((step, si) => {
      seqTime = new Date(seqTime.getTime() + si * 180000 + Math.random() * 60000)
      addAudit(
        id,
        'acceptance',
        step.from,
        step.to,
        step.operator,
        step.role,
        step.note
      )
    })
  })
}

function getCurrentHandler(status) {
  switch (status) {
    case '待受理': case '受理中': return '货站受理岗'
    case '待单证校验': case '单证校验中': case '校验退回': return '安检校验岗'
    case '校验通过': case '待入库': case '已入库': return '库区调度岗'
    default: return ''
  }
}

function getCurrentHandlerRole(status) {
  switch (status) {
    case '待受理': case '受理中': return 'station_receiver'
    case '待单证校验': case '单证校验中': case '校验退回': return 'security_inspector'
    case '校验通过': case '待入库': case '已入库': return 'warehouse_dispatcher'
    default: return ''
  }
}

function getStatusSequence(finalStatus) {
  const sequences = {
    '已入库': [
      { from: '待受理', to: '受理中', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '开始受理入库' },
      { from: '受理中', to: '待单证校验', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '受理完成，提交单证校验' },
      { from: '待单证校验', to: '单证校验中', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '开始校验单证' },
      { from: '单证校验中', to: '校验通过', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '全部单证校验通过' },
      { from: '校验通过', to: '待入库', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '单证校验通过，交库区调度' },
      { from: '待入库', to: '已入库', operator: randomFrom(PERSONNEL.warehouse_dispatcher), role: 'warehouse_dispatcher', note: '货物已入库，库位A-03-12' },
    ],
    '待入库': [
      { from: '待受理', to: '受理中', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '开始受理入库' },
      { from: '受理中', to: '待单证校验', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '受理完成，提交单证校验' },
      { from: '待单证校验', to: '单证校验中', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '开始校验单证' },
      { from: '单证校验中', to: '校验通过', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '全部单证校验通过' },
      { from: '校验通过', to: '待入库', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '单证校验通过，交库区调度' },
    ],
    '校验通过': [
      { from: '待受理', to: '受理中', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '开始受理入库' },
      { from: '受理中', to: '待单证校验', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '受理完成，提交单证校验' },
      { from: '待单证校验', to: '单证校验中', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '开始校验单证' },
      { from: '单证校验中', to: '校验通过', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '全部单证校验通过' },
    ],
    '单证校验中': [
      { from: '待受理', to: '受理中', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '开始受理入库' },
      { from: '受理中', to: '待单证校验', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '受理完成，提交单证校验' },
      { from: '待单证校验', to: '单证校验中', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '正在校验单证，锂电池需核查UN3481标识' },
    ],
    '待单证校验': [
      { from: '待受理', to: '受理中', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '开始受理入库' },
      { from: '受理中', to: '待单证校验', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '受理完成，提交单证校验' },
    ],
    '受理中': [
      { from: '待受理', to: '受理中', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '正在受理，部分单证尚未提交' },
    ],
    '校验退回': [
      { from: '待受理', to: '受理中', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '开始受理入库' },
      { from: '受理中', to: '待单证校验', operator: randomFrom(PERSONNEL.station_receiver), role: 'station_receiver', note: '受理完成，提交单证校验' },
      { from: '待单证校验', to: '单证校验中', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '开始校验单证' },
      { from: '单证校验中', to: '校验退回', operator: randomFrom(PERSONNEL.security_inspector), role: 'security_inspector', note: '危险品申报表信息与运单不符，缺少UN编号，退回补正' },
    ],
    '待受理': [],
  }
  return sequences[finalStatus] || []
}

export function initDB() {
  if (acceptanceRecords.length === 0) {
    generateSeedData()
    console.log(`种子数据已生成: ${acceptanceRecords.length}条受理记录, ${verificationRecords.length}条校验记录, ${auditLogs.length}条操作日志`)
  }
}

export { beijingNow, nowISO }

export function getDB() {
  return { acceptanceRecords, verificationRecords, auditLogs, nextAcceptanceId, nextVerificationId, nextAuditId, PERSONNEL, STATUS_FLOW, DOC_TYPES, CARGO_TYPES }
}

export function mutateDB(fn) {
  const result = fn({ acceptanceRecords, verificationRecords, auditLogs, PERSONNEL, STATUS_FLOW, DOC_TYPES, CARGO_TYPES, nextAcceptanceId, nextVerificationId, nextAuditId })
  if (result.nextAcceptanceId) nextAcceptanceId = result.nextAcceptanceId
  if (result.nextVerificationId) nextVerificationId = result.nextVerificationId
  if (result.nextAuditId) nextAuditId = result.nextAuditId
  return result.data
}
