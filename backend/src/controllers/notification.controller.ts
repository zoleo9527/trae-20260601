import { Request, Response } from 'express';
import { dataStore } from '../utils/dataStore.js';

const mockNotifications = [
  {
    id: 'notif_001',
    type: 'MATERIAL_CHANGE_REQUIRED',
    title: '讲师排班已变更，请重新确认物料',
    content: '课程【古钱币探秘】的排班信息已变更（时间），请检查物料准备是否需要调整',
    recipients: ['user_007'],
    relatedScheduleId: 'sch_004',
    relatedMaterialId: 'mat_002',
    priority: 'HIGH',
    actions: [
      { type: 'VIEW_SCHEDULE', label: '查看排班' },
      { type: 'VIEW_MATERIAL', label: '查看物料' },
      { type: 'RECONFIRM', label: '重新确认物料' },
    ],
    readBy: [],
    createdAt: '2026-06-17 15:05',
  },
  {
    id: 'notif_002',
    type: 'SCHEDULE_CHANGED',
    title: '您的排班已变更',
    content: '课程【古钱币探秘】的排班信息已变更，物料管理员将重新确认物料准备情况',
    recipients: ['user_001'],
    relatedScheduleId: 'sch_004',
    relatedMaterialId: 'mat_002',
    priority: 'HIGH',
    actions: [
      { type: 'VIEW_SCHEDULE', label: '查看排班详情' },
      { type: 'VIEW_MATERIAL', label: '查看物料准备' },
    ],
    readBy: [],
    createdAt: '2026-06-17 15:05',
  },
  {
    id: 'notif_003',
    type: 'SCHEDULE_PENDING_CONFIRM',
    title: '待确认排班申请',
    content: '有新的排班申请需要您确认：【书画临摹体验】',
    recipients: ['user_002'],
    relatedScheduleId: 'sch_002',
    priority: 'MEDIUM',
    actions: [
      { type: 'VIEW_SCHEDULE', label: '查看详情' },
      { type: 'APPROVE', label: '确认排班' },
    ],
    readBy: [],
    createdAt: '2026-06-16 09:00',
  },
  {
    id: 'notif_004',
    type: 'SCHEDULE_APPROVED',
    title: '待审核排班申请',
    content: '排班【陶瓷制作工坊】已确认，请审核',
    recipients: ['user_005', 'user_008'],
    relatedScheduleId: 'sch_003',
    priority: 'MEDIUM',
    actions: [
      { type: 'VIEW_SCHEDULE', label: '查看详情' },
      { type: 'PUBLISH', label: '发布排班' },
    ],
    readBy: [],
    createdAt: '2026-06-17 14:00',
  },
  {
    id: 'notif_005',
    type: 'MATERIAL_CREATED',
    title: '新物料清单已创建',
    content: '课程【青铜器鉴赏入门】的排班已发布，请及时准备物料',
    recipients: ['user_006', 'user_007'],
    relatedScheduleId: 'sch_001',
    relatedMaterialId: 'mat_001',
    priority: 'MEDIUM',
    actions: [
      { type: 'VIEW_MATERIAL', label: '查看物料清单' },
      { type: 'CLAIM', label: '认领任务' },
    ],
    readBy: ['user_006'],
    createdAt: '2026-06-15 11:00',
  },
];

export async function getNotificationList(req: Request, res: Response) {
  try {
    const { userId, type, read, page = 1, pageSize = 20 } = req.query;

    let notifications = await dataStore.findAll('notifications.json');
    if (notifications.length === 0) {
      notifications = mockNotifications;
      await dataStore.write('notifications.json', notifications);
    }

    if (userId) {
      notifications = notifications.filter((n: any) => n.recipients.includes(userId));
    }

    if (type) {
      notifications = notifications.filter((n: any) => n.type === type);
    }

    if (read !== undefined) {
      const isRead = read === 'true';
      notifications = notifications.filter((n: any) =>
        isRead ? n.readBy.includes(userId) : !n.readBy.includes(userId)
      );
    }

    notifications.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = notifications.filter((n: any) => !n.readBy.includes(userId as string)).length;

    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const paginatedNotifications = notifications.slice(start, end);

    res.json({
      success: true,
      data: {
        items: paginatedNotifications,
        unreadCount,
        total: notifications.length,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取通知列表失败' },
    });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const { userId } = req.query;

    let notifications = await dataStore.findAll('notifications.json');
    if (notifications.length === 0) {
      notifications = mockNotifications;
    }

    const unreadCount = notifications.filter((n: any) =>
      !n.readBy.includes(userId as string)
    ).length;

    res.json({
      success: true,
      data: { count: unreadCount },
    });
  } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取未读数量失败' },
    });
  }
}

export async function getNotificationById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    let notifications = await dataStore.findAll('notifications.json');
    if (notifications.length === 0) {
      notifications = mockNotifications;
    }

    const notification = notifications.find((n: any) => n.id === id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: '通知不存在' },
      });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('获取通知详情失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取通知详情失败' },
    });
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    let notifications = await dataStore.findAll('notifications.json');
    if (notifications.length === 0) {
      notifications = mockNotifications;
    }

    const index = notifications.findIndex((n: any) => n.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: '通知不存在' },
      });
    }

    if (!notifications[index].readBy.includes(userId)) {
      notifications[index].readBy.push(userId);
      await dataStore.write('notifications.json', notifications);
    }

    res.json({
      success: true,
      message: '已标记为已读',
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '标记已读失败' },
    });
  }
}

export async function batchMarkAsRead(req: Request, res: Response) {
  try {
    const { userId, notificationIds } = req.body;

    let notifications = await dataStore.findAll('notifications.json');
    if (notifications.length === 0) {
      notifications = mockNotifications;
    }

    notificationIds.forEach((id: string) => {
      const index = notifications.findIndex((n: any) => n.id === id);
      if (index !== -1 && !notifications[index].readBy.includes(userId)) {
        notifications[index].readBy.push(userId);
      }
    });

    await dataStore.write('notifications.json', notifications);

    res.json({
      success: true,
      message: '批量标记成功',
    });
  } catch (error) {
    console.error('批量标记已读失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '批量标记已读失败' },
    });
  }
}

export async function executeAction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { userId, actionType, params } = req.body;

    let notifications = await dataStore.findAll('notifications.json');
    if (notifications.length === 0) {
      notifications = mockNotifications;
    }

    const index = notifications.findIndex((n: any) => n.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: '通知不存在' },
      });
    }

    if (!notifications[index].readBy.includes(userId)) {
      notifications[index].readBy.push(userId);
    }

    await dataStore.write('notifications.json', notifications);

    res.json({
      success: true,
      data: {
        action: actionType,
        result: '动作执行成功',
      },
    });
  } catch (error) {
    console.error('执行动作失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '执行动作失败' },
    });
  }
}