import { Course, Material, User } from '@/types';

export const users: User[] = [
  { id: 'u1', name: '张教员', role: 'educator' },
  { id: 'u2', name: '李工程师', role: 'engineer' },
  { id: 'u3', name: '王老师', role: 'teacher' },
  { id: 'u4', name: '刘教员', role: 'educator' },
  { id: 'u5', name: '陈工程师', role: 'engineer' },
  { id: 'u6', name: '赵老师', role: 'teacher' },
];

export const materials: Material[] = [
  { id: 'm1', name: '显微镜', unit: '台', quantity: 20, minStock: 5 },
  { id: 'm2', name: '实验玻片', unit: '盒', quantity: 50, minStock: 10 },
  { id: 'm3', name: '试剂瓶', unit: '个', quantity: 100, minStock: 20 },
  { id: 'm4', name: '烧杯', unit: '个', quantity: 80, minStock: 15 },
  { id: 'm5', name: '酒精灯', unit: '盏', quantity: 30, minStock: 8 },
  { id: 'm6', name: '温度计', unit: '支', quantity: 40, minStock: 10 },
  { id: 'm7', name: '试管架', unit: '个', quantity: 25, minStock: 5 },
  { id: 'm8', name: '放大镜', unit: '个', quantity: 60, minStock: 12 },
];

export const mockCourses: Course[] = [
  {
    id: 'c1',
    name: '细胞结构观察实验',
    description: '通过显微镜观察植物细胞和动物细胞的结构差异，了解细胞的基本组成。',
    status: 'urgent',
    creator: '张教员',
    assignee: '李工程师',
    engineer: '李工程师',
    createdAt: '2024-01-10 09:00',
    updatedAt: '2024-01-12 14:30',
    materials: [
      { materialId: 'm1', materialName: '显微镜', requiredQty: 10, allocatedQty: 8, unit: '台' },
      { materialId: 'm2', materialName: '实验玻片', requiredQty: 50, allocatedQty: 45, unit: '盒' },
    ],
    comments: [
      { id: 'cm1', courseId: 'c1', author: '张教员', content: '课程已创建，请尽快审核。', createdAt: '2024-01-10 09:00' },
      { id: 'cm2', courseId: 'c1', author: '李工程师', content: '材料清单已收到，正在确认库存。', createdAt: '2024-01-11 10:00' },
      { id: 'cm3', courseId: 'c1', author: '张教员', content: '课程时间紧迫，请加快审核进度！', createdAt: '2024-01-12 14:30' },
    ],
  },
  {
    id: 'c2',
    name: '水的沸腾实验',
    description: '观察水的沸腾过程，测量沸点温度，了解大气压力对沸点的影响。',
    status: 'rejected',
    creator: '刘教员',
    assignee: '陈工程师',
    engineer: '陈工程师',
    createdAt: '2024-01-08 14:00',
    updatedAt: '2024-01-11 16:00',
    materials: [
      { materialId: 'm4', materialName: '烧杯', requiredQty: 15, allocatedQty: 0, unit: '个' },
      { materialId: 'm5', materialName: '酒精灯', requiredQty: 15, allocatedQty: 0, unit: '盏' },
      { materialId: 'm6', materialName: '温度计', requiredQty: 15, allocatedQty: 0, unit: '支' },
    ],
    comments: [
      { id: 'cm4', courseId: 'c2', author: '刘教员', content: '提交实验课程申请，计划下周三开展。', createdAt: '2024-01-08 14:00' },
      { id: 'cm5', courseId: 'c2', author: '陈工程师', content: '酒精灯库存不足，需要补充后才能审核通过。请调整材料清单或等待采购。', createdAt: '2024-01-11 16:00' },
    ],
  },
  {
    id: 'c3',
    name: '植物光合作用实验',
    description: '通过对比实验观察植物在光照和黑暗条件下的光合作用差异。',
    status: 'approved',
    creator: '张教员',
    assignee: '王老师',
    engineer: '李工程师',
    teacher: '王老师',
    createdAt: '2024-01-05 10:00',
    updatedAt: '2024-01-09 11:00',
    materials: [
      { materialId: 'm4', materialName: '烧杯', requiredQty: 8, allocatedQty: 8, unit: '个' },
      { materialId: 'm8', materialName: '放大镜', requiredQty: 20, allocatedQty: 15, unit: '个' },
    ],
    comments: [
      { id: 'cm6', courseId: 'c3', author: '张教员', content: '申请光合作用实验课程。', createdAt: '2024-01-05 10:00' },
      { id: 'cm7', courseId: 'c3', author: '李工程师', content: '审核通过，请活动老师领用材料。', createdAt: '2024-01-07 10:30' },
      { id: 'cm8', courseId: 'c3', author: '王老师', content: '已领用部分材料，放大镜还差5个。', createdAt: '2024-01-09 11:00' },
    ],
  },
  {
    id: 'c4',
    name: '电路基础实验',
    description: '学习简单电路的组成，了解串联和并联电路的特点。',
    status: 'supplement',
    creator: '刘教员',
    assignee: '赵老师',
    engineer: '陈工程师',
    teacher: '赵老师',
    createdAt: '2024-01-03 09:00',
    updatedAt: '2024-01-12 09:00',
    materials: [
      { materialId: 'm7', materialName: '试管架', requiredQty: 12, allocatedQty: 10, unit: '个' },
      { materialId: 'm3', materialName: '试剂瓶', requiredQty: 30, allocatedQty: 25, unit: '个' },
    ],
    comments: [
      { id: 'cm9', courseId: 'c4', author: '刘教员', content: '电路实验课程申请。', createdAt: '2024-01-03 09:00' },
      { id: 'cm10', courseId: 'c4', author: '陈工程师', content: '审核通过，材料已准备。', createdAt: '2024-01-04 14:00' },
      { id: 'cm11', courseId: 'c4', author: '赵老师', content: '领用发现试管架少2个，试剂瓶少5个，请补充。', createdAt: '2024-01-12 09:00' },
    ],
  },
  {
    id: 'c5',
    name: '化学酸碱中和实验',
    description: '通过指示剂观察酸碱中和反应的过程，理解pH值的变化。',
    status: 'pending',
    creator: '张教员',
    assignee: '李工程师',
    createdAt: '2024-01-13 10:00',
    updatedAt: '2024-01-13 10:00',
    materials: [
      { materialId: 'm3', materialName: '试剂瓶', requiredQty: 40, allocatedQty: 0, unit: '个' },
      { materialId: 'm4', materialName: '烧杯', requiredQty: 20, allocatedQty: 0, unit: '个' },
    ],
    comments: [
      { id: 'cm12', courseId: 'c5', author: '张教员', content: '新提交化学实验课程，请审核。', createdAt: '2024-01-13 10:00' },
    ],
  },
  {
    id: 'c6',
    name: '昆虫标本制作',
    description: '学习昆虫标本的采集和制作方法，了解昆虫的外部形态结构。',
    status: 'completed',
    creator: '刘教员',
    assignee: '赵老师',
    engineer: '陈工程师',
    teacher: '赵老师',
    createdAt: '2023-12-20 08:30',
    updatedAt: '2024-01-02 16:00',
    materials: [
      { materialId: 'm8', materialName: '放大镜', requiredQty: 25, allocatedQty: 0, returnedQty: 25, unit: '个' },
    ],
    comments: [
      { id: 'cm13', courseId: 'c6', author: '刘教员', content: '昆虫标本制作课程申请。', createdAt: '2023-12-20 08:30' },
      { id: 'cm14', courseId: 'c6', author: '陈工程师', content: '审核通过。', createdAt: '2023-12-21 09:00' },
      { id: 'cm15', courseId: 'c6', author: '赵老师', content: '已领用放大镜25个。', createdAt: '2023-12-25 10:00' },
      { id: 'cm16', courseId: 'c6', author: '赵老师', content: '课程已完成，放大镜25个已全部归还入库。', createdAt: '2024-01-02 16:00' },
    ],
  },
];
