export interface Student {
  id: string;
  name: string;
  avatarUrl: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Renewal {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  packageName: string;
  expireDate: string;
  status: 'pending' | 'processing' | 'completed' | 'risk';
  responsibleRole: 'teaching' | 'consultant' | 'admin';
  responsibleName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalHistory {
  id: string;
  renewalId: string;
  action: string;
  operator: string;
  operatorRole: string;
  description: string;
  createdAt: string;
}

export interface Communication {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  status: 'pending' | 'ongoing' | 'completed';
  priority: 'high' | 'medium' | 'low';
  responsibleRole: 'teaching' | 'consultant' | 'admin';
  responsibleName: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  exceptionReason?: string;
  exceptionDescription?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationHistory {
  id: string;
  communicationId: string;
  type: 'call' | 'message' | 'meeting';
  content: string;
  operator: string;
  operatorRole: string;
  createdAt: string;
}

export const students: Student[] = [
  { id: '1', name: '张明轩', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', phone: '138****1234', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '2', name: '李雨桐', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', phone: '139****5678', createdAt: '2024-02-20', updatedAt: '2024-02-20' },
  { id: '3', name: '王思涵', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', phone: '137****9012', createdAt: '2024-03-10', updatedAt: '2024-03-10' },
  { id: '4', name: '陈浩然', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', phone: '136****3456', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
  { id: '5', name: '刘雨萱', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', phone: '135****7890', createdAt: '2024-04-18', updatedAt: '2024-04-18' },
  { id: '6', name: '赵子涵', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', phone: '134****2345', createdAt: '2024-05-22', updatedAt: '2024-05-22' },
];

export const renewals: Renewal[] = [
  { id: 'r1', studentId: '1', studentName: '张明轩', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', packageName: '钢琴进阶课包(48课时)', expireDate: '2024-07-15', status: 'pending', responsibleRole: 'admin', responsibleName: '李教务', notes: '', createdAt: '2024-06-01', updatedAt: '2024-06-14' },
  { id: 'r2', studentId: '2', studentName: '李雨桐', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', packageName: '小提琴启蒙课包(24课时)', expireDate: '2024-06-20', status: 'risk', responsibleRole: 'consultant', responsibleName: '王顾问', notes: '家长反馈考虑中', createdAt: '2024-05-10', updatedAt: '2024-06-14' },
  { id: 'r3', studentId: '3', studentName: '王思涵', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', packageName: '古筝精品课包(36课时)', expireDate: '2024-08-25', status: 'processing', responsibleRole: 'teaching', responsibleName: '张老师', notes: '', createdAt: '2024-06-12', updatedAt: '2024-06-14' },
  { id: 'r4', studentId: '4', studentName: '陈浩然', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', packageName: '架子鼓进阶课包(48课时)', expireDate: '2024-06-30', status: 'pending', responsibleRole: 'admin', responsibleName: '李教务', notes: '', createdAt: '2024-05-28', updatedAt: '2024-06-14' },
  { id: 'r5', studentId: '5', studentName: '刘雨萱', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', packageName: '长笛基础课包(24课时)', expireDate: '2024-09-18', status: 'pending', responsibleRole: 'admin', responsibleName: '李教务', notes: '', createdAt: '2024-06-05', updatedAt: '2024-06-14' },
  { id: 'r6', studentId: '6', studentName: '赵子涵', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', packageName: '钢琴考级课包(60课时)', expireDate: '2024-07-01', status: 'risk', responsibleRole: 'consultant', responsibleName: '王顾问', notes: '家长对价格有异议', createdAt: '2024-05-20', updatedAt: '2024-06-14' },
  { id: 'r7', studentId: '7', studentName: '孙嘉怡', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', packageName: '声乐启蒙课包(24课时)', expireDate: '2024-06-25', status: 'risk', responsibleRole: 'consultant', responsibleName: '王顾问', notes: '家长表示需要考虑其他机构', createdAt: '2024-06-01', updatedAt: '2024-06-14' },
  { id: 'r8', studentId: '8', studentName: '周子墨', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', packageName: '吉他进阶课包(36课时)', expireDate: '2024-07-10', status: 'pending', responsibleRole: 'teaching', responsibleName: '张老师', notes: '', createdAt: '2024-06-08', updatedAt: '2024-06-14' },
];

export const renewalHistory: RenewalHistory[] = [
  { id: 'rh1', renewalId: 'r1', action: '创建任务', operator: '李教务', operatorRole: 'admin', description: '系统检测到课包即将到期，自动创建续费任务', createdAt: '2024-06-01 09:00' },
  { id: 'rh2', renewalId: 'r1', action: '分配任务', operator: '李教务', operatorRole: 'admin', description: '分配给教务组处理', createdAt: '2024-06-01 09:05' },
  { id: 'rh3', renewalId: 'r2', action: '创建任务', operator: '系统', operatorRole: 'system', description: '系统检测到课包即将到期', createdAt: '2024-05-10 10:00' },
  { id: 'rh4', renewalId: 'r2', action: '标记风险', operator: '王顾问', operatorRole: 'consultant', description: '家长反馈近期资金紧张，考虑延期续费', createdAt: '2024-06-10 14:30' },
  { id: 'rh5', renewalId: 'r3', action: '创建任务', operator: '系统', operatorRole: 'system', description: '系统检测到课包即将到期', createdAt: '2024-06-12 11:00' },
  { id: 'rh6', renewalId: 'r3', action: '开始处理', operator: '张老师', operatorRole: 'teaching', description: '已联系家长，预约面谈', createdAt: '2024-06-12 15:00' },
  { id: 'rh7', renewalId: 'r5', action: '创建任务', operator: '系统', operatorRole: 'system', description: '系统检测到课包即将到期', createdAt: '2024-06-05 09:00' },
  { id: 'rh8', renewalId: 'r5', action: '完成续费', operator: '李教务', operatorRole: 'admin', description: '家长已完成线上支付，续费成功', createdAt: '2024-06-14 10:30' },
];

export const communications: Communication[] = [
  { id: 'c1', studentId: '2', studentName: '李雨桐', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', subject: '课包续费沟通', status: 'ongoing', priority: 'high', responsibleRole: 'consultant', responsibleName: '王顾问', lastContactAt: '2024-06-14 16:00', nextFollowUpAt: '2024-06-17T10:00', createdAt: '2024-06-10', updatedAt: '2024-06-14' },
  { id: 'c2', studentId: '6', studentName: '赵子涵', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', subject: '价格异议处理', status: 'pending', priority: 'high', responsibleRole: 'consultant', responsibleName: '王顾问', createdAt: '2024-06-14', updatedAt: '2024-06-14' },
  { id: 'c3', studentId: '1', studentName: '张明轩', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', subject: '暑期课程安排', status: 'completed', priority: 'high', responsibleRole: 'teaching', responsibleName: '张老师', lastContactAt: '2024-06-14 10:00', result: '家长确认参加暑期课程，已完成报名', createdAt: '2024-06-14', updatedAt: '2024-06-14' },
  { id: 'c4', studentId: '4', studentName: '陈浩然', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', subject: '考级准备沟通', status: 'pending', priority: 'medium', responsibleRole: 'teaching', responsibleName: '李老师', createdAt: '2024-06-14', updatedAt: '2024-06-14' },
  { id: 'c5', studentId: '3', studentName: '王思涵', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', subject: '古筝比赛咨询', status: 'ongoing', priority: 'low', responsibleRole: 'teaching', responsibleName: '刘老师', lastContactAt: '2024-06-14 14:00', nextFollowUpAt: '2024-06-20T14:00', createdAt: '2024-06-10', updatedAt: '2024-06-14' },
  { id: 'c6', studentId: '5', studentName: '刘雨萱', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', subject: '长笛学习进度反馈', status: 'completed', priority: 'medium', responsibleRole: 'teaching', responsibleName: '王老师', lastContactAt: '2024-06-14 09:30', result: '家长对学习进度满意，同意增加练习频率', createdAt: '2024-06-14', updatedAt: '2024-06-14' },
  { id: 'c7', studentId: '7', studentName: '孙嘉怡', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', subject: '续费意向确认', status: 'pending', priority: 'high', responsibleRole: 'consultant', responsibleName: '王顾问', exceptionReason: 'no_response', exceptionDescription: '连续3次致电未接通，短信也未回复', createdAt: '2024-06-14', updatedAt: '2024-06-14' },
  { id: 'c8', studentId: '8', studentName: '周子墨', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', subject: '吉他课程调整', status: 'pending', priority: 'medium', responsibleRole: 'teaching', responsibleName: '张老师', createdAt: '2024-06-14', updatedAt: '2024-06-14' },
];

export const communicationHistory: CommunicationHistory[] = [
  { id: 'ch1', communicationId: 'c1', type: 'call', content: '致电家长，沟通续费事宜，家长表示需要和家人商量后回复', operator: '王顾问', operatorRole: 'consultant', createdAt: '2024-06-10 10:00' },
  { id: 'ch2', communicationId: 'c1', type: 'message', content: '发送课包续费优惠信息及课程安排表', operator: '王顾问', operatorRole: 'consultant', createdAt: '2024-06-10 10:15' },
  { id: 'ch3', communicationId: 'c1', type: 'call', content: '再次致电跟进，家长表示本周内会给出答复', operator: '王顾问', operatorRole: 'consultant', createdAt: '2024-06-13 16:00' },
  { id: 'ch4', communicationId: 'c3', type: 'meeting', content: '线下面谈，确认暑期课程时间安排，家长表示满意', operator: '张老师', operatorRole: 'teaching', createdAt: '2024-06-12 10:00' },
  { id: 'ch5', communicationId: 'c5', type: 'message', content: '发送比赛报名链接及准备事项清单', operator: '刘老师', operatorRole: 'teaching', createdAt: '2024-06-11 14:00' },
  { id: 'ch6', communicationId: 'c6', type: 'call', content: '反馈学员学习进度，建议加强练习频率', operator: '王老师', operatorRole: 'teaching', createdAt: '2024-06-08 09:30' },
];
