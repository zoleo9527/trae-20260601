import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../utils/dataStore.js';
import { ScheduleStatusMachine, actionToScheduleStatus } from '../utils/statusMachine.js';
import type { ScheduleStatus } from '../utils/statusMachine.js';
import { workflowService } from '../services/workflow.service.js';

const mockSchedules = [
  {
    id: 'sch_001',
    courseId: 'course_001',
    courseName: '青铜器鉴赏入门',
    scheduledAt: '2026-06-20 14:00',
    location: '一楼多功能厅',
    expectedParticipants: 30,
    participantType: 'STUDENT',
    lecturerId: 'user_001',
    lecturerName: '张明',
    lecturerPhone: '13800138001',
    lecturerEmail: 'zhangming@museum.com',
    lecturerRequirements: '需要投影仪和音响设备',
    status: 'PUBLISHED',
    statusHistory: [],
    changeHistory: [],
    attachments: [],
    materialListId: 'mat_001',
    materialStatus: 'IN_PROGRESS',
    createdBy: 'user_001',
    createdByName: '张明',
    createdAt: '2026-06-15 08:30',
    updatedAt: '2026-06-15 11:00',
  },
  {
    id: 'sch_002',
    courseId: 'course_002',
    courseName: '书画临摹体验',
    scheduledAt: '2026-06-22 10:00',
    location: '二楼书画室',
    expectedParticipants: 20,
    participantType: 'ADULT',
    lecturerId: 'user_002',
    lecturerName: '李华',
    lecturerPhone: '13800138002',
    lecturerEmail: 'lihua@museum.com',
    lecturerRequirements: '需要书法用具一套',
    status: 'PENDING_CONFIRM',
    statusHistory: [],
    changeHistory: [],
    attachments: [],
    materialListId: '',
    materialStatus: '',
    createdBy: 'user_002',
    createdByName: '李华',
    createdAt: '2026-06-16 09:00',
    updatedAt: '2026-06-16 09:00',
  },
  {
    id: 'sch_003',
    courseId: 'course_003',
    courseName: '陶瓷制作工坊',
    scheduledAt: '2026-06-25 14:00',
    location: '三楼陶艺室',
    expectedParticipants: 15,
    participantType: 'FAMILY',
    lecturerId: 'user_003',
    lecturerName: '王芳',
    lecturerPhone: '13800138003',
    lecturerEmail: 'wangfang@museum.com',
    lecturerRequirements: '需要陶土和烧制设备',
    status: 'APPROVED',
    statusHistory: [],
    changeHistory: [],
    attachments: [],
    materialListId: '',
    materialStatus: '',
    createdBy: 'user_003',
    createdByName: '王芳',
    createdAt: '2026-06-17 10:00',
    updatedAt: '2026-06-17 14:00',
  },
  {
    id: 'sch_004',
    courseId: 'course_004',
    courseName: '古钱币探秘',
    scheduledAt: '2026-06-21 15:00',
    location: '一楼展厅',
    expectedParticipants: 25,
    participantType: 'STUDENT',
    lecturerId: 'user_001',
    lecturerName: '张明',
    lecturerPhone: '13800138001',
    lecturerEmail: 'zhangming@museum.com',
    lecturerRequirements: '需要放大镜和展示柜',
    status: 'CHANGED',
    statusHistory: [],
    changeHistory: [
      {
        id: 'ch_001',
        field: 'scheduledAt',
        oldValue: '2026-06-21 10:00',
        newValue: '2026-06-21 15:00',
        changedBy: 'user_005',
        changedByName: '刘伟',
        changedAt: '2026-06-17 16:00',
        reason: '时间调整',
      },
    ],
    attachments: [],
    materialListId: 'mat_002',
    materialStatus: 'BLOCKED',
    createdBy: 'user_001',
    createdByName: '张明',
    createdAt: '2026-06-14 08:00',
    updatedAt: '2026-06-17 16:00',
  },
  {
    id: 'sch_005',
    courseId: 'course_005',
    courseName: '古代服饰文化',
    scheduledAt: '2026-06-23 09:30',
    location: '二楼多功能厅',
    expectedParticipants: 40,
    participantType: 'ADULT',
    lecturerId: 'user_002',
    lecturerName: '李华',
    lecturerPhone: '13800138002',
    lecturerEmail: 'lihua@museum.com',
    lecturerRequirements: '需要服饰展示架',
    status: 'DRAFT',
    statusHistory: [],
    changeHistory: [],
    attachments: [],
    materialListId: '',
    materialStatus: '',
    createdBy: 'user_002',
    createdByName: '李华',
    createdAt: '2026-06-18 08:30',
    updatedAt: '2026-06-18 08:30',
  },
];

export async function getScheduleList(req: Request, res: Response) {
  try {
    const { status, lecturerId, page = 1, pageSize = 20 } = req.query;

    let schedules = await dataStore.findAll('schedules.json');
    if (schedules.length === 0) {
      schedules = mockSchedules;
      await dataStore.write('schedules.json', schedules);
    }

    if (status) {
      schedules = schedules.filter((s: any) => s.status === status);
    }

    if (lecturerId) {
      schedules = schedules.filter((s: any) => s.lecturerId === lecturerId);
    }

    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const paginatedSchedules = schedules.slice(start, end);

    res.json({
      success: true,
      data: {
        items: paginatedSchedules,
        total: schedules.length,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取排班列表失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取排班列表失败' },
    });
  }
}

export async function getScheduleById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    let schedules = await dataStore.findAll('schedules.json');
    if (schedules.length === 0) {
      schedules = mockSchedules;
    }

    const schedule = schedules.find((s: any) => s.id === id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCHEDULE_NOT_FOUND', message: '排班不存在' },
      });
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('获取排班详情失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取排班详情失败' },
    });
  }
}

export async function createSchedule(req: Request, res: Response) {
  try {
    const scheduleData = {
      ...req.body,
      id: `sch_${uuidv4()}`,
      status: 'DRAFT',
      statusHistory: [],
      changeHistory: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let schedules = await dataStore.findAll('schedules.json');
    if (schedules.length === 0) {
      schedules = mockSchedules;
    }

    schedules.push(scheduleData);
    await dataStore.write('schedules.json', schedules);

    await workflowService.onScheduleCreated(scheduleData);

    res.json({
      success: true,
      data: scheduleData,
      message: '排班创建成功',
    });
  } catch (error) {
    console.error('创建排班失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '创建排班失败' },
    });
  }
}

export async function updateSchedule(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let schedules = await dataStore.findAll('schedules.json');
    if (schedules.length === 0) {
      schedules = mockSchedules;
    }

    const index = schedules.findIndex((s: any) => s.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCHEDULE_NOT_FOUND', message: '排班不存在' },
      });
    }

    const oldSchedule = { ...schedules[index] };
    const changedFields: string[] = [];

    Object.keys(updateData).forEach(key => {
      if (oldSchedule[key] !== updateData[key]) {
        changedFields.push(key);
      }
    });

    if (changedFields.length > 0 && oldSchedule.status === 'PUBLISHED') {
      const changeHistoryEntry = {
        id: `ch_${uuidv4()}`,
        field: changedFields[0],
        oldValue: String(oldSchedule[changedFields[0]]),
        newValue: String(updateData[changedFields[0]]),
        changedBy: updateData.updatedBy || 'user_001',
        changedByName: updateData.updatedByName || '未知',
        changedAt: new Date().toISOString(),
        reason: updateData.changeReason,
      };

      updateData.changeHistory = [...(oldSchedule.changeHistory || []), changeHistoryEntry];
      updateData.status = 'CHANGED';
    }

    schedules[index] = {
      ...oldSchedule,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await dataStore.write('schedules.json', schedules);

    if (changedFields.length > 0) {
      await workflowService.onScheduleChanged(schedules[index], oldSchedule);
    }

    res.json({
      success: true,
      data: schedules[index],
      message: '排班更新成功',
      notifications: changedFields.length > 0 ? [{ type: 'SCHEDULE_CHANGED' }] : [],
    });
  } catch (error) {
    console.error('更新排班失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '更新排班失败' },
    });
  }
}

export async function transitionSchedule(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action, reason, remarks } = req.body;

    const targetStatus = actionToScheduleStatus[action as keyof typeof actionToScheduleStatus];
    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: '无效的操作' },
      });
    }

    let schedules = await dataStore.findAll('schedules.json');
    if (schedules.length === 0) {
      schedules = mockSchedules;
    }

    const index = schedules.findIndex((s: any) => s.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCHEDULE_NOT_FOUND', message: '排班不存在' },
      });
    }

    const schedule = schedules[index];
    const currentStatus = schedule.status as ScheduleStatus;
    const statusConfig = ScheduleStatusMachine[currentStatus];

    if (!statusConfig.allowedTransitions.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `不能从 ${statusConfig.label} 转换到 ${ScheduleStatusMachine[targetStatus].label}`,
        },
      });
    }

    const statusTransition = {
      id: `st_${uuidv4()}`,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      operator: req.body.userId || 'user_001',
      operatorName: req.body.userName || '未知',
      reason,
      remarks,
      createdAt: new Date().toISOString(),
    };

    const oldStatus = schedule.status;
    schedule.status = targetStatus;
    schedule.statusHistory = [...(schedule.statusHistory || []), statusTransition];
    schedule.updatedAt = new Date().toISOString();

    if (targetStatus === 'PUBLISHED') {
      schedule.materialListId = `mat_${uuidv4()}`;
      schedule.materialStatus = 'NOT_STARTED';
    }

    if (targetStatus === 'CHANGED') {
      schedule.materialStatus = 'BLOCKED';
    }

    schedules[index] = schedule;
    await dataStore.write('schedules.json', schedules);

    await workflowService.onScheduleTransitioned(schedule, oldStatus, targetStatus);

    res.json({
      success: true,
      data: schedule,
      message: '状态流转成功',
      relatedMaterialUpdated: targetStatus === 'PUBLISHED' || targetStatus === 'CHANGED',
    });
  } catch (error) {
    console.error('状态流转失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '状态流转失败' },
    });
  }
}