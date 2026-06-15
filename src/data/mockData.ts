import type { Cleaner, Customer, Order, Review, ReviewFollowUp, Compensation, User } from '@/types'

export const cleaners: Cleaner[] = [
  { id: 'c1', name: '王阿姨', phone: '138****1234', avatar: '', rating: 4.8, completedOrders: 156, tags: ['细心', '准时', '耐心'], status: 'active' },
  { id: 'c2', name: '李阿姨', phone: '139****5678', avatar: '', rating: 4.5, completedOrders: 98, tags: ['专业', '高效'], status: 'active' },
  { id: 'c3', name: '张阿姨', phone: '137****9012', avatar: '', rating: 4.2, completedOrders: 67, tags: ['认真'], status: 'suspended' },
  { id: 'c4', name: '刘阿姨', phone: '136****3456', avatar: '', rating: 4.9, completedOrders: 203, tags: ['全能', '细致', '负责'], status: 'active' },
  { id: 'c5', name: '陈阿姨', phone: '135****7890', avatar: '', rating: 3.8, completedOrders: 45, tags: ['经验丰富'], status: 'inactive' },
]

export const customers: Customer[] = [
  { id: 'cu1', name: '张先生', phone: '188****1111', address: '北京市朝阳区xxx小区' },
  { id: 'cu2', name: '李女士', phone: '189****2222', address: '北京市海淀区xxx街道' },
  { id: 'cu3', name: '王女士', phone: '187****3333', address: '北京市西城区xxx胡同' },
  { id: 'cu4', name: '赵先生', phone: '186****4444', address: '北京市东城区xxx大厦' },
  { id: 'cu5', name: '刘女士', phone: '185****5555', address: '北京市丰台区xxx公寓' },
]

export const orders: Order[] = [
  { id: 'o1', cleanerId: 'c1', customerId: 'cu1', serviceType: '日常保洁', date: '2024-01-15', startTime: '09:00', endTime: '11:00', status: 'completed', totalAmount: 200, address: '北京市朝阳区xxx小区' },
  { id: 'o2', cleanerId: 'c2', customerId: 'cu2', serviceType: '深度清洁', date: '2024-01-14', startTime: '14:00', endTime: '18:00', status: 'completed', totalAmount: 400, address: '北京市海淀区xxx街道' },
  { id: 'o3', cleanerId: 'c3', customerId: 'cu3', serviceType: '日常保洁', date: '2024-01-13', startTime: '10:00', endTime: '12:00', status: 'completed', totalAmount: 180, address: '北京市西城区xxx胡同' },
  { id: 'o4', cleanerId: 'c4', customerId: 'cu4', serviceType: '新居开荒', date: '2024-01-12', startTime: '08:00', endTime: '18:00', status: 'completed', totalAmount: 800, address: '北京市东城区xxx大厦' },
  { id: 'o5', cleanerId: 'c5', customerId: 'cu5', serviceType: '日常保洁', date: '2024-01-11', startTime: '09:00', endTime: '11:00', status: 'completed', totalAmount: 190, address: '北京市丰台区xxx公寓' },
  { id: 'o6', cleanerId: 'c1', customerId: 'cu2', serviceType: '玻璃清洗', date: '2024-01-10', startTime: '14:00', endTime: '16:00', status: 'completed', totalAmount: 260, address: '北京市海淀区xxx街道' },
  { id: 'o7', cleanerId: 'c2', customerId: 'cu1', serviceType: '日常保洁', date: '2024-01-09', startTime: '09:00', endTime: '11:00', status: 'completed', totalAmount: 200, address: '北京市朝阳区xxx小区' },
  { id: 'o8', cleanerId: 'c3', customerId: 'cu4', serviceType: '深度清洁', date: '2024-01-08', startTime: '09:00', endTime: '13:00', status: 'completed', totalAmount: 380, address: '北京市东城区xxx大厦' },
]

export const reviews: Review[] = [
  { id: 'r1', orderId: 'o1', customerId: 'cu1', cleanerId: 'c1', rating: 1, content: '阿姨迟到了半小时，而且打扫得非常不仔细，卫生间的角落都没擦干净。非常不满意！', createdAt: '2024-01-15 11:30', status: 'pending', category: 'timeliness' },
  { id: 'r2', orderId: 'o2', customerId: 'cu2', cleanerId: 'c2', rating: 2, content: '服务态度很差，跟她沟通需求爱答不理的，体验非常不好。', createdAt: '2024-01-14 18:30', status: 'reviewed', category: 'attitude' },
  { id: 'r3', orderId: 'o3', customerId: 'cu3', cleanerId: 'c3', rating: 1, content: '完全没按照要求打扫，说好的擦窗户也没擦，感觉白花钱了。', createdAt: '2024-01-13 12:15', status: 'resolved', category: 'service' },
  { id: 'r4', orderId: 'o4', customerId: 'cu4', cleanerId: 'c4', rating: 5, content: '非常满意！阿姨干活很仔细，新房子打扫得干干净净。', createdAt: '2024-01-12 18:30', status: 'resolved', category: 'quality' },
  { id: 'r5', orderId: 'o5', customerId: 'cu5', cleanerId: 'c5', rating: 2, content: '阿姨临时爽约，让我白等了一上午，太不负责任了！', createdAt: '2024-01-11 10:00', status: 'pending', category: 'other' },
  { id: 'r6', orderId: 'o6', customerId: 'cu2', cleanerId: 'c1', rating: 3, content: '整体还行，就是有些细节没做到位。', createdAt: '2024-01-10 16:30', status: 'reviewed', category: 'quality' },
  { id: 'r7', orderId: 'o7', customerId: 'cu1', cleanerId: 'c2', rating: 1, content: '服务内容说不清，和当初约定的不一样，少做了很多项目。', createdAt: '2024-01-09 11:15', status: 'pending', category: 'service' },
  { id: 'r8', orderId: 'o8', customerId: 'cu4', cleanerId: 'c3', rating: 2, content: '清洁质量很差，地板拖完还有水渍，柜子也没擦干净。', createdAt: '2024-01-08 13:30', status: 'reviewed', category: 'quality' },
]

export const followUps: ReviewFollowUp[] = [
  { id: 'f1', reviewId: 'r2', submittedBy: '客服小王', submittedAt: '2024-01-14 19:00', content: '已电话联系客户，客户表示对服务态度不满，要求补偿。', actionTaken: '电话回访', status: 'completed', nextAction: null },
  { id: 'f2', reviewId: 'r3', submittedBy: '客服小李', submittedAt: '2024-01-13 14:00', content: '客户反馈服务内容与约定不符，已向客户道歉并提出补偿方案。', actionTaken: '道歉+补偿', status: 'completed', nextAction: null },
  { id: 'f3', reviewId: 'r6', submittedBy: '客服小王', submittedAt: '2024-01-10 17:00', content: '已联系客户了解具体问题，客户表示主要是厨房角落没擦干净。', actionTaken: '电话回访', status: 'processing', nextAction: '安排返工或补偿' },
  { id: 'f4', reviewId: 'r8', submittedBy: '客服小张', submittedAt: '2024-01-08 14:00', content: '客户对清洁质量不满意，已记录问题，等待主管审批补偿。', actionTaken: '记录问题', status: 'pending', nextAction: '等待质检主管审批' },
]

export const compensations: Compensation[] = [
  { id: 'com1', reviewId: 'r3', followUpId: 'f2', amount: 180, type: 'refund', approvedBy: '质检主管刘', approvedAt: '2024-01-13 15:00', status: 'processed', description: '全额退款', createdAt: '2024-01-13 14:30' },
  { id: 'com2', reviewId: 'r2', followUpId: 'f1', amount: 100, type: 'discount', approvedBy: '质检主管刘', approvedAt: '2024-01-14 20:00', status: 'approved', description: '下次服务享5折优惠', createdAt: '2024-01-14 19:30' },
  { id: 'com3', reviewId: 'r8', followUpId: 'f4', amount: 190, type: 'refund', approvedBy: null, approvedAt: null, status: 'pending', description: '申请退款一半', createdAt: '2024-01-08 14:30' },
]

export const users: User[] = [
  { id: 'u1', name: '客服小王', role: 'customer_service', phone: '138****0001' },
  { id: 'u2', name: '客服小李', role: 'customer_service', phone: '138****0002' },
  { id: 'u3', name: '客服小张', role: 'customer_service', phone: '138****0003' },
  { id: 'u4', name: '质检主管刘', role: 'quality_manager', phone: '139****0001' },
  { id: 'u5', name: '管理员', role: 'admin', phone: '137****0001' },
]
