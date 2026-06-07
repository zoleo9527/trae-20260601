
import type {
  User,
  UserRole,
  PromotionDisplay,
  InspectionRectification,
  Remark,
  OperationHistory,
} from '../../shared/types.js';

interface DataStore {
  users: User[];
  promotions: PromotionDisplay[];
  inspections: InspectionRectification[];
  remarks: Remark[];
  operationHistory: OperationHistory[];
}

let store: DataStore = {
  users: [],
  promotions: [],
  inspections: [],
  remarks: [],
  operationHistory: [],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function initDatabase() {
  seedData();
}

function addOperationHistory(
  sourceId: string,
  source: 'promotion' | 'inspection',
  action: string,
  description: string,
  userId: string,
  userName: string,
  userRole: string,
  rejectReason?: string
) {
  const history: OperationHistory = {
    id: generateId(),
    sourceId,
    source,
    action,
    description,
    userId,
    userName,
    userRole: userRole as UserRole,
    createdAt: new Date().toISOString(),
    rejectReason,
  };
  store.operationHistory.unshift(history);
  return history;
}

export function resetDatabase() {
  store = {
    users: [],
    promotions: [],
    inspections: [],
    remarks: [],
    operationHistory: [],
  };
  seedData();
}

export function seedData() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  store.users = [
    { id: 'u1', username: 'manager', role: 'store_manager' as UserRole, name: '张店长', storeId: 's1', storeName: '便利店-望京店' },
    { id: 'u2', username: 'supervisor', role: 'supervisor' as UserRole, name: '李督导' },
    { id: 'u3', username: 'specialist', role: 'product_specialist' as UserRole, name: '王专员' },
  ];

  store.promotions = [
    {
      id: 'p1',
      title: '618夏季饮料堆头陈列',
      description: '入口处主通道堆头，可乐、雪碧、冰红茶各2层，搭配爆炸贴',
      storeId: 's1',
      storeName: '便利店-望京店',
      productSpecialistId: 'u3',
      productSpecialistName: '王专员',
      status: 'processing',
      createdAt: yesterday.toISOString(),
      deadline: tomorrow.toISOString().split('T')[0],
      remarks: [],
      images: [],
      inspectionCount: 1,
    },
    {
      id: 'p2',
      title: '冰淇淋新品端架陈列',
      description: '冷柜旁端架，梦龙、可爱多新品主打，配试吃盒',
      storeId: 's1',
      storeName: '便利店-望京店',
      productSpecialistId: 'u3',
      productSpecialistName: '王专员',
      status: 'pending',
      createdAt: now.toISOString(),
      deadline: nextWeek.toISOString().split('T')[0],
      remarks: [],
      images: [],
      inspectionCount: 0,
    },
    {
      id: 'p3',
      title: '日用品促销挂条陈列',
      description: '收银台旁挂条，牙膏、牙刷、纸巾组合装',
      storeId: 's1',
      storeName: '便利店-望京店',
      productSpecialistId: 'u3',
      productSpecialistName: '王专员',
      status: 'has_issue',
      createdAt: threeDaysAgo.toISOString(),
      deadline: yesterday.toISOString().split('T')[0],
      remarks: [],
      images: [],
      inspectionCount: 1,
    },
  ];

  store.inspections = [
    {
      id: 'i1',
      promotionId: 'p1',
      promotionTitle: '618夏季饮料堆头陈列',
      storeId: 's1',
      storeName: '便利店-望京店',
      supervisorId: 'u2',
      supervisorName: '李督导',
      title: '饮料堆头陈列不规范',
      description: '巡店发现618饮料堆头缺少爆炸贴，可乐摆放位置错误，未按陈列图执行',
      requirement: '今天内补充爆炸贴，按照陈列图重新摆放，确保商品正面朝外',
      status: 'rejected',
      createdAt: yesterday.toISOString(),
      deadline: tomorrow.toISOString().split('T')[0],
      remarks: [],
      rejectCount: 1,
      lastRejectReason: '整改照片不清晰，爆炸贴位置仍然不对，重新整改',
      images: [],
      replyImages: [],
      replyContent: '已整改，爆炸贴已重新粘贴，请查看',
      replyAt: oneHourAgo.toISOString(),
    },
    {
      id: 'i2',
      promotionId: undefined,
      promotionTitle: undefined,
      storeId: 's1',
      storeName: '便利店-望京店',
      supervisorId: 'u2',
      supervisorName: '李督导',
      title: '货架商品过期',
      description: 'A3货架第2层有3包面包已过期2天，存在食品安全隐患',
      requirement: '立即下架所有过期商品，全面检查全店商品效期，提交检查报告',
      status: 'reviewing',
      createdAt: twoHoursAgo.toISOString(),
      deadline: now.toISOString().split('T')[0],
      remarks: [],
      rejectCount: 0,
      lastRejectReason: undefined,
      images: [],
      replyImages: [],
      replyContent: '已全部下架，完成全店效期检查，共发现并下架5件临期商品',
      replyAt: oneHourAgo.toISOString(),
    },
    {
      id: 'i3',
      promotionId: undefined,
      promotionTitle: undefined,
      storeId: 's1',
      storeName: '便利店-望京店',
      supervisorId: 'u2',
      supervisorName: '李督导',
      title: '收银台卫生不达标',
      description: '收银台有污渍，POS机表面灰尘较多，垃圾桶未及时清理',
      requirement: '立即清洁，保持台面整洁，制定每小时清洁制度',
      status: 'completed',
      createdAt: threeDaysAgo.toISOString(),
      deadline: yesterday.toISOString().split('T')[0],
      remarks: [],
      rejectCount: 0,
      lastRejectReason: undefined,
      images: [],
      replyImages: [],
      replyContent: '已清洁完成，已制定收银台清洁检查表',
      replyAt: twoHoursAgo.toISOString(),
    },
    {
      id: 'i4',
      promotionId: 'p3',
      promotionTitle: '日用品促销挂条陈列',
      storeId: 's1',
      storeName: '便利店-望京店',
      supervisorId: 'u2',
      supervisorName: '李督导',
      title: '促销挂条位置错误',
      description: '日用品促销挂条未挂在收银台旁，被移到了角落，严重影响销售',
      requirement: '立即将挂条移回收银台旁显眼位置，确保顾客容易看到',
      status: 'rejected',
      createdAt: threeDaysAgo.toISOString(),
      deadline: yesterday.toISOString().split('T')[0],
      remarks: [],
      rejectCount: 2,
      lastRejectReason: '第二次退回：挂条仍然不在指定位置，店长请重视！',
      images: [],
      replyImages: [],
      replyContent: '已移动，请检查',
      replyAt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'i5',
      promotionId: 'p2',
      promotionTitle: '冰淇淋新品端架陈列',
      storeId: 's1',
      storeName: '便利店-望京店',
      supervisorId: 'u2',
      supervisorName: '李督导',
      title: '冰淇淋端架缺货',
      description: '巡店发现冰淇淋新品端架有2个空位，梦龙口味缺货，试吃盒为空',
      requirement: '立即补货，确保端架饱满，试吃盒随时有试吃品',
      status: 'pending',
      createdAt: now.toISOString(),
      deadline: tomorrow.toISOString().split('T')[0],
      remarks: [],
      rejectCount: 0,
      lastRejectReason: undefined,
      images: [],
      replyImages: [],
      replyContent: undefined,
      replyAt: undefined,
    },
  ];

  store.remarks = [
    {
      id: 'r1',
      sourceId: 'p1',
      source: 'promotion',
      userId: 'u3',
      userName: '王专员',
      userRole: 'product_specialist',
      content: '堆头位置选在入口主通道，注意保持通道畅通',
      createdAt: yesterday.toISOString(),
    },
    {
      id: 'r2',
      sourceId: 'p1',
      source: 'promotion',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      content: '已收到，今天下午安排店员执行',
      createdAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r3',
      sourceId: 'i1',
      source: 'inspection',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      content: '这个问题和促销陈列p1直接相关，陈列图上周刚发过',
      createdAt: yesterday.toISOString(),
    },
    {
      id: 'r4',
      sourceId: 'i1',
      source: 'inspection',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      content: '已整改，照片已上传，请查看',
      createdAt: oneHourAgo.toISOString(),
    },
  ];

  store.operationHistory = [
    {
      id: 'h1',
      sourceId: 'p1',
      source: 'promotion',
      action: 'create',
      description: '商品专员创建了促销陈列任务',
      userId: 'u3',
      userName: '王专员',
      userRole: 'product_specialist',
      createdAt: yesterday.toISOString(),
    },
    {
      id: 'h2',
      sourceId: 'p1',
      source: 'promotion',
      action: 'status_update',
      description: '状态更新为「处理中」',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      createdAt: new Date(yesterday.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'h3',
      sourceId: 'i1',
      source: 'inspection',
      action: 'create',
      description: '督导发起了巡店整改，关联促销陈列p1',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: yesterday.toISOString(),
    },
    {
      id: 'h4',
      sourceId: 'i1',
      source: 'inspection',
      action: 'reply',
      description: '店长提交了整改回复，等待审核',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      createdAt: oneHourAgo.toISOString(),
    },
    {
      id: 'h5',
      sourceId: 'i1',
      source: 'inspection',
      action: 'status_update',
      description: '状态更新为「已退回」',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: new Date(oneHourAgo.getTime() + 30 * 60 * 1000).toISOString(),
      rejectReason: '整改照片不清晰，爆炸贴位置仍然不对，重新整改',
    },
    {
      id: 'h6',
      sourceId: 'i3',
      source: 'inspection',
      action: 'create',
      description: '督导发起了巡店整改',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: threeDaysAgo.toISOString(),
    },
    {
      id: 'h7',
      sourceId: 'i3',
      source: 'inspection',
      action: 'reply',
      description: '店长提交了整改回复，等待审核',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      createdAt: new Date(threeDaysAgo.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'h8',
      sourceId: 'i3',
      source: 'inspection',
      action: 'status_update',
      description: '状态更新为「已完成」',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: twoHoursAgo.toISOString(),
    },
    {
      id: 'h9',
      sourceId: 'i2',
      source: 'inspection',
      action: 'create',
      description: '督导发起了巡店整改',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: twoHoursAgo.toISOString(),
    },
    {
      id: 'h10',
      sourceId: 'i2',
      source: 'inspection',
      action: 'reply',
      description: '店长提交了整改回复，等待审核',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      createdAt: oneHourAgo.toISOString(),
    },
    {
      id: 'h11',
      sourceId: 'i4',
      source: 'inspection',
      action: 'create',
      description: '督导发起了巡店整改，关联促销陈列p3',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: threeDaysAgo.toISOString(),
    },
    {
      id: 'h12',
      sourceId: 'i4',
      source: 'inspection',
      action: 'reply',
      description: '店长提交了整改回复，等待审核',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      createdAt: new Date(threeDaysAgo.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'h13',
      sourceId: 'i4',
      source: 'inspection',
      action: 'status_update',
      description: '状态更新为「已退回」',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: new Date(threeDaysAgo.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      rejectReason: '挂条位置不对，仍在角落，请重新放置',
    },
    {
      id: 'h14',
      sourceId: 'i4',
      source: 'inspection',
      action: 'reply',
      description: '店长重新提交了整改回复，等待审核',
      userId: 'u1',
      userName: '张店长',
      userRole: 'store_manager',
      createdAt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'h15',
      sourceId: 'i4',
      source: 'inspection',
      action: 'status_update',
      description: '状态更新为「已退回」（第2次）',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: new Date(threeDaysAgo.getTime() + 30 * 60 * 60 * 1000).toISOString(),
      rejectReason: '第二次退回：挂条仍然不在指定位置，店长请重视！',
    },
    {
      id: 'h16',
      sourceId: 'i5',
      source: 'inspection',
      action: 'create',
      description: '督导发起了巡店整改，关联促销陈列p2',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: now.toISOString(),
    },
    {
      id: 'h17',
      sourceId: 'p3',
      source: 'promotion',
      action: 'status_update',
      description: '状态更新为「有问题」',
      userId: 'u2',
      userName: '李督导',
      userRole: 'supervisor',
      createdAt: new Date(threeDaysAgo.getTime() + 30 * 60 * 60 * 1000).toISOString(),
    },
  ];

  store.promotions.forEach((p) => {
    p.remarks = store.remarks.filter((r) => r.sourceId === p.id && r.source === 'promotion');
    p.inspectionCount = store.inspections.filter((i) => i.promotionId === p.id).length;
  });
}

export const db = {
  get users() { return [...store.users]; },
  get promotions() { return [...store.promotions]; },
  get inspections() { return [...store.inspections]; },
  get remarks() { return [...store.remarks]; },

  getUserById: (id: string) => store.users.find((u) => u.id === id),
  findUserByUsernameAndRole: (username: string, role: string) =>
    store.users.find((u) => u.username === username && u.role === role),

  addPromotion: (promo: Omit<PromotionDisplay, 'id' | 'createdAt' | 'remarks' | 'images' | 'inspectionCount'>) => {
    const newPromo: PromotionDisplay = {
      ...promo,
      id: generateId(),
      createdAt: new Date().toISOString(),
      remarks: [],
      images: [],
      inspectionCount: 0,
    };
    store.promotions.unshift(newPromo);
    return newPromo;
  },

  updatePromotionStatus: (id: string, status: string, userId?: string, userName?: string, userRole?: string) => {
    const promo = store.promotions.find((p) => p.id === id);
    if (promo) {
      (promo as any).status = status;
      if (userId && userName && userRole) {
        const statusText: Record<string, string> = {
          pending: '待处理',
          processing: '处理中',
          completed: '已完成',
          has_issue: '有问题',
        };
        addOperationHistory(
          id,
          'promotion',
          'status_update',
          `状态更新为「${statusText[status] || status}」`,
          userId,
          userName,
          userRole
        );
      }
      return true;
    }
    return false;
  },

  getPromotionById: (id: string) => {
    const promo = store.promotions.find((p) => p.id === id);
    if (!promo) return null;
    const remarks = store.remarks.filter((r) => r.sourceId === id && r.source === 'promotion');
    const inspectionCount = store.inspections.filter((i) => i.promotionId === id).length;
    const history = store.operationHistory.filter((h) => h.sourceId === id && h.source === 'promotion');
    return { ...promo, remarks, inspectionCount, operationHistory: history };
  },

  addPromotionRemark: (promotionId: string, userId: string, userName: string, userRole: string, content: string) => {
    const remark: Remark = {
      id: generateId(),
      sourceId: promotionId,
      source: 'promotion',
      userId,
      userName,
      userRole: userRole as any,
      content,
      createdAt: new Date().toISOString(),
    };
    store.remarks.unshift(remark);
    return remark;
  },

  addInspection: (inspection: Omit<InspectionRectification, 'id' | 'createdAt' | 'remarks' | 'images' | 'replyImages' | 'rejectCount' | 'lastRejectReason'>) => {
    const newInspection: InspectionRectification = {
      ...inspection,
      id: generateId(),
      createdAt: new Date().toISOString(),
      remarks: [],
      images: [],
      replyImages: [],
      rejectCount: 0,
      lastRejectReason: undefined,
    };
    store.inspections.unshift(newInspection);
    return newInspection;
  },

  updateInspectionStatus: (id: string, status: string, rejectReason?: string, userId?: string, userName?: string, userRole?: string) => {
    const inspection = store.inspections.find((i) => i.id === id);
    if (!inspection) return false;
    (inspection as any).status = status;
    if (status === 'rejected' && rejectReason) {
      (inspection as any).rejectCount = (inspection.rejectCount || 0) + 1;
      (inspection as any).lastRejectReason = rejectReason;
    }
    if (userId && userName && userRole) {
      const statusText: Record<string, string> = {
        pending: '待整改',
        processing: '整改中',
        reviewing: '待审核',
        completed: '已完成',
        rejected: '已退回',
      };
      addOperationHistory(
        id,
        'inspection',
        'status_update',
        `状态更新为「${statusText[status] || status}」`,
        userId,
        userName,
        userRole,
        status === 'rejected' ? rejectReason : undefined
      );
    }
    return true;
  },

  replyInspection: (id: string, content: string, userId?: string, userName?: string, userRole?: string) => {
    const inspection = store.inspections.find((i) => i.id === id);
    if (!inspection) return false;
    (inspection as any).replyContent = content;
    (inspection as any).replyAt = new Date().toISOString();
    (inspection as any).status = 'reviewing';
    if (userId && userName && userRole) {
      addOperationHistory(
        id,
        'inspection',
        'reply',
        '店长提交了整改回复，等待审核',
        userId,
        userName,
        userRole
      );
    }
    return true;
  },

  getInspectionById: (id: string) => {
    const inspection = store.inspections.find((i) => i.id === id);
    if (!inspection) return null;
    const inspectionRemarks = store.remarks.filter((r) => r.sourceId === id && r.source === 'inspection');
    const relatedPromotionRemarks = inspection.promotionId
      ? store.remarks
          .filter((r) => r.sourceId === inspection.promotionId && r.source === 'promotion')
          .map((r) => ({ ...r, content: `${r.content}` }))
      : [];
    const allRemarks = [...inspectionRemarks, ...relatedPromotionRemarks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const history = store.operationHistory.filter((h) => h.sourceId === id && h.source === 'inspection');
    return { ...inspection, remarks: allRemarks, operationHistory: history };
  },

  addInspectionRemark: (inspectionId: string, userId: string, userName: string, userRole: string, content: string) => {
    const remark: Remark = {
      id: generateId(),
      sourceId: inspectionId,
      source: 'inspection',
      userId,
      userName,
      userRole: userRole as any,
      content,
      createdAt: new Date().toISOString(),
    };
    store.remarks.unshift(remark);
    return remark;
  },

  getPromotionRemarksForInspection: (promotionId: string | null | undefined) => {
    if (!promotionId) return [];
    return store.remarks.filter((r) => r.sourceId === promotionId && r.source === 'promotion');
  },
};
