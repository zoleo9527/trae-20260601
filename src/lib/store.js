import { writable } from 'svelte/store';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const sampleOrders = [
  {
    id: 'ORD001',
    customerName: '张小明',
    phone: '13812345678',
    address: '北京市朝阳区望京SOHO T3 1201室',
    orderDate: '2026-06-10',
    totalAmount: 15680.00,
    status: 'delivered',
    products: [
      { name: '诺贝尔瓷砖 800x800', quantity: 48, unit: '箱', price: 128 },
      { name: '马可波罗瓷砖 600x600', quantity: 36, unit: '箱', price: 86 },
      { name: '勾缝剂', quantity: 12, unit: '支', price: 28 }
    ],
    designer: '李设计师',
    guide: '王导购',
    measurementDate: '2026-06-08',
    measurementNotes: '客厅面积42㎡，卫生间12㎡，厨房8㎡',
    showroomBook: '2026年度样板册A版',
    replenishRequests: []
  },
  {
    id: 'ORD002',
    customerName: '李华',
    phone: '13987654321',
    address: '上海市浦东新区陆家嘴环路1000号',
    orderDate: '2026-06-12',
    totalAmount: 28900.00,
    status: 'scheduled',
    products: [
      { name: '东鹏瓷砖 1200x600', quantity: 60, unit: '箱', price: 198 },
      { name: '箭牌瓷砖 800x800', quantity: 24, unit: '箱', price: 156 },
      { name: '防水胶', quantity: 8, unit: '桶', price: 168 }
    ],
    designer: '张设计师',
    guide: '赵导购',
    measurementDate: '2026-06-11',
    measurementNotes: '复式结构，总面积180㎡',
    showroomBook: '2026年度样板册B版',
    replenishRequests: [
      { id: 'REQ001', product: '东鹏瓷砖 1200x600', quantity: 5, reason: '运输损耗补充', status: 'pending', createdAt: '2026-06-13' }
    ]
  },
  {
    id: 'ORD003',
    customerName: '王芳',
    phone: '13724681357',
    address: '广州市天河区珠江新城花城大道88号',
    orderDate: '2026-06-08',
    totalAmount: 9850.00,
    status: 'installing',
    products: [
      { name: '冠珠瓷砖 600x600', quantity: 32, unit: '箱', price: 78 },
      { name: '美缝剂', quantity: 6, unit: '支', price: 35 }
    ],
    designer: '刘设计师',
    guide: '孙导购',
    measurementDate: '2026-06-06',
    measurementNotes: '两室一厅，建筑面积85㎡',
    showroomBook: '2026年度样板册A版',
    replenishRequests: []
  },
  {
    id: 'ORD004',
    customerName: '陈伟',
    phone: '13697538642',
    address: '深圳市南山区科技园南区深南大道9999号',
    orderDate: '2026-06-14',
    totalAmount: 35600.00,
    status: 'pending',
    products: [
      { name: '蒙娜丽莎瓷砖 1500x750', quantity: 40, unit: '箱', price: 288 },
      { name: '欧神诺瓷砖 800x800', quantity: 30, unit: '箱', price: 168 },
      { name: '瓷砖胶', quantity: 15, unit: '袋', price: 45 }
    ],
    designer: '李设计师',
    guide: '王导购',
    measurementDate: '2026-06-13',
    measurementNotes: '大平层，客厅挑高，总面积260㎡',
    showroomBook: '2026年度样板册C版',
    replenishRequests: []
  }
];

const sampleDeliverySchedules = [
  {
    id: 'DS001',
    orderId: 'ORD001',
    scheduledDate: '2026-06-15',
    scheduledTime: '09:00',
    actualDate: '2026-06-15',
    actualTime: '09:30',
    warehouseStaff: '陈仓库',
    driver: '周师傅',
    vehicle: '粤A12345',
    status: 'completed',
    timeline: [
      { time: '2026-06-14 16:00', action: '导购提交送货申请', operator: '王导购', remark: '客户希望明天上午送货' },
      { time: '2026-06-14 16:30', action: '仓库确认排期', operator: '陈仓库', remark: '库存充足，安排09:00送货' },
      { time: '2026-06-15 08:30', action: '装车完成', operator: '陈仓库', remark: '共84箱瓷砖，已全部装车' },
      { time: '2026-06-15 09:30', action: '送达客户', operator: '周师傅', remark: '客户已签收' }
    ],
    remarks: '客户小区门禁严格，需提前联系'
  },
  {
    id: 'DS002',
    orderId: 'ORD002',
    scheduledDate: '2026-06-18',
    scheduledTime: '14:00',
    actualDate: null,
    actualTime: null,
    warehouseStaff: '刘仓库',
    driver: '吴师傅',
    vehicle: '粤B67890',
    status: 'scheduled',
    timeline: [
      { time: '2026-06-13 10:00', action: '导购提交送货申请', operator: '赵导购', remark: '客户周末有空，安排周六送货' },
      { time: '2026-06-13 10:30', action: '仓库确认排期', operator: '刘仓库', remark: '已安排周六下午14:00' },
      { time: '2026-06-14 09:00', action: '排期调整提醒', operator: '系统', remark: '原排期6月17日因仓库盘点调整至6月18日' }
    ],
    remarks: ''
  },
  {
    id: 'DS003',
    orderId: 'ORD003',
    scheduledDate: '2026-06-11',
    scheduledTime: '10:00',
    actualDate: '2026-06-11',
    actualTime: '10:15',
    warehouseStaff: '陈仓库',
    driver: '郑师傅',
    vehicle: '粤C11111',
    status: 'completed',
    timeline: [
      { time: '2026-06-10 11:00', action: '导购提交送货申请', operator: '孙导购', remark: '' },
      { time: '2026-06-10 11:20', action: '仓库确认排期', operator: '陈仓库', remark: '安排次日上午送货' },
      { time: '2026-06-11 10:15', action: '送达客户', operator: '郑师傅', remark: '客户签字确认' }
    ],
    remarks: ''
  },
  {
    id: 'DS004',
    orderId: 'ORD004',
    scheduledDate: '2026-06-17',
    scheduledTime: '09:00',
    actualDate: null,
    actualTime: null,
    warehouseStaff: '刘仓库',
    driver: '周师傅',
    vehicle: '粤A12345',
    status: 'pending',
    timeline: [
      { time: '2026-06-14 15:00', action: '导购提交送货申请', operator: '王导购', remark: '客户要求尽快送货' }
    ],
    remarks: '客户地址较远，需提前出发'
  }
];

const sampleInstallationFeedbacks = [
  {
    id: 'IF001',
    orderId: 'ORD001',
    deliveryScheduleId: 'DS001',
    status: 'completed',
    installer: '张师傅',
    startDate: '2026-06-16',
    endDate: '2026-06-20',
    feedbackDate: '2026-06-20',
    qualityRating: 5,
    timeline: [
      { time: '2026-06-16 08:00', action: '铺贴开始', operator: '张师傅', remark: '材料已到场，开始铺贴' },
      { time: '2026-06-17 17:00', action: '客厅铺贴完成', operator: '张师傅', remark: '客厅地砖铺贴完毕，等待勾缝' },
      { time: '2026-06-18 16:00', action: '卫生间防水完成', operator: '张师傅', remark: '闭水试验通过' },
      { time: '2026-06-20 14:00', action: '铺贴完成', operator: '张师傅', remark: '全部完工，客户验收合格' }
    ],
    issues: [],
    customerSignature: true,
    photos: ['img1.jpg', 'img2.jpg']
  },
  {
    id: 'IF002',
    orderId: 'ORD003',
    deliveryScheduleId: 'DS003',
    status: 'installing',
    installer: '李师傅',
    startDate: '2026-06-12',
    endDate: null,
    feedbackDate: null,
    qualityRating: null,
    timeline: [
      { time: '2026-06-12 08:30', action: '铺贴开始', operator: '李师傅', remark: '开始厨房区域铺贴' },
      { time: '2026-06-13 15:00', action: '进度更新', operator: '李师傅', remark: '厨房完成，开始卫生间' },
      { time: '2026-06-14 10:00', action: '材料短缺', operator: '李师傅', remark: '勾缝剂不足，已通知导购补货' }
    ],
    issues: [
      { type: 'material', description: '勾缝剂不足，需要补货', severity: 'medium', createdAt: '2026-06-14' }
    ],
    customerSignature: false,
    photos: ['img3.jpg']
  }
];

const createWritableStore = (initialValue) => {
  const { subscribe, set, update } = writable(initialValue);
  return {
    subscribe,
    set,
    update,
    add: (item) => update(items => [...items, { ...item, id: item.id || generateId() }]),
    remove: (id) => update(items => items.filter(item => item.id !== id)),
    updateItem: (id, updates) => update(items => items.map(item => item.id === id ? { ...item, ...updates } : item)),
    find: (id) => {
      let result = null;
      subscribe(items => {
        result = items.find(item => item.id === id);
      })();
      return result;
    },
    getSnapshot: () => {
      let result = null;
      subscribe(items => result = items)();
      return result;
    }
  };
};

export const orders = createWritableStore(sampleOrders);
export const deliverySchedules = createWritableStore(sampleDeliverySchedules);
export const installationFeedbacks = createWritableStore(sampleInstallationFeedbacks);

export const currentUser = writable({
  name: '王导购',
  role: 'guide'
});

export const selectedOrderId = writable(null);

export const updateDeliverySchedule = (scheduleId, updates, dateChanged = false, feedbackList = null) => {
  let prevSchedule = null;
  
  deliverySchedules.subscribe(schedules => {
    prevSchedule = schedules.find(s => s.id === scheduleId);
  })();
  
  deliverySchedules.updateItem(scheduleId, updates);
  
  if (dateChanged && updates.scheduledDate && prevSchedule) {
    const currentFeedbacks = feedbackList || installationFeedbacks.getSnapshot();
    const relatedFeedback = currentFeedbacks.find(fb => fb.deliveryScheduleId === scheduleId);
    
    if (relatedFeedback) {
      const newTimelineEntry = {
        time: new Date().toISOString().replace('T', ' ').substr(0, 19),
        action: '送货排期变更',
        operator: '系统',
        remark: `送货日期从${prevSchedule.scheduledDate || '未安排'}变更为${updates.scheduledDate}`
      };
      
      installationFeedbacks.update(items => 
        items.map(item => 
          item.id === relatedFeedback.id 
            ? { ...item, timeline: [...item.timeline, newTimelineEntry] }
            : item
        )
      );
    }
  }
};

export const updateInstallationStatus = (feedbackId, status, remark = '') => {
  installationFeedbacks.update(items => 
    items.map(item => 
      item.id === feedbackId 
        ? { 
            ...item, 
            status,
            timeline: [
              ...item.timeline, 
              {
                time: new Date().toISOString().replace('T', ' ').substr(0, 19),
                action: status === 'completed' ? '铺贴完成' : status === 'installing' ? '铺贴进行中' : '暂停铺贴',
                operator: '系统',
                remark
              }
            ]
          }
        : item
    )
  );
};
