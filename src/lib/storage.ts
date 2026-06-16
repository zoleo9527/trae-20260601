import { browser } from '$app/environment';
import type { Booking, Procurement, Accommodation, Inventory, Alert, Notification } from './types';
import { STORAGE_KEYS } from './constants';

export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!browser) return defaultValue;
  
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (!browser) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function initializeData(): void {
  if (!browser) return;
  
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    const bookings: Booking[] = [
      {
        id: generateId(),
        customer_name: '张三',
        phone: '13800138001',
        booking_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        guest_count: 6,
        room_number: 'A101',
        status: 'confirmed',
        handler: '老板',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status_history: [
          {
            id: generateId(),
            booking_id: '',
            status: 'pending',
            handler: '系统',
            note: '客户提交预订',
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'confirmed',
            handler: '老板',
            note: '确认预订',
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: generateId(),
        customer_name: '李四',
        phone: '13800138002',
        booking_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        guest_count: 8,
        room_number: 'B202',
        status: 'pending',
        handler: '老板',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status_history: [
          {
            id: generateId(),
            booking_id: '',
            status: 'pending',
            handler: '系统',
            note: '客户提交预订',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: generateId(),
        customer_name: '王五',
        phone: '13800138003',
        booking_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        guest_count: 4,
        room_number: 'A102',
        status: 'dining',
        handler: '客房阿姨',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        status_history: [
          {
            id: generateId(),
            booking_id: '',
            status: 'pending',
            handler: '系统',
            note: '客户提交预订',
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'confirmed',
            handler: '老板',
            note: '确认预订',
            created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'arrived',
            handler: '客房阿姨',
            note: '客人到店',
            created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'dining',
            handler: '客房阿姨',
            note: '开始用餐',
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: generateId(),
        customer_name: '赵六',
        phone: '13800138004',
        booking_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        guest_count: 10,
        room_number: 'C301',
        status: 'completed',
        handler: '老板',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status_history: [
          {
            id: generateId(),
            booking_id: '',
            status: 'pending',
            handler: '系统',
            note: '客户提交预订',
            created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'confirmed',
            handler: '老板',
            note: '确认预订',
            created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'arrived',
            handler: '客房阿姨',
            note: '客人到店',
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'dining',
            handler: '客房阿姨',
            note: '开始用餐',
            created_at: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'billing',
            handler: '老板',
            note: '结账中',
            created_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            booking_id: '',
            status: 'completed',
            handler: '老板',
            note: '完成结账',
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: generateId(),
        customer_name: '孙七',
        phone: '13800138005',
        booking_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        guest_count: 12,
        room_number: 'D401',
        status: 'pending',
        handler: '老板',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status_history: [
          {
            id: generateId(),
            booking_id: '',
            status: 'pending',
            handler: '系统',
            note: '客户提交预订',
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
    bookings.forEach(b => {
      b.status_history.forEach(s => {
        s.booking_id = b.id;
      });
    });
    setToStorage(STORAGE_KEYS.BOOKINGS, bookings);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.PROCUREMENTS)) {
    const procurements: Procurement[] = [
      {
        id: generateId(),
        applicant: '后厨',
        apply_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        approver: '老板',
        approve_time: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        status: 'purchasing',
        items: [
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '土豆',
            quantity: 50,
            unit: '斤',
            note: '用于周末聚餐'
          },
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '白菜',
            quantity: 30,
            unit: '斤',
            note: ''
          }
        ],
        status_history: [
          {
            id: generateId(),
            procurement_id: '',
            status: 'pending',
            handler: '后厨',
            note: '提交采购申请',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'approved',
            handler: '老板',
            note: '批准采购',
            created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'purchasing',
            handler: '后厨',
            note: '开始采购',
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          }
        ],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        applicant: '后厨',
        apply_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        approver: null,
        approve_time: null,
        status: 'pending',
        items: [
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '鸡蛋',
            quantity: 100,
            unit: '个',
            note: '早餐用'
          },
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '面粉',
            quantity: 20,
            unit: '斤',
            note: ''
          }
        ],
        status_history: [
          {
            id: generateId(),
            procurement_id: '',
            status: 'pending',
            handler: '后厨',
            note: '提交采购申请',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          }
        ],
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        applicant: '后厨',
        apply_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        approver: '老板',
        approve_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        items: [
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '猪肉',
            quantity: 30,
            unit: '斤',
            note: '周末聚餐'
          }
        ],
        status_history: [
          {
            id: generateId(),
            procurement_id: '',
            status: 'pending',
            handler: '后厨',
            note: '提交采购申请',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'approved',
            handler: '老板',
            note: '批准采购',
            created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'purchasing',
            handler: '后厨',
            note: '开始采购',
            created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'received',
            handler: '后厨',
            note: '已收货',
            created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'completed',
            handler: '系统',
            note: '库存已更新',
            created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
          }
        ],
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        applicant: '后厨',
        apply_time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        approver: '老板',
        approve_time: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
        status: 'rejected',
        items: [
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '龙虾',
            quantity: 20,
            unit: '斤',
            note: '高端食材'
          }
        ],
        status_history: [
          {
            id: generateId(),
            procurement_id: '',
            status: 'pending',
            handler: '后厨',
            note: '提交采购申请',
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'rejected',
            handler: '老板',
            note: '暂不需要，预算不足',
            created_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
          }
        ],
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        applicant: '后厨',
        apply_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        approver: '老板',
        approve_time: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        status: 'received',
        items: [
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '青椒',
            quantity: 20,
            unit: '斤',
            note: ''
          },
          {
            id: generateId(),
            procurement_id: '',
            ingredient_name: '茄子',
            quantity: 15,
            unit: '斤',
            note: ''
          }
        ],
        status_history: [
          {
            id: generateId(),
            procurement_id: '',
            status: 'pending',
            handler: '后厨',
            note: '提交采购申请',
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'approved',
            handler: '老板',
            note: '批准采购',
            created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'purchasing',
            handler: '后厨',
            note: '开始采购',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: generateId(),
            procurement_id: '',
            status: 'received',
            handler: '后厨',
            note: '已收货',
            created_at: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString()
          }
        ],
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString()
      }
    ];
    procurements.forEach(p => {
      p.items.forEach(i => {
        i.procurement_id = p.id;
      });
      p.status_history.forEach(s => {
        s.procurement_id = p.id;
      });
    });
    setToStorage(STORAGE_KEYS.PROCUREMENTS, procurements);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.ACCOMMODATIONS)) {
    const accommodations: Accommodation[] = [
      {
        id: generateId(),
        guest_name: '张三',
        phone: '13800138001',
        room_number: '101',
        check_in_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        check_out_time: null,
        status: 'checked_in',
        handler: '客房阿姨',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        guest_name: '李四',
        phone: '13800138002',
        room_number: '102',
        check_in_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        check_out_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'checked_out',
        handler: '客房阿姨',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        guest_name: '王五',
        phone: '13800138003',
        room_number: '201',
        check_in_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        check_out_time: null,
        status: 'checked_in',
        handler: '客房阿姨',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        guest_name: '赵六',
        phone: '13800138004',
        room_number: '202',
        check_in_time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        check_out_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'checked_out',
        handler: '客房阿姨',
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        guest_name: '孙七',
        phone: '13800138005',
        room_number: '301',
        check_in_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        check_out_time: null,
        status: 'checked_in',
        handler: '客房阿姨',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];
    setToStorage(STORAGE_KEYS.ACCOMMODATIONS, accommodations);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
    const inventory: Inventory[] = [
      {
        id: generateId(),
        ingredient_name: '土豆',
        current_quantity: 100,
        unit: '斤',
        warning_threshold: 20,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '白菜',
        current_quantity: 50,
        unit: '斤',
        warning_threshold: 15,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '猪肉',
        current_quantity: 30,
        unit: '斤',
        warning_threshold: 10,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '鸡蛋',
        current_quantity: 200,
        unit: '个',
        warning_threshold: 50,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '面粉',
        current_quantity: 80,
        unit: '斤',
        warning_threshold: 20,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '青椒',
        current_quantity: 25,
        unit: '斤',
        warning_threshold: 10,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '茄子',
        current_quantity: 20,
        unit: '斤',
        warning_threshold: 8,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '西红柿',
        current_quantity: 15,
        unit: '斤',
        warning_threshold: 10,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '黄瓜',
        current_quantity: 8,
        unit: '斤',
        warning_threshold: 10,
        last_updated: new Date().toISOString()
      },
      {
        id: generateId(),
        ingredient_name: '豆腐',
        current_quantity: 5,
        unit: '块',
        warning_threshold: 10,
        last_updated: new Date().toISOString()
      }
    ];
    setToStorage(STORAGE_KEYS.INVENTORY, inventory);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
    const alerts: Alert[] = [
      {
        id: generateId(),
        title: '库存不足预警',
        description: '黄瓜库存仅剩8斤，低于预警阈值10斤',
        severity: 'high',
        type: 'inventory',
        related_id: '',
        status: 'active',
        created_at: new Date().toISOString(),
        resolved_at: null,
        handlers: []
      },
      {
        id: generateId(),
        title: '库存不足预警',
        description: '豆腐库存仅剩5块，低于预警阈值10块',
        severity: 'high',
        type: 'inventory',
        related_id: '',
        status: 'active',
        created_at: new Date().toISOString(),
        resolved_at: null,
        handlers: []
      },
      {
        id: generateId(),
        title: '采购申请待审批',
        description: '后厨提交的采购申请已超过24小时未审批',
        severity: 'medium',
        type: 'procurement',
        related_id: '',
        status: 'active',
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        resolved_at: null,
        handlers: []
      }
    ];
    setToStorage(STORAGE_KEYS.ALERTS, alerts);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    const notifications: Notification[] = [
      {
        id: generateId(),
        title: '新预订提醒',
        content: '孙七预订了D401包间，共12人',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateId(),
        title: '采购申请待审批',
        content: '后厨提交了新的采购申请，请及时审批',
        type: 'alert',
        is_read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        title: '库存不足',
        content: '黄瓜和豆腐库存不足，请及时补充',
        type: 'alert',
        is_read: false,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        title: '采购完成',
        content: '青椒和茄子采购已完成，库存已更新',
        type: 'success',
        is_read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        title: '客人入住',
        content: '孙七已入住301房间',
        type: 'info',
        is_read: true,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }
}