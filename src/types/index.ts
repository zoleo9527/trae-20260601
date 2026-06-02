export type UserRole = 'teacher' | 'principal';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  password: string;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  childCount: number;
}

export type RecordType = 'arrival' | 'meal' | 'nap' | 'mood' | 'health' | 'other';
export type Severity = 'normal' | 'warning' | 'danger';

export interface DailyRecord {
  id: string;
  childId: string;
  type: RecordType;
  time: string;
  content: string;
  tags: string[];
  severity: Severity;
  photoIds: string[];
  createdBy: string;
}

export type MessagePriority = 'low' | 'medium' | 'high';

export interface Message {
  id: string;
  childId: string;
  sender: 'parent' | 'teacher';
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority: MessagePriority;
}

export interface Photo {
  id: string;
  childId: string;
  url: string;
  caption: string;
  timestamp: string;
}

export interface HealthAlert {
  id: string;
  childId: string;
  type: 'allergy' | 'medication' | 'special';
  description: string;
  isActive: boolean;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  allergies: string[];
  medications: string[];
  admissionDate: string;
}

export interface MealRecord {
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  time: string;
  food: string;
  amount: number;
}

export interface NapRecord {
  startTime: string;
  endTime: string;
  duration: number;
  quality: 'good' | 'fair' | 'poor';
  notes: string;
}

export interface QuickRecordForm {
  childId: string;
  type: RecordType;
  content: string;
  tags: string[];
  severity: Severity;
  photoIds: string[];
}

export const RECORD_TYPE_LABELS: globalThis.Record<RecordType, string> = {
  arrival: '入园',
  meal: '喂养',
  nap: '午睡',
  mood: '情绪',
  health: '健康',
  other: '其他',
};

export const RECORD_TYPE_ICONS: globalThis.Record<RecordType, string> = {
  arrival: '🏫',
  meal: '🍽️',
  nap: '😴',
  mood: '😊',
  health: '❤️',
  other: '📝',
};

export const RECORD_TYPE_COLORS: globalThis.Record<RecordType, string> = {
  arrival: 'bg-info-100 text-info-700',
  meal: 'bg-primary-100 text-primary-700',
  nap: 'bg-purple-100 text-purple-700',
  mood: 'bg-yellow-100 text-yellow-700',
  health: 'bg-warning-100 text-warning-700',
  other: 'bg-gray-100 text-gray-700',
};

export const SEVERITY_LABELS: globalThis.Record<Severity, string> = {
  normal: '正常',
  warning: '需关注',
  danger: '紧急',
};

export const SEVERITY_COLORS: globalThis.Record<Severity, string> = {
  normal: 'bg-success-100 text-success-700 border-success-300',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  danger: 'bg-warning-100 text-warning-700 border-warning-300',
};

export const QUICK_TAGS: globalThis.Record<RecordType, string[]> = {
  arrival: ['情绪稳定', '哭闹', '开心', '需要安抚', '主动入园', '牵手入园', '哭闹20分钟'],
  meal: ['食欲好', '食欲一般', '挑食', '过敏餐', '全部吃完', '吃了一半', '需要喂食'],
  nap: ['睡得好', '睡得久', '睡得短', '难以入睡', '需要安抚', '尿床', '出汗多'],
  mood: ['开心', '安静', '活泼', '烦躁', '想妈妈', '和小朋友玩', '喜欢玩具'],
  health: ['轻微擦伤', '有点咳嗽', '有点发烧', '过敏反应', '正常', '需要多喝水', '已用药'],
  other: ['户外活动', '手工活动', '讲故事', '玩游戏', '画画', '唱歌', '午睡起床'],
};
