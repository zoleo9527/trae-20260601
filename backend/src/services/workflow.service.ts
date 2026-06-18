import { EventEmitter } from 'events';
import { dataStore } from '../utils/dataStore.js';
import { v4 as uuidv4 } from 'uuid';

interface ActivitySchedule {
  id: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  scheduledAt: string;
  location: string;
  expectedParticipants: number;
  status: string;
  materialListId?: string;
  changeHistory: any[];
  updatedAt: string;
}

interface MaterialList {
  id: string;
  scheduleId: string;
  status: string;
  preparedBy: string;
  preparedByName: string;
  scheduleSnapshot: {
    lecturerName: string;
    scheduledAt: string;
    location: string;
    expectedParticipants: number;
  };
  updatedAt: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  recipients: string[];
  relatedScheduleId?: string;
  relatedMaterialId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actions: { type: string; label: string }[];
  readBy: string[];
  createdAt: string;
}

export class WorkflowService {
  private eventEmitter = new EventEmitter();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitter.on('schedule.created', async (data: { schedule: ActivitySchedule }) => {
      await this.handleScheduleCreated(data.schedule);
    });

    this.eventEmitter.on('schedule.changed', async (data: {
      schedule: ActivitySchedule;
      oldSchedule: Partial<ActivitySchedule>;
      changedFields: string[];
    }) => {
      await this.handleScheduleChanged(data);
    });

    this.eventEmitter.on('schedule.transitioned', async (data: {
      schedule: ActivitySchedule;
      fromStatus: string;
      toStatus: string;
    }) => {
      await this.handleScheduleTransitioned(data);
    });

    this.eventEmitter.on('material.transitioned', async (data: {
      material: MaterialList;
      fromStatus: string;
      toStatus: string;
    }) => {
      await this.handleMaterialTransitioned(data);
    });
  }

  private async handleScheduleCreated(schedule: ActivitySchedule) {
    console.log('Workflow: Schedule created', schedule.id);
  }

  private async handleScheduleChanged(data: {
    schedule: ActivitySchedule;
    oldSchedule: Partial<ActivitySchedule>;
    changedFields: string[];
  }) {
    const { schedule, changedFields } = data;

    const impactFields = ['scheduledAt', 'location', 'lecturerId', 'lecturerName', 'expectedParticipants', 'courseName'];
    const hasMaterialImpact = changedFields.some(field => impactFields.includes(field));

    if (schedule.materialListId) {
      const materials = await dataStore.findAll<MaterialList>('materials.json');
      const materialIndex = materials.findIndex(m => m.id === schedule.materialListId);

      if (materialIndex !== -1) {
        const material = materials[materialIndex];
        
        if (hasMaterialImpact && material.status !== 'RETURNED') {
          await this.updateMaterialStatusWithBackwardInfo(material.id, 'BLOCKED', {
            reason: `排班变更：${changedFields.join(', ')}`,
            blockedByScheduleId: schedule.id,
            blockedByScheduleName: schedule.courseName,
            changedFields,
          });

          await this.updateMaterialScheduleSnapshot(material.id, schedule);
          await this.updateScheduleMaterialStatus(schedule.id, 'BLOCKED');

          const changeLabels = changedFields.map(field => {
            const labelMap: Record<string, string> = {
              scheduledAt: '时间',
              location: '地点',
              lecturerId: '讲师',
              lecturerName: '讲师姓名',
              expectedParticipants: '预计人数',
              courseName: '课程名称',
            };
            return labelMap[field] || field;
          }).join(', ');

          const affectedRecipients: string[] = [];
          if (material.preparedBy) {
            affectedRecipients.push(material.preparedBy);
          } else {
            affectedRecipients.push('user_006', 'user_007');
          }

          const notification = await this.createNotification({
            type: 'MATERIAL_CHANGE_REQUIRED',
            title: '讲师排班已变更，请重新确认物料',
            content: `课程【${schedule.courseName}】的排班信息已变更（${changeLabels}），请检查物料准备是否需要调整`,
            recipients: affectedRecipients,
            relatedScheduleId: schedule.id,
            relatedMaterialId: material.id,
            priority: 'HIGH',
            actions: [
              { type: 'VIEW_SCHEDULE', label: '查看排班' },
              { type: 'VIEW_MATERIAL', label: '查看物料' },
              { type: 'RECONFIRM', label: '重新确认物料' },
            ],
          });

          await this.createNotification({
            type: 'SCHEDULE_CHANGED',
            title: '您的排班已变更',
            content: `课程【${schedule.courseName}】的排班信息已变更，物料管理员将重新确认物料准备情况`,
            recipients: [schedule.lecturerId],
            relatedScheduleId: schedule.id,
            relatedMaterialId: material.id,
            priority: 'HIGH',
            actions: [
              { type: 'VIEW_SCHEDULE', label: '查看排班详情' },
              { type: 'VIEW_MATERIAL', label: '查看物料准备' },
            ],
          });

          await this.updateMaterialNotificationReference(material.id, notification.id);
        }
      }
    }
  }

  private async updateMaterialStatusWithBackwardInfo(materialId: string, status: string, options?: {
    reason?: string;
    blockedByScheduleId?: string;
    blockedByScheduleName?: string;
    changedFields?: string[];
  }) {
    let materials = await dataStore.findAll<MaterialList>('materials.json');
    const index = materials.findIndex(m => m.id === materialId);
    if (index !== -1) {
      materials[index].status = status;
      materials[index].updatedAt = new Date().toISOString();
      
      if (options?.blockedByScheduleId) {
        materials[index].blockedByScheduleId = options.blockedByScheduleId;
        materials[index].blockedByScheduleName = options.blockedByScheduleName;
        materials[index].blockedReason = options.reason;
        materials[index].blockedFields = options.changedFields;
        materials[index].blockedAt = new Date().toISOString();
      }
      
      await dataStore.write('materials.json', materials);
    }
  }

  private async updateMaterialNotificationReference(materialId: string, notificationId: string) {
    let materials = await dataStore.findAll<MaterialList>('materials.json');
    const index = materials.findIndex(m => m.id === materialId);
    if (index !== -1) {
      materials[index].lastNotificationId = notificationId;
      materials[index].updatedAt = new Date().toISOString();
      await dataStore.write('materials.json', materials);
    }
  }

  private async updateMaterialScheduleSnapshot(materialId: string, schedule: ActivitySchedule) {
    let materials = await dataStore.findAll<MaterialList>('materials.json');
    const index = materials.findIndex(m => m.id === materialId);
    if (index !== -1) {
      materials[index].scheduleSnapshot = {
        lecturerName: schedule.lecturerName,
        scheduledAt: schedule.scheduledAt,
        location: schedule.location,
        expectedParticipants: schedule.expectedParticipants,
        courseName: schedule.courseName,
      };
      materials[index].updatedAt = new Date().toISOString();
      await dataStore.write('materials.json', materials);
    }
  }

  private async updateScheduleMaterialStatus(scheduleId: string, materialStatus: string) {
    let schedules = await dataStore.findAll<ActivitySchedule>('schedules.json');
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index !== -1) {
      schedules[index].materialStatus = materialStatus;
      schedules[index].updatedAt = new Date().toISOString();
      await dataStore.write('schedules.json', schedules);
    }
  }

  private async handleScheduleTransitioned(data: {
    schedule: ActivitySchedule;
    fromStatus: string;
    toStatus: string;
  }) {
    const { schedule, toStatus } = data;

    if (toStatus === 'PUBLISHED') {
      await this.createMaterialList(schedule);

      await this.createNotification({
        type: 'MATERIAL_CREATED',
        title: '新物料清单已创建',
        content: `课程【${schedule.courseName}】的排班已发布，请及时准备物料`,
        recipients: ['user_006', 'user_007'],
        relatedScheduleId: schedule.id,
        relatedMaterialId: schedule.materialListId,
        priority: 'MEDIUM',
        actions: [
          { type: 'VIEW_MATERIAL', label: '查看物料清单' },
          { type: 'CLAIM', label: '认领任务' },
        ],
      });
    }

    if (toStatus === 'PENDING_CONFIRM') {
      await this.createNotification({
        type: 'SCHEDULE_PENDING_CONFIRM',
        title: '待确认排班申请',
        content: `有新的排班申请需要您确认：【${schedule.courseName}】`,
        recipients: [schedule.createdBy],
        relatedScheduleId: schedule.id,
        priority: 'MEDIUM',
        actions: [
          { type: 'VIEW_SCHEDULE', label: '查看详情' },
          { type: 'APPROVE', label: '确认排班' },
        ],
      });
    }

    if (toStatus === 'APPROVED') {
      await this.createNotification({
        type: 'SCHEDULE_APPROVED',
        title: '待审核排班申请',
        content: `排班【${schedule.courseName}】已确认，请审核`,
        recipients: ['user_005', 'user_008'],
        relatedScheduleId: schedule.id,
        priority: 'MEDIUM',
        actions: [
          { type: 'VIEW_SCHEDULE', label: '查看详情' },
          { type: 'PUBLISH', label: '发布排班' },
        ],
      });
    }

    if (toStatus === 'REJECTED') {
      await this.createNotification({
        type: 'SCHEDULE_REJECTED',
        title: '排班申请已退回',
        content: `排班【${schedule.courseName}】已被退回，请修改后重新提交`,
        recipients: [schedule.createdBy],
        relatedScheduleId: schedule.id,
        priority: 'HIGH',
        actions: [
          { type: 'VIEW_SCHEDULE', label: '查看详情' },
        ],
      });
    }

    if (toStatus === 'CHANGED' && schedule.materialListId) {
      const materials = await dataStore.findAll<MaterialList>('materials.json');
      const material = materials.find(m => m.id === schedule.materialListId);

      if (material && material.status !== 'RETURNED') {
        await this.updateMaterialStatus(material.id, 'BLOCKED', {
          reason: '排班已变更',
        });
      }
    }
  }

  private async handleMaterialTransitioned(data: {
    material: MaterialList;
    fromStatus: string;
    toStatus: string;
  }) {
    const { material, toStatus } = data;

    if (material.scheduleId) {
      await this.updateScheduleMaterialStatus(material.scheduleId, toStatus);
    }

    if (toStatus === 'READY') {
      const schedules = await dataStore.findAll<ActivitySchedule>('schedules.json');
      const schedule = schedules.find(s => s.id === material.scheduleId);

      if (schedule) {
        await this.createNotification({
          type: 'MATERIAL_READY',
          title: '物料已准备就绪',
          content: `课程【${schedule.courseName}】的物料已准备就绪，请确认是否符合要求`,
          recipients: [schedule.lecturerId],
          relatedScheduleId: schedule.id,
          relatedMaterialId: material.id,
          priority: 'MEDIUM',
          actions: [
            { type: 'VIEW_MATERIAL', label: '查看物料清单' },
            { type: 'ACKNOWLEDGE', label: '确认物料' },
          ],
        });
      }
    }

    if (toStatus === 'BLOCKED') {
      const schedules = await dataStore.findAll<ActivitySchedule>('schedules.json');
      const schedule = schedules.find(s => s.id === material.scheduleId);
      
      await this.createNotification({
        type: 'MATERIAL_BLOCKED',
        title: '物料准备受阻',
        content: schedule ? `课程【${schedule.courseName}】物料准备遇到问题，请及时处理` : '物料准备遇到问题，请及时处理',
        recipients: ['user_005', 'user_008'],
        relatedMaterialId: material.id,
        relatedScheduleId: schedule?.id,
        priority: 'HIGH',
        actions: [
          { type: 'VIEW_MATERIAL', label: '查看详情' },
          { type: 'HANDLE_ISSUE', label: '处理问题' },
        ],
      });
    }
  }

  private async createMaterialList(schedule: ActivitySchedule) {
    const materialData: MaterialList = {
      id: `mat_${uuidv4()}`,
      scheduleId: schedule.id,
      status: 'NOT_STARTED',
      preparedBy: '',
      preparedByName: '',
      scheduleSnapshot: {
        lecturerName: schedule.lecturerName,
        scheduledAt: schedule.scheduledAt,
        location: schedule.location,
        expectedParticipants: schedule.expectedParticipants,
      },
      updatedAt: new Date().toISOString(),
    };

    let materials = await dataStore.findAll<MaterialList>('materials.json');
    materials.push(materialData);
    await dataStore.write('materials.json', materials);

    schedule.materialListId = materialData.id;
    let schedules = await dataStore.findAll<ActivitySchedule>('schedules.json');
    const index = schedules.findIndex(s => s.id === schedule.id);
    if (index !== -1) {
      schedules[index] = schedule;
      await dataStore.write('schedules.json', schedules);
    }
  }

  private async updateMaterialStatus(materialId: string, status: string, options?: { reason?: string }) {
    let materials = await dataStore.findAll<MaterialList>('materials.json');
    const index = materials.findIndex(m => m.id === materialId);
    if (index !== -1) {
      materials[index].status = status;
      materials[index].updatedAt = new Date().toISOString();
      await dataStore.write('materials.json', materials);
    }
  }

  private async createNotification(data: {
    type: string;
    title: string;
    content: string;
    recipients: string[];
    relatedScheduleId?: string;
    relatedMaterialId?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    actions: { type: string; label: string }[];
  }) {
    const notification: Notification = {
      id: `notif_${uuidv4()}`,
      type: data.type,
      title: data.title,
      content: data.content,
      recipients: data.recipients,
      relatedScheduleId: data.relatedScheduleId,
      relatedMaterialId: data.relatedMaterialId,
      priority: data.priority,
      actions: data.actions,
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    let notifications = await dataStore.findAll<Notification>('notifications.json');
    notifications.push(notification);
    await dataStore.write('notifications.json', notifications);

    return notification;
  }

  async onScheduleCreated(schedule: ActivitySchedule) {
    this.eventEmitter.emit('schedule.created', { schedule });
  }

  async onScheduleChanged(schedule: ActivitySchedule, oldSchedule: Partial<ActivitySchedule>, changedFields?: string[]) {
    const fields = changedFields || Object.keys(schedule).filter(
      key => JSON.stringify(oldSchedule[key]) !== JSON.stringify(schedule[key])
    );

    if (fields.length > 0) {
      this.eventEmitter.emit('schedule.changed', { schedule, oldSchedule, changedFields: fields });
    }
  }

  async onMaterialClaimed(material: MaterialList, preparedBy: string, preparedByName: string) {
    await this.updateScheduleMaterialStatus(material.scheduleId, 'IN_PROGRESS');

    const schedules = await dataStore.findAll<ActivitySchedule>('schedules.json');
    const schedule = schedules.find(s => s.id === material.scheduleId);

    if (schedule) {
      const recipients = ['user_005', 'user_008', schedule.lecturerId, preparedBy];

      await this.createNotification({
        type: 'MATERIAL_CLAIMED',
        title: '物料准备任务已被认领',
        content: `课程【${schedule.courseName}】的物料准备任务已由${preparedByName}认领，正在准备中`,
        recipients,
        relatedScheduleId: schedule.id,
        relatedMaterialId: material.id,
        priority: 'LOW',
        actions: [
          { type: 'VIEW_MATERIAL', label: '查看物料清单' },
        ],
      });
    }
  }

  async onScheduleTransitioned(schedule: ActivitySchedule, fromStatus: string, toStatus: string) {
    this.eventEmitter.emit('schedule.transitioned', { schedule, fromStatus, toStatus });
  }

  async onMaterialTransitioned(material: MaterialList, fromStatus: string, toStatus: string) {
    this.eventEmitter.emit('material.transitioned', { material, fromStatus, toStatus });
  }
}

export const workflowService = new WorkflowService();