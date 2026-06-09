import type {
  DamageRecord,
  CompensationRecord,
  TimelineNode,
  ResponsibilityNode,
  CompensationMaterial,
  ResponsibilityLink
} from '$lib/types'

const makeTimeline = (nodes: Omit<TimelineNode, 'id'>[]): TimelineNode[] =>
  nodes.map((n, i) => ({ ...n, id: 'tn-' + Date.now() + '-' + i }))

const makeResponsibilityChain = (nodes: Omit<ResponsibilityNode, 'id'>[]): ResponsibilityNode[] =>
  nodes.map((n, i) => ({ ...n, id: 'rn-' + Date.now() + '-' + i }))

export const damageRecords: DamageRecord[] = [
  {
    id: 'DMG-2026-001',
    ticketNo: 'HP-2026-0451',
    goodsName: '冷轧钢板',
    goodsType: '钢材',
    damageType: '湿损',
    status: 'completed',
    createdAt: '2026-04-12T08:30:00+08:00',
    updatedAt: '2026-05-20T14:15:00+08:00',
    timeline: makeTimeline([
      { event: '发站装车', timestamp: '2026-04-12T08:30:00+08:00', responsible: { name: '张建国', role: 'freight_clerk' }, description: '郑州北站2号货场装车完毕，铅封完好', isGap: false },
      { event: '途中运输', timestamp: '2026-04-13T03:20:00+08:00', responsible: null, description: '列车途经许昌段，暴雨天气，车体疑似渗水', isGap: true },
      { event: '到站卸车', timestamp: '2026-04-14T06:10:00+08:00', responsible: { name: '李大明', role: 'loading_leader' }, description: '武汉南站3号仓库卸车，发现车厢底部有积水', isGap: false },
      { event: '发现货损', timestamp: '2026-04-14T06:45:00+08:00', responsible: { name: '王志强', role: 'freight_clerk' }, description: '开箱检查发现底层钢板表面有明显水渍和锈蚀', isGap: false },
      { event: '登记', timestamp: '2026-04-14T09:00:00+08:00', responsible: { name: '王志强', role: 'freight_clerk' }, description: '货运事故记录单已填写，货损等级评定为二级', isGap: false },
      { event: '指定责任', timestamp: '2026-04-16T10:30:00+08:00', responsible: { name: '赵红霞', role: 'station_manager' }, description: '经调查认定为运输途中防水措施不足，责任划归运输段', isGap: false }
    ]),
    responsibilityChain: makeResponsibilityChain([
      { name: '张建国', role: 'freight_clerk', segment: '发站装车', startTime: '2026-04-12T08:30:00+08:00', endTime: '2026-04-12T09:00:00+08:00', isGap: false },
      { name: '（运输段无人负责）', role: 'freight_clerk', segment: '途中运输', startTime: '2026-04-12T09:00:00+08:00', endTime: '2026-04-14T06:10:00+08:00', isGap: true },
      { name: '李大明', role: 'loading_leader', segment: '到站卸车', startTime: '2026-04-14T06:10:00+08:00', endTime: '2026-04-14T07:00:00+08:00', isGap: false }
    ]),
    currentResponsible: null,
    hasGap: true,
    stationFrom: '郑州北站',
    stationTo: '武汉南站',
    consignor: '河南中原钢铁有限公司',
    consignee: '武汉重型机械制造厂',
    weight: '48.5吨',
    urgency: 'normal'
  },
  {
    id: 'DMG-2026-002',
    ticketNo: 'HP-2026-0518',
    goodsName: '复合肥料',
    goodsType: '化肥',
    damageType: '破损',
    status: 'processing',
    createdAt: '2026-05-03T11:20:00+08:00',
    updatedAt: '2026-05-28T16:40:00+08:00',
    timeline: makeTimeline([
      { event: '发站装车', timestamp: '2026-05-03T11:20:00+08:00', responsible: { name: '陈卫东', role: 'freight_clerk' }, description: '成都北站5号货位装车，共1200袋复合肥', isGap: false },
      { event: '途中运输', timestamp: '2026-05-04T14:00:00+08:00', responsible: null, description: '列车在达成线运行，未监控到异常', isGap: true },
      { event: '到站卸车', timestamp: '2026-05-05T09:30:00+08:00', responsible: { name: '刘长江', role: 'loading_leader' }, description: '重庆西站1号仓库卸车，吊装作业中部分托盘倾倒', isGap: false },
      { event: '发现货损', timestamp: '2026-05-05T10:00:00+08:00', responsible: { name: '孙明辉', role: 'freight_clerk' }, description: '清点发现86袋外包装破损，其中23袋内容物撒漏', isGap: false },
      { event: '登记', timestamp: '2026-05-05T14:30:00+08:00', responsible: { name: '孙明辉', role: 'freight_clerk' }, description: '货损事故已登记，破损原因待查', isGap: false },
      { event: '指定责任', timestamp: '2026-05-08T09:00:00+08:00', responsible: { name: '周建平', role: 'station_manager' }, description: '初步认定装卸作业操作不当，指定装卸班组负责', isGap: false }
    ]),
    responsibilityChain: makeResponsibilityChain([
      { name: '陈卫东', role: 'freight_clerk', segment: '发站装车', startTime: '2026-05-03T11:20:00+08:00', endTime: '2026-05-03T12:00:00+08:00', isGap: false },
      { name: '（运输段无人负责）', role: 'freight_clerk', segment: '途中运输', startTime: '2026-05-03T12:00:00+08:00', endTime: '2026-05-05T09:30:00+08:00', isGap: true },
      { name: '刘长江', role: 'loading_leader', segment: '到站卸车', startTime: '2026-05-05T09:30:00+08:00', endTime: '2026-05-05T11:00:00+08:00', isGap: false }
    ]),
    currentResponsible: { name: '刘长江', role: 'loading_leader' },
    hasGap: true,
    stationFrom: '成都北站',
    stationTo: '重庆西站',
    consignor: '四川金象化工股份有限公司',
    consignee: '重庆农资集团有限公司',
    weight: '60吨',
    urgency: 'urgent'
  },
  {
    id: 'DMG-2026-003',
    ticketNo: 'HP-2026-0632',
    goodsName: '数控铣床',
    goodsType: '机械设备',
    damageType: '变形',
    status: 'anomaly',
    createdAt: '2026-05-18T07:45:00+08:00',
    updatedAt: '2026-06-02T11:30:00+08:00',
    timeline: makeTimeline([
      { event: '发站装车', timestamp: '2026-05-18T07:45:00+08:00', responsible: { name: '马文龙', role: 'freight_clerk' }, description: '沈阳南站特货区装车，设备已做防震加固处理', isGap: false },
      { event: '途中运输', timestamp: '2026-05-19T22:15:00+08:00', responsible: null, description: '列车在山海关站编组作业，调车冲撞疑似超标', isGap: true },
      { event: '到站卸车', timestamp: '2026-05-21T05:40:00+08:00', responsible: { name: '钱学峰', role: 'loading_leader' }, description: '天津西站特货线卸车，使用100吨吊车作业', isGap: false },
      { event: '发现货损', timestamp: '2026-05-21T07:00:00+08:00', responsible: { name: '吴丽华', role: 'freight_clerk' }, description: '开箱后发现主轴导轨出现明显弯曲变形，精度丧失', isGap: false },
      { event: '登记', timestamp: '2026-05-21T10:00:00+08:00', responsible: { name: '吴丽华', role: 'freight_clerk' }, description: '重大货损事故登记，设备价值较高需专项调查', isGap: false },
      { event: '指定责任', timestamp: '2026-05-25T15:00:00+08:00', responsible: null, description: '责任认定困难：发站加固记录与途中监控数据矛盾，需进一步取证', isGap: true }
    ]),
    responsibilityChain: makeResponsibilityChain([
      { name: '马文龙', role: 'freight_clerk', segment: '发站装车', startTime: '2026-05-18T07:45:00+08:00', endTime: '2026-05-18T09:00:00+08:00', isGap: false },
      { name: '（编组站责任不明）', role: 'freight_clerk', segment: '途中运输', startTime: '2026-05-18T09:00:00+08:00', endTime: '2026-05-21T05:40:00+08:00', isGap: true },
      { name: '钱学峰', role: 'loading_leader', segment: '到站卸车', startTime: '2026-05-21T05:40:00+08:00', endTime: '2026-05-21T07:30:00+08:00', isGap: false }
    ]),
    currentResponsible: null,
    hasGap: true,
    stationFrom: '沈阳南站',
    stationTo: '天津西站',
    consignor: '沈阳机床（集团）有限责任公司',
    consignee: '天津滨海精密机械有限公司',
    weight: '12.8吨',
    urgency: 'critical'
  },
  {
    id: 'DMG-2026-004',
    ticketNo: 'HP-2026-0701',
    goodsName: '优质小麦',
    goodsType: '粮食',
    damageType: '湿损',
    status: 'pending',
    createdAt: '2026-05-25T14:00:00+08:00',
    updatedAt: '2026-05-25T14:00:00+08:00',
    timeline: makeTimeline([
      { event: '发站装车', timestamp: '2026-05-24T06:30:00+08:00', responsible: { name: '黄建明', role: 'freight_clerk' }, description: '哈尔滨东站散粮专用线装车，篷布覆盖合格', isGap: false },
      { event: '途中运输', timestamp: '2026-05-24T18:00:00+08:00', responsible: null, description: '列车运行至长春段遭遇大雨，篷布疑似被风掀开', isGap: true },
      { event: '到站卸车', timestamp: '2026-05-25T08:00:00+08:00', responsible: { name: '郑国强', role: 'loading_leader' }, description: '长春北站粮仓线卸车，篷布偏移约1.5米', isGap: false },
      { event: '发现货损', timestamp: '2026-05-25T09:30:00+08:00', responsible: { name: '田晓燕', role: 'freight_clerk' }, description: '表层约3吨小麦受潮结块，底部有霉变迹象', isGap: false },
      { event: '登记', timestamp: '2026-05-25T14:00:00+08:00', responsible: { name: '田晓燕', role: 'freight_clerk' }, description: '货损记录已登记，等待指派责任人', isGap: false }
    ]),
    responsibilityChain: makeResponsibilityChain([
      { name: '黄建明', role: 'freight_clerk', segment: '发站装车', startTime: '2026-05-24T06:30:00+08:00', endTime: '2026-05-24T07:30:00+08:00', isGap: false },
      { name: '（运输段无人负责）', role: 'freight_clerk', segment: '途中运输', startTime: '2026-05-24T07:30:00+08:00', endTime: '2026-05-25T08:00:00+08:00', isGap: true },
      { name: '郑国强', role: 'loading_leader', segment: '到站卸车', startTime: '2026-05-25T08:00:00+08:00', endTime: null, isGap: false }
    ]),
    currentResponsible: { name: '田晓燕', role: 'freight_clerk' },
    hasGap: true,
    stationFrom: '哈尔滨东站',
    stationTo: '长春北站',
    consignor: '黑龙江北大荒农业股份有限公司',
    consignee: '吉林粮食集团收储有限公司',
    weight: '62吨',
    urgency: 'urgent'
  },
  {
    id: 'DMG-2026-005',
    ticketNo: 'HP-2026-0755',
    goodsName: '浮法玻璃',
    goodsType: '建材',
    damageType: '破损',
    status: 'processing',
    createdAt: '2026-05-20T10:15:00+08:00',
    updatedAt: '2026-06-05T09:20:00+08:00',
    timeline: makeTimeline([
      { event: '发站装车', timestamp: '2026-05-20T10:15:00+08:00', responsible: { name: '范志远', role: 'freight_clerk' }, description: '邯郸站货场装车，专用木架固定，铅封完好', isGap: false },
      { event: '途中运输', timestamp: '2026-05-21T01:40:00+08:00', responsible: { name: '曹德旺', role: 'loading_leader' }, description: '石家庄站中转，调度记录正常', isGap: false },
      { event: '到站卸车', timestamp: '2026-05-21T16:50:00+08:00', responsible: { name: '谢志刚', role: 'loading_leader' }, description: '济南西站3号货位卸车', isGap: false },
      { event: '发现货损', timestamp: '2026-05-21T17:30:00+08:00', responsible: { name: '林海涛', role: 'freight_clerk' }, description: '拆架后发现约15%的玻璃面板碎裂，疑似装卸碰撞', isGap: false },
      { event: '登记', timestamp: '2026-05-22T08:45:00+08:00', responsible: { name: '林海涛', role: 'freight_clerk' }, description: '货损登记完成，已拍照取证', isGap: false },
      { event: '指定责任', timestamp: '2026-05-24T11:00:00+08:00', responsible: { name: '杨秀芳', role: 'station_manager' }, description: '认定为到站卸车操作不当，责任由装卸班组承担', isGap: false }
    ]),
    responsibilityChain: makeResponsibilityChain([
      { name: '范志远', role: 'freight_clerk', segment: '发站装车', startTime: '2026-05-20T10:15:00+08:00', endTime: '2026-05-20T11:30:00+08:00', isGap: false },
      { name: '曹德旺', role: 'loading_leader', segment: '途中运输', startTime: '2026-05-20T11:30:00+08:00', endTime: '2026-05-21T16:50:00+08:00', isGap: false },
      { name: '谢志刚', role: 'loading_leader', segment: '到站卸车', startTime: '2026-05-21T16:50:00+08:00', endTime: null, isGap: false }
    ]),
    currentResponsible: { name: '谢志刚', role: 'loading_leader' },
    hasGap: false,
    stationFrom: '邯郸站',
    stationTo: '济南西站',
    consignor: '河北沙河市安全实业有限公司',
    consignee: '山东万家园玻璃有限公司',
    weight: '28吨',
    urgency: 'normal'
  },
  {
    id: 'DMG-2026-006',
    ticketNo: 'HP-2026-0823',
    goodsName: '动力煤',
    goodsType: '煤炭',
    damageType: '丢失',
    status: 'anomaly',
    createdAt: '2026-05-22T13:00:00+08:00',
    updatedAt: '2026-06-06T10:45:00+08:00',
    timeline: makeTimeline([
      { event: '发站装车', timestamp: '2026-05-22T13:00:00+08:00', responsible: { name: '宋德义', role: 'freight_clerk' }, description: '大秦线秦皇岛东站装车，轨道衡计量64.2吨', isGap: false },
      { event: '途中运输', timestamp: '2026-05-23T02:00:00+08:00', responsible: null, description: '列车经大秦线运行，多处停车记录但无检查记录', isGap: true },
      { event: '到站卸车', timestamp: '2026-05-23T18:30:00+08:00', responsible: { name: '何铁军', role: 'loading_leader' }, description: '塘沽站卸车，轨道衡计量仅56.1吨', isGap: false },
      { event: '发现货损', timestamp: '2026-05-23T19:00:00+08:00', responsible: { name: '段晓峰', role: 'freight_clerk' }, description: '到站计量短少8.1吨，约12.6%，严重超差', isGap: false },
      { event: '登记', timestamp: '2026-05-24T09:00:00+08:00', responsible: { name: '段晓峰', role: 'freight_clerk' }, description: '大宗货物短少事故登记，已报公安部门', isGap: false },
      { event: '指定责任', timestamp: '2026-05-28T14:00:00+08:00', responsible: null, description: '途中多段停车但无法确认丢煤地点，公安仍在调查中', isGap: true }
    ]),
    responsibilityChain: makeResponsibilityChain([
      { name: '宋德义', role: 'freight_clerk', segment: '发站装车', startTime: '2026-05-22T13:00:00+08:00', endTime: '2026-05-22T14:30:00+08:00', isGap: false },
      { name: '（途中多处停车无人监管）', role: 'freight_clerk', segment: '途中运输', startTime: '2026-05-22T14:30:00+08:00', endTime: '2026-05-23T18:30:00+08:00', isGap: true },
      { name: '何铁军', role: 'loading_leader', segment: '到站卸车', startTime: '2026-05-23T18:30:00+08:00', endTime: null, isGap: false }
    ]),
    currentResponsible: null,
    hasGap: true,
    stationFrom: '秦皇岛东站',
    stationTo: '塘沽站',
    consignor: '中煤能源秦皇岛分公司',
    consignee: '天津滨海新区热电有限公司',
    weight: '64.2吨',
    urgency: 'critical'
  }
]

export const compensationRecords: CompensationRecord[] = [
  {
    id: 'CMP-2026-001',
    damageRecordId: 'DMG-2026-001',
    compNo: 'PC-2026-0312',
    amount: 28500,
    status: 'completed',
    createdAt: '2026-04-18T10:00:00+08:00',
    updatedAt: '2026-05-20T14:15:00+08:00',
    materials: [
      { id: 'MAT-001-1', name: '货运事故记录单', type: '证明材料', submittedAt: '2026-04-14T09:00:00+08:00', submittedBy: '王志强', status: 'verified' },
      { id: 'MAT-001-2', name: '货物损失鉴定报告', type: '鉴定材料', submittedAt: '2026-04-20T15:30:00+08:00', submittedBy: '武汉铁路质检所', status: 'verified' },
      { id: 'MAT-001-3', name: '现场照片及视频', type: '影像材料', submittedAt: '2026-04-14T10:00:00+08:00', submittedBy: '王志强', status: 'verified' },
      { id: 'MAT-001-4', name: '运输合同副本', type: '合同材料', submittedAt: '2026-04-18T11:00:00+08:00', submittedBy: '河南中原钢铁有限公司', status: 'verified' }
    ],
    responsibilityLinks: [
      { from: { name: '张建国', role: 'freight_clerk', segment: '发站装车' }, to: { name: '（运输段无人负责）', role: 'freight_clerk', segment: '途中运输' }, isGap: true },
      { from: { name: '（运输段无人负责）', role: 'freight_clerk', segment: '途中运输' }, to: { name: '李大明', role: 'loading_leader', segment: '到站卸车' }, isGap: true }
    ],
    hasGap: true,
    claimant: '武汉重型机械制造厂',
    claimantContact: '刘志明 027-85123456'
  },
  {
    id: 'CMP-2026-002',
    damageRecordId: 'DMG-2026-002',
    compNo: 'PC-2026-0405',
    amount: 5600,
    status: 'pending',
    createdAt: '2026-05-10T09:30:00+08:00',
    updatedAt: '2026-05-10T09:30:00+08:00',
    materials: [
      { id: 'MAT-002-1', name: '货运事故记录单', type: '证明材料', submittedAt: '2026-05-05T14:30:00+08:00', submittedBy: '孙明辉', status: 'verified' },
      { id: 'MAT-002-2', name: '货物损失鉴定报告', type: '鉴定材料', submittedAt: null, submittedBy: null, status: 'missing' },
      { id: 'MAT-002-3', name: '现场照片', type: '影像材料', submittedAt: '2026-05-05T16:00:00+08:00', submittedBy: '孙明辉', status: 'submitted' },
      { id: 'MAT-002-4', name: '运输合同副本', type: '合同材料', submittedAt: null, submittedBy: null, status: 'missing' }
    ],
    responsibilityLinks: [
      { from: { name: '陈卫东', role: 'freight_clerk', segment: '发站装车' }, to: { name: '（运输段无人负责）', role: 'freight_clerk', segment: '途中运输' }, isGap: true },
      { from: { name: '（运输段无人负责）', role: 'freight_clerk', segment: '途中运输' }, to: { name: '刘长江', role: 'loading_leader', segment: '到站卸车' }, isGap: true }
    ],
    hasGap: true,
    claimant: '重庆农资集团有限公司',
    claimantContact: '赵明辉 023-67891234'
  },
  {
    id: 'CMP-2026-003',
    damageRecordId: 'DMG-2026-003',
    compNo: 'PC-2026-0521',
    amount: 78000,
    status: 'material_incomplete',
    createdAt: '2026-05-26T08:00:00+08:00',
    updatedAt: '2026-06-02T11:30:00+08:00',
    materials: [
      { id: 'MAT-003-1', name: '货运事故记录单', type: '证明材料', submittedAt: '2026-05-21T10:00:00+08:00', submittedBy: '吴丽华', status: 'verified' },
      { id: 'MAT-003-2', name: '设备出厂检测报告', type: '鉴定材料', submittedAt: '2026-05-27T09:00:00+08:00', submittedBy: '沈阳机床集团', status: 'submitted' },
      { id: 'MAT-003-3', name: '发站加固验收记录', type: '证明材料', submittedAt: null, submittedBy: null, status: 'missing' },
      { id: 'MAT-003-4', name: '途中调车冲撞监控数据', type: '技术材料', submittedAt: null, submittedBy: null, status: 'missing' },
      { id: 'MAT-003-5', name: '设备受损后检测报告', type: '鉴定材料', submittedAt: '2026-05-30T14:00:00+08:00', submittedBy: '天津精密仪器检测中心', status: 'submitted' }
    ],
    responsibilityLinks: [
      { from: { name: '马文龙', role: 'freight_clerk', segment: '发站装车' }, to: { name: '（编组站责任不明）', role: 'freight_clerk', segment: '途中运输' }, isGap: true },
      { from: { name: '（编组站责任不明）', role: 'freight_clerk', segment: '途中运输' }, to: { name: '钱学峰', role: 'loading_leader', segment: '到站卸车' }, isGap: true }
    ],
    hasGap: true,
    claimant: '天津滨海精密机械有限公司',
    claimantContact: '王海涛 022-66234567'
  },
  {
    id: 'CMP-2026-004',
    damageRecordId: 'DMG-2026-005',
    compNo: 'PC-2026-0580',
    amount: 15200,
    status: 'accepted',
    createdAt: '2026-05-28T10:00:00+08:00',
    updatedAt: '2026-06-05T09:20:00+08:00',
    materials: [
      { id: 'MAT-004-1', name: '货运事故记录单', type: '证明材料', submittedAt: '2026-05-22T08:45:00+08:00', submittedBy: '林海涛', status: 'verified' },
      { id: 'MAT-004-2', name: '货物损失鉴定报告', type: '鉴定材料', submittedAt: '2026-05-26T11:00:00+08:00', submittedBy: '济南铁路质检所', status: 'verified' },
      { id: 'MAT-004-3', name: '现场照片', type: '影像材料', submittedAt: '2026-05-21T18:00:00+08:00', submittedBy: '林海涛', status: 'verified' },
      { id: 'MAT-004-4', name: '运输合同副本', type: '合同材料', submittedAt: '2026-05-28T10:30:00+08:00', submittedBy: '河北沙河市安全实业有限公司', status: 'submitted' }
    ],
    responsibilityLinks: [
      { from: { name: '范志远', role: 'freight_clerk', segment: '发站装车' }, to: { name: '曹德旺', role: 'loading_leader', segment: '途中运输' }, isGap: false },
      { from: { name: '曹德旺', role: 'loading_leader', segment: '途中运输' }, to: { name: '谢志刚', role: 'loading_leader', segment: '到站卸车' }, isGap: false }
    ],
    hasGap: false,
    claimant: '山东万家园玻璃有限公司',
    claimantContact: '陈国栋 0531-87123456'
  }
]
