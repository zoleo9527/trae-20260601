import type { Complaint } from '../types';

export const complaints: Complaint[] = [
  {
    id: 'CMP-2026-001',
    title: '共享单车占用人行道',
    description: '中关村大街与人名路交叉口，约5辆共享单车乱停乱放，占用人行道影响通行。',
    source: '12345热线',
    status: 'completed',
    priority: 'high',
    location: {
      lat: 39.9842,
      lng: 116.3074,
      address: '北京市海淀区中关村大街1号附近',
      accuracy: 15,
      offset: false
    },
    bikeId: 'BK-88231',
    createTime: '2026-06-09 08:30:00',
    assignTime: '2026-06-09 08:45:00',
    arriveTime: '2026-06-09 09:10:00',
    processTime: '2026-06-09 09:25:00',
    assignee: '张巡检',
    photos: {
      before: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shared%20bicycles%20parked%20on%20sidewalk%20illegally%20street%20view&image_size=square'],
      after: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=empty%20sidewalk%20after%20bicycle%20removal%20clean%20street&image_size=square']
    },
    processNote: '已将5辆违规停放车辆移至附近停车区域，现场已清理干净。',
    repeatCount: 1,
    hotspotId: 'HS-001'
  },
  {
    id: 'CMP-2026-002',
    title: '车辆堵塞地铁口',
    description: '西二旗地铁站A出口，大量共享单车堆积，严重影响乘客进出站。',
    source: '城市管理局',
    status: 'pending',
    priority: 'urgent',
    location: {
      lat: 40.0499,
      lng: 116.3013,
      address: '北京市海淀区西二旗地铁站A口',
      accuracy: 8,
      offset: false
    },
    bikeId: 'BK-65128',
    createTime: '2026-06-10 07:15:00',
    photos: {
      before: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bicycles%20blocking%20subway%20entrance%20crowded%20morning%20rush&image_size=square']
    },
    repeatCount: 5,
    hotspotId: 'HS-002'
  },
  {
    id: 'CMP-2026-003',
    title: '定位偏移-车辆不在现场',
    description: '市民举报该处有违规停放车辆，但巡检员到场后未发现车辆，定位显示位置与实际偏差较大。',
    source: '市民APP',
    status: 'completed',
    priority: 'medium',
    location: {
      lat: 39.9087,
      lng: 116.3912,
      address: '北京市东城区王府井大街201号',
      accuracy: 200,
      offset: true
    },
    bikeId: 'BK-42971',
    createTime: '2026-06-08 14:20:00',
    assignTime: '2026-06-08 14:35:00',
    arriveTime: '2026-06-08 15:00:00',
    processTime: '2026-06-08 15:10:00',
    closeTime: '2026-06-08 15:30:00',
    assignee: '李巡检',
    photos: {
      before: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=empty%20street%20corner%20no%20bicycles%20location%20offset&image_size=square']
    },
    processNote: '到达现场后未发现举报车辆，GPS定位存在较大偏移（约200米），已在附近200米范围内搜索，未发现违规停放。车辆可能已经被骑走。',
    closeReason: '定位偏差，车辆已不在现场',
    repeatCount: 2,
    hotspotId: 'HS-003'
  },
  {
    id: 'CMP-2026-004',
    title: '车已挪走但反馈未关闭',
    description: '国贸CBD区域F座门前，3辆共享单车停放在消防通道。',
    source: '巡查发现',
    status: 'completed',
    priority: 'high',
    location: {
      lat: 39.9087,
      lng: 116.4500,
      address: '北京市朝阳区建国门外大街1号国贸CBD',
      accuracy: 10,
      offset: false
    },
    bikeId: 'BK-78356',
    createTime: '2026-06-07 16:00:00',
    assignTime: '2026-06-07 16:15:00',
    arriveTime: '2026-06-07 16:40:00',
    processTime: '2026-06-07 16:55:00',
    assignee: '王巡检',
    photos: {
      before: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bicycles%20parked%20in%20fire%20lane%20office%20building&image_size=square'],
      after: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clear%20fire%20lane%20no%20bicycles%20after%20removal&image_size=square']
    },
    processNote: '已将3辆共享单车移至指定停车区域，消防通道已畅通。但城市管理局的反馈工单尚未关闭，等待确认。',
    repeatCount: 3,
    hotspotId: 'HS-004'
  },
  {
    id: 'CMP-2026-005',
    title: '学校门口车辆堆积',
    description: '人大附中校门口，放学时段共享单车大量堆积，影响学生通行。',
    source: '12345热线',
    status: 'processing',
    priority: 'urgent',
    location: {
      lat: 39.9782,
      lng: 116.3275,
      address: '北京市海淀区中关村大街37号人大附中门口',
      accuracy: 12,
      offset: false
    },
    bikeId: 'BK-31526',
    createTime: '2026-06-10 16:30:00',
    assignTime: '2026-06-10 16:40:00',
    arriveTime: '2026-06-10 17:00:00',
    assignee: '张巡检',
    photos: {
      before: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=school%20gate%20many%20shared%20bicycles%20students%20after%20school&image_size=square']
    },
    repeatCount: 4,
    hotspotId: 'HS-001'
  },
  {
    id: 'CMP-2026-006',
    title: '公园门口违规停放',
    description: '颐和园东宫门外，共享单车乱停乱放，影响景区形象。',
    source: '市民APP',
    status: 'assigned',
    priority: 'medium',
    location: {
      lat: 39.9999,
      lng: 116.2755,
      address: '北京市海淀区新建宫门路19号颐和园东宫门',
      accuracy: 20,
      offset: false
    },
    bikeId: 'BK-54782',
    createTime: '2026-06-10 09:00:00',
    assignTime: '2026-06-10 09:20:00',
    assignee: '李巡检',
    photos: {},
    repeatCount: 1
  },
  {
    id: 'CMP-2026-007',
    title: '同一区域多次投诉-超市门口',
    description: '家乐福超市入口处，共享单车长期占道，多次投诉未见改善。',
    source: '城市管理局',
    status: 'pending',
    priority: 'high',
    location: {
      lat: 39.9842,
      lng: 116.3074,
      address: '北京市海淀区中关村大街家乐福超市门口',
      accuracy: 10,
      offset: false
    },
    bikeId: 'BK-91257',
    createTime: '2026-06-10 10:30:00',
    photos: {},
    repeatCount: 7,
    hotspotId: 'HS-001'
  },
  {
    id: 'CMP-2026-008',
    title: '已关闭-历史投诉',
    description: '五道口地铁站附近车辆乱停问题，已处理并确认关闭。',
    source: '12345热线',
    status: 'closed',
    priority: 'low',
    location: {
      lat: 39.9929,
      lng: 116.3386,
      address: '北京市海淀区成府路28号五道口地铁站',
      accuracy: 8,
      offset: false
    },
    bikeId: 'BK-65432',
    createTime: '2026-06-05 11:00:00',
    assignTime: '2026-06-05 11:15:00',
    arriveTime: '2026-06-05 11:45:00',
    processTime: '2026-06-05 12:00:00',
    closeTime: '2026-06-06 09:00:00',
    assignee: '王巡检',
    photos: {
      before: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bicycles%20near%20subway%20station%20crowded%20street&image_size=square'],
      after: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=organized%20bicycle%20parking%20near%20station%20clean&image_size=square']
    },
    processNote: '已完成现场清理，车辆规范停放至指定区域。',
    closeReason: '处理完成，城市侧确认关闭',
    repeatCount: 2,
    hotspotId: 'HS-005'
  }
];

export const getComplaintById = (id: string): Complaint | undefined => {
  return complaints.find(c => c.id === id);
};

export const getComplaintsByHotspot = (hotspotId: string): Complaint[] => {
  return complaints.filter(c => c.hotspotId === hotspotId);
};
