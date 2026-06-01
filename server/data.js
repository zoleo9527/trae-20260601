const shifts = ['morning', 'evening', 'night'];
const roles = ['headNurse', 'nurse', 'customerService'];

const nurses = [
  { id: 'n1', name: '张护士长', role: 'headNurse' },
  { id: 'n2', name: '李护士', role: 'nurse', rooms: ['101', '102', '103'] },
  { id: 'n3', name: '王护士', role: 'nurse', rooms: ['201', '202', '203'] },
  { id: 'n4', name: '赵护士', role: 'nurse', rooms: ['301', '302', '303'] },
  { id: 'cs1', name: '陈客服', role: 'customerService' }
];

const rooms = [
  { id: '101', floor: 1, status: 'occupied', type: 'vip', bedNumber: 'A' },
  { id: '102', floor: 1, status: 'occupied', type: 'standard', bedNumber: 'B' },
  { id: '103', floor: 1, status: 'occupied', type: 'standard', bedNumber: 'C' },
  { id: '201', floor: 2, status: 'occupied', type: 'vip', bedNumber: 'A' },
  { id: '202', floor: 2, status: 'occupied', type: 'standard', bedNumber: 'B' },
  { id: '203', floor: 2, status: 'cleaning', type: 'standard', bedNumber: 'C' },
  { id: '301', floor: 3, status: 'occupied', type: 'vip', bedNumber: 'A' },
  { id: '302', floor: 3, status: 'occupied', type: 'standard', bedNumber: 'B' },
  { id: '303', floor: 3, status: 'maintenance', type: 'standard', bedNumber: 'C' }
];

const mothers = [
  { id: 'm1', roomId: '101', name: '刘妈妈', age: 32, admissionDate: '2026-06-01', risks: ['breastEngorgement'], hasAupair: true, aupairName: '王阿姨' },
  { id: 'm2', roomId: '102', name: '陈妈妈', age: 28, admissionDate: '2026-05-28', risks: [], hasAupair: true, aupairName: '李阿姨' },
  { id: 'm3', roomId: '103', name: '周妈妈', age: 35, admissionDate: '2026-05-25', risks: ['hypertension'], hasAupair: false },
  { id: 'm4', roomId: '201', name: '吴妈妈', age: 29, admissionDate: '2026-06-02', risks: [], hasAupair: true, aupairName: '张阿姨' },
  { id: 'm5', roomId: '202', name: '郑妈妈', age: 31, admissionDate: '2026-05-30', risks: ['diabetes'], hasAupair: true, aupairName: '刘阿姨' },
  { id: 'm6', roomId: '301', name: '孙妈妈', age: 33, admissionDate: '2026-05-20', risks: [], hasAupair: true, aupairName: '陈阿姨' },
  { id: 'm7', roomId: '302', name: '黄妈妈', age: 27, admissionDate: '2026-06-01', risks: ['postpartumDepression'], hasAupair: false }
];

const babies = [
  { id: 'b1', motherId: 'm1', roomId: '101', name: '小宝', gender: '男', birthDate: '2026-05-30', jaundice: true, jaundiceFollowUp: '2026-06-03', weight: 3200 },
  { id: 'b2', motherId: 'm2', roomId: '102', name: '安安', gender: '女', birthDate: '2026-05-26', jaundice: false, weight: 2800 },
  { id: 'b3', motherId: 'm3', roomId: '103', name: '乐乐', gender: '男', birthDate: '2026-05-22', jaundice: true, jaundiceFollowUp: '2026-06-02', weight: 3500, jaundiceDelayed: true, delayReason: '天气原因改期' },
  { id: 'b4', motherId: 'm4', roomId: '201', name: '一一', gender: '女', birthDate: '2026-06-01', jaundice: true, jaundiceFollowUp: '2026-06-04', weight: 3000 },
  { id: 'b5', motherId: 'm5', roomId: '202', name: '阳阳', gender: '男', birthDate: '2026-05-28', jaundice: false, weight: 3300 },
  { id: 'b6', motherId: 'm6', roomId: '301', name: '星星', gender: '女', birthDate: '2026-05-18', jaundice: false, weight: 3600 },
  { id: 'b7', motherId: 'm7', roomId: '302', name: '月月', gender: '女', birthDate: '2026-05-30', jaundice: true, jaundiceFollowUp: '2026-06-03', weight: 2700 }
];

const generateRecords = () => {
  const today = new Date();
  const records = [];
  
  records.push({
    id: 'r1',
    type: 'admission',
    roomId: '201',
    title: '新入住',
    description: '吴妈妈和宝宝一一于今日上午入住',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
    operator: '张护士长',
    shift: 'morning'
  });

  records.push({
    id: 'r2',
    type: 'roomTransfer',
    roomId: '103',
    title: '转房记录',
    description: '周妈妈从302转至103',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 14, 0).toISOString(),
    operator: '张护士长',
    shift: 'evening'
  });

  records.push({
    id: 'r3',
    type: 'jaundiceDelay',
    roomId: '103',
    title: '黄疸复查延期',
    description: '乐乐黄疸复查由6月1日延期至6月2日，原因：天气原因改期',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString(),
    operator: '李护士',
    shift: 'morning'
  });

  records.push({
    id: 'r4',
    type: 'complaint',
    roomId: '102',
    title: '家属投诉-餐食',
    description: '家属反映午餐汤太咸，要求调整口味。已与厨房沟通，晚餐开始调整。',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 20).toISOString(),
    operator: '陈客服',
    shift: 'morning',
    compensation: '赠送水果拼盘一份',
    status: 'processing'
  });

  records.push({
    id: 'r5',
    type: 'breastEngorgement',
    roomId: '101',
    title: '堵奶风险提醒',
    description: '刘妈妈乳房胀痛，已安排通乳师下午3点上门',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 15).toISOString(),
    operator: '李护士',
    shift: 'morning',
    riskLevel: 'high'
  });

  records.push({
    id: 'r6',
    type: 'nursing',
    roomId: '101',
    title: '妈妈护理',
    description: '伤口护理完成，恢复良好',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
    operator: '李护士',
    shift: 'morning'
  });

  records.push({
    id: 'r7',
    type: 'babyCheck',
    roomId: '101',
    title: '宝宝巡视',
    description: '体温36.8°C，黄疸观察中，吃奶正常',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30).toISOString(),
    operator: '李护士',
    shift: 'morning'
  });

  records.push({
    id: 'r8',
    type: 'aupairChange',
    roomId: '202',
    title: '阿姨换房',
    description: '刘阿姨从202调至301，陈阿姨调至202',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30).toISOString(),
    operator: '张护士长',
    shift: 'morning'
  });

  records.push({
    id: 'r9',
    type: 'handover',
    roomId: '101',
    title: '交接备注',
    description: '注意观察堵奶情况，通乳后2小时复查；宝宝黄疸继续晒太阳',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(),
    operator: '李护士',
    shift: 'evening'
  });

  records.push({
    id: 'r10',
    type: 'nursing',
    roomId: '302',
    title: '妈妈护理',
    description: '情绪安抚完成，建议家属多陪伴',
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString(),
    operator: '赵护士',
    shift: 'evening'
  });

  return records;
};

const tasks = [
  { id: 't1', roomId: '101', type: 'breastMassage', title: '通乳服务', time: '15:00', status: 'pending', assignee: '通乳师张老师', shift: 'evening' },
  { id: 't2', roomId: '103', type: 'jaundiceTest', title: '黄疸复查', time: '14:00', status: 'pending', assignee: '儿科医生', shift: 'evening' },
  { id: 't3', roomId: '102', type: 'complaintFollowup', title: '餐食投诉跟进', time: '18:00', status: 'pending', assignee: '陈客服', shift: 'evening' },
  { id: 't4', roomId: '101', type: 'vitalSigns', title: '体温血压监测', time: '20:00', status: 'pending', assignee: '李护士', shift: 'night' },
  { id: 't5', roomId: '201', type: 'newbornCare', title: '新生儿护理指导', time: '16:00', status: 'pending', assignee: '王护士', shift: 'evening' }
];

module.exports = {
  shifts,
  roles,
  nurses,
  rooms,
  mothers,
  babies,
  records: generateRecords(),
  tasks
};
