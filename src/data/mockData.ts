import { FabricHistory, FabricReservation, Order, OrderHistory, PatternHistory, PatternTask, Reminder, User } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: '张三', role: 'measurer' },
  { id: 'u2', name: '李四', role: 'pattern_maker' },
  { id: 'u3', name: '王五', role: 'customer_service' },
  { id: 'u4', name: '赵六', role: 'measurer' },
  { id: 'u5', name: '钱七', role: 'pattern_maker' },
];

export const mockOrders: Order[] = [
  { id: 'ord001', customer_name: '李明', phone: '13800138001', order_date: '2024-01-15', status: 'pattern_in_progress', created_by: 'u1', created_at: '2024-01-15 09:00:00' },
  { id: 'ord002', customer_name: '王芳', phone: '13800138002', order_date: '2024-01-16', status: 'fabric_reserved', created_by: 'u1', created_at: '2024-01-16 10:30:00' },
  { id: 'ord003', customer_name: '张伟', phone: '13800138003', order_date: '2024-01-17', status: 'measured', created_by: 'u4', created_at: '2024-01-17 14:00:00' },
  { id: 'ord004', customer_name: '刘洋', phone: '13800138004', order_date: '2024-01-18', status: 'pending', created_by: 'u3', created_at: '2024-01-18 11:00:00' },
  { id: 'ord005', customer_name: '陈静', phone: '13800138005', order_date: '2024-01-19', status: 'fitting', created_by: 'u1', created_at: '2024-01-19 09:30:00' },
  { id: 'ord006', customer_name: '杨磊', phone: '13800138006', order_date: '2024-01-20', status: 'completed', created_by: 'u4', created_at: '2024-01-20 15:00:00' },
  { id: 'ord007', customer_name: '赵雪', phone: '13800138007', order_date: '2024-01-21', status: 'pattern_in_progress', created_by: 'u3', created_at: '2024-01-21 10:00:00' },
  { id: 'ord008', customer_name: '孙强', phone: '13800138008', order_date: '2024-01-22', status: 'fabric_reserved', created_by: 'u1', created_at: '2024-01-22 14:30:00' },
];

export const mockOrderHistory: OrderHistory[] = [
  { id: 'h1', order_id: 'ord001', status_from: null, status_to: 'pending', operator_id: 'u1', operator_name: '张三', change_time: '2024-01-15 09:00:00', remark: '创建订单' },
  { id: 'h2', order_id: 'ord001', status_from: 'pending', status_to: 'measured', operator_id: 'u1', operator_name: '张三', change_time: '2024-01-15 10:30:00', remark: '量体完成' },
  { id: 'h3', order_id: 'ord001', status_from: 'measured', status_to: 'fabric_reserved', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-15 14:00:00', remark: '面料预留确认' },
  { id: 'h4', order_id: 'ord001', status_from: 'fabric_reserved', status_to: 'pattern_in_progress', operator_id: 'u2', operator_name: '李四', change_time: '2024-01-16 09:00:00', remark: '开始打版' },
  { id: 'h5', order_id: 'ord002', status_from: null, status_to: 'pending', operator_id: 'u1', operator_name: '张三', change_time: '2024-01-16 10:30:00', remark: '创建订单' },
  { id: 'h6', order_id: 'ord002', status_from: 'pending', status_to: 'measured', operator_id: 'u1', operator_name: '张三', change_time: '2024-01-16 11:30:00', remark: '量体完成' },
  { id: 'h7', order_id: 'ord002', status_from: 'measured', status_to: 'fabric_reserved', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-16 15:00:00', remark: '面料预留确认' },
  { id: 'h8', order_id: 'ord003', status_from: null, status_to: 'pending', operator_id: 'u4', operator_name: '赵六', change_time: '2024-01-17 14:00:00', remark: '创建订单' },
  { id: 'h9', order_id: 'ord003', status_from: 'pending', status_to: 'measured', operator_id: 'u4', operator_name: '赵六', change_time: '2024-01-17 15:30:00', remark: '量体完成' },
  { id: 'h10', order_id: 'ord004', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-18 11:00:00', remark: '创建订单' },
  { id: 'h11', order_id: 'ord005', status_from: null, status_to: 'pending', operator_id: 'u1', operator_name: '张三', change_time: '2024-01-19 09:30:00', remark: '创建订单' },
  { id: 'h12', order_id: 'ord005', status_from: 'pending', status_to: 'measured', operator_id: 'u1', operator_name: '张三', change_time: '2024-01-19 10:30:00', remark: '量体完成' },
  { id: 'h13', order_id: 'ord005', status_from: 'measured', status_to: 'fabric_reserved', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-19 14:00:00', remark: '面料预留确认' },
  { id: 'h14', order_id: 'ord005', status_from: 'fabric_reserved', status_to: 'pattern_in_progress', operator_id: 'u5', operator_name: '钱七', change_time: '2024-01-20 09:00:00', remark: '开始打版' },
  { id: 'h15', order_id: 'ord005', status_from: 'pattern_in_progress', status_to: 'fitting', operator_id: 'u5', operator_name: '钱七', change_time: '2024-01-21 16:00:00', remark: '打版完成，安排试衣' },
  { id: 'h16', order_id: 'ord006', status_from: null, status_to: 'pending', operator_id: 'u4', operator_name: '赵六', change_time: '2024-01-20 15:00:00', remark: '创建订单' },
  { id: 'h17', order_id: 'ord006', status_from: 'pending', status_to: 'measured', operator_id: 'u4', operator_name: '赵六', change_time: '2024-01-20 16:00:00', remark: '量体完成' },
  { id: 'h18', order_id: 'ord006', status_from: 'measured', status_to: 'fabric_reserved', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-21 09:00:00', remark: '面料预留确认' },
  { id: 'h19', order_id: 'ord006', status_from: 'fabric_reserved', status_to: 'pattern_in_progress', operator_id: 'u2', operator_name: '李四', change_time: '2024-01-21 10:00:00', remark: '开始打版' },
  { id: 'h20', order_id: 'ord006', status_from: 'pattern_in_progress', status_to: 'fitting', operator_id: 'u2', operator_name: '李四', change_time: '2024-01-22 14:00:00', remark: '打版完成，安排试衣' },
  { id: 'h21', order_id: 'ord006', status_from: 'fitting', status_to: 'completed', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-23 10:00:00', remark: '订单完成' },
];

export const mockFabricReservations: FabricReservation[] = [
  { id: 'fr001', order_id: 'ord001', customer_name: '李明', fabric_name: '高级羊毛', fabric_code: 'W001', quantity: 3.5, status: 'reserved', responsible_id: 'u3', responsible_name: '王五', reserved_at: '2024-01-15 14:00:00', remark: '已确认库存' },
  { id: 'fr002', order_id: 'ord002', customer_name: '王芳', fabric_name: '真丝缎面', fabric_code: 'S001', quantity: 2.8, status: 'reserved', responsible_id: 'u3', responsible_name: '王五', reserved_at: '2024-01-16 15:00:00', remark: '已确认库存' },
  { id: 'fr003', order_id: 'ord003', customer_name: '张伟', fabric_name: '亚麻混纺', fabric_code: 'L001', quantity: 4.0, status: 'pending', responsible_id: 'u3', responsible_name: '王五', reserved_at: '2024-01-17 15:30:00', remark: '待确认' },
  { id: 'fr004', order_id: 'ord005', customer_name: '陈静', fabric_name: '羊绒', fabric_code: 'C001', quantity: 3.0, status: 'supplement', responsible_id: 'u3', responsible_name: '王五', reserved_at: '2024-01-19 14:00:00', remark: '库存不足，需补货' },
  { id: 'fr005', order_id: 'ord007', customer_name: '赵雪', fabric_name: '棉麻', fabric_code: 'M001', quantity: 5.0, status: 'rejected', responsible_id: 'u3', responsible_name: '王五', reserved_at: '2024-01-21 10:00:00', remark: '面料不符合要求，已退回' },
  { id: 'fr006', order_id: 'ord008', customer_name: '孙强', fabric_name: '真丝', fabric_code: 'S002', quantity: 2.5, status: 'pending', responsible_id: 'u3', responsible_name: '王五', reserved_at: '2024-01-22 14:30:00', remark: '待确认' },
];

export const mockFabricHistory: FabricHistory[] = [
  { id: 'fh1', fabric_id: 'fr001', order_id: 'ord001', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-15 13:00:00', remark: '创建面料预留申请' },
  { id: 'fh2', fabric_id: 'fr001', order_id: 'ord001', status_from: 'pending', status_to: 'reserved', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-15 14:00:00', remark: '库存充足，确认预留' },
  { id: 'fh3', fabric_id: 'fr002', order_id: 'ord002', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-16 14:00:00', remark: '创建面料预留申请' },
  { id: 'fh4', fabric_id: 'fr002', order_id: 'ord002', status_from: 'pending', status_to: 'reserved', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-16 15:00:00', remark: '库存充足，确认预留' },
  { id: 'fh5', fabric_id: 'fr003', order_id: 'ord003', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-17 15:30:00', remark: '创建面料预留申请' },
  { id: 'fh6', fabric_id: 'fr004', order_id: 'ord005', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-19 13:00:00', remark: '创建面料预留申请' },
  { id: 'fh7', fabric_id: 'fr004', order_id: 'ord005', status_from: 'pending', status_to: 'supplement', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-19 14:00:00', remark: '库存不足，通知供应商补货' },
  { id: 'fh8', fabric_id: 'fr005', order_id: 'ord007', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-21 09:00:00', remark: '创建面料预留申请' },
  { id: 'fh9', fabric_id: 'fr005', order_id: 'ord007', status_from: 'pending', status_to: 'rejected', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-21 10:00:00', remark: '面料有瑕疵，已退回仓库' },
  { id: 'fh10', fabric_id: 'fr006', order_id: 'ord008', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-22 14:30:00', remark: '创建面料预留申请' },
];

export const mockPatternTasks: PatternTask[] = [
  { id: 'pt001', order_id: 'ord001', customer_name: '李明', task_name: '西装打版', status: 'in_progress', assignee_id: 'u2', assignee_name: '李四', scheduled_date: '2024-01-18', created_at: '2024-01-16 09:00:00', remark: '加急订单' },
  { id: 'pt002', order_id: 'ord002', customer_name: '王芳', task_name: '连衣裙打版', status: 'pending', assignee_id: '', assignee_name: '', scheduled_date: '2024-01-20', created_at: '2024-01-16 15:00:00', remark: '' },
  { id: 'pt003', order_id: 'ord005', customer_name: '陈静', task_name: '大衣打版', status: 'completed', assignee_id: 'u5', assignee_name: '钱七', scheduled_date: '2024-01-21', created_at: '2024-01-20 09:00:00', remark: '已完成' },
  { id: 'pt004', order_id: 'ord006', customer_name: '杨磊', task_name: '衬衫打版', status: 'completed', assignee_id: 'u2', assignee_name: '李四', scheduled_date: '2024-01-22', created_at: '2024-01-21 10:00:00', remark: '已完成' },
  { id: 'pt005', order_id: 'ord007', customer_name: '赵雪', task_name: '休闲裤打版', status: 'rejected', assignee_id: 'u5', assignee_name: '钱七', scheduled_date: '2024-01-23', created_at: '2024-01-21 10:00:00', remark: '版型不符合要求，已退回修改' },
  { id: 'pt006', order_id: 'ord008', customer_name: '孙强', task_name: '风衣打版', status: 'pending', assignee_id: '', assignee_name: '', scheduled_date: '2024-01-24', created_at: '2024-01-22 14:30:00', remark: '' },
];

export const mockPatternHistory: PatternHistory[] = [
  { id: 'ph1', task_id: 'pt001', order_id: 'ord001', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-16 08:00:00', remark: '创建打版任务' },
  { id: 'ph2', task_id: 'pt001', order_id: 'ord001', status_from: 'pending', status_to: 'in_progress', operator_id: 'u2', operator_name: '李四', change_time: '2024-01-16 09:00:00', remark: '开始打版制作' },
  { id: 'ph3', task_id: 'pt002', order_id: 'ord002', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-16 15:00:00', remark: '创建打版任务' },
  { id: 'ph4', task_id: 'pt003', order_id: 'ord005', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-20 08:00:00', remark: '创建打版任务' },
  { id: 'ph5', task_id: 'pt003', order_id: 'ord005', status_from: 'pending', status_to: 'in_progress', operator_id: 'u5', operator_name: '钱七', change_time: '2024-01-20 09:00:00', remark: '开始打版制作' },
  { id: 'ph6', task_id: 'pt003', order_id: 'ord005', status_from: 'in_progress', status_to: 'completed', operator_id: 'u5', operator_name: '钱七', change_time: '2024-01-21 16:00:00', remark: '打版完成，等待试衣' },
  { id: 'ph7', task_id: 'pt004', order_id: 'ord006', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-21 09:00:00', remark: '创建打版任务' },
  { id: 'ph8', task_id: 'pt004', order_id: 'ord006', status_from: 'pending', status_to: 'in_progress', operator_id: 'u2', operator_name: '李四', change_time: '2024-01-21 10:00:00', remark: '开始打版制作' },
  { id: 'ph9', task_id: 'pt004', order_id: 'ord006', status_from: 'in_progress', status_to: 'completed', operator_id: 'u2', operator_name: '李四', change_time: '2024-01-22 14:00:00', remark: '打版完成，等待试衣' },
  { id: 'ph10', task_id: 'pt005', order_id: 'ord007', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-21 09:00:00', remark: '创建打版任务' },
  { id: 'ph11', task_id: 'pt005', order_id: 'ord007', status_from: 'pending', status_to: 'in_progress', operator_id: 'u5', operator_name: '钱七', change_time: '2024-01-21 10:00:00', remark: '开始打版制作' },
  { id: 'ph12', task_id: 'pt005', order_id: 'ord007', status_from: 'in_progress', status_to: 'rejected', operator_id: 'u2', operator_name: '李四', change_time: '2024-01-22 11:00:00', remark: '版型不符合客户要求，退回修改' },
  { id: 'ph13', task_id: 'pt006', order_id: 'ord008', status_from: null, status_to: 'pending', operator_id: 'u3', operator_name: '王五', change_time: '2024-01-22 14:30:00', remark: '创建打版任务' },
];

export const mockReminders: Reminder[] = [
  { id: 'r1', target_id: 'fr003', target_type: 'fabric', operator_id: 'u1', operator_name: '张三', reminder_time: '2024-01-18 10:00:00', remark: '请尽快确认面料库存' },
  { id: 'r2', target_id: 'fr004', target_type: 'fabric', operator_id: 'u3', operator_name: '王五', reminder_time: '2024-01-20 14:00:00', remark: '补货进度如何？客户催单' },
  { id: 'r3', target_id: 'pt001', target_type: 'pattern', operator_id: 'u3', operator_name: '王五', reminder_time: '2024-01-17 09:00:00', remark: '加急订单，请优先处理' },
  { id: 'r4', target_id: 'pt005', target_type: 'pattern', operator_id: 'u3', operator_name: '王五', reminder_time: '2024-01-22 14:00:00', remark: '退回修改，请尽快重新打版' },
];