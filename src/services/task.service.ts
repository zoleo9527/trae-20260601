import { BaseService } from './BaseService';
import { STORAGE_KEYS } from '../utils/storage';
import type { SurveyTask, CreateTaskParams, TaskFilter } from '../types/task.types';
import { TaskStatus } from '../types/task.types';
import { mockTasks } from '../data/mockTasks';
import { getStorageData, setStorageData } from '../utils/storage';
import { generateTaskNo } from '../utils';
import { LogService } from './log.service';
import { OperationType } from '../types/log.types';
import { UserService } from './user.service';

export class TaskService extends BaseService<SurveyTask> {
  private logService: LogService;
  private userService: UserService;

  constructor() {
    super(STORAGE_KEYS.TASKS);
    this.logService = new LogService();
    this.userService = new UserService();
    this.initializeData();
  }

  private initializeData(): void {
    const existingData = getStorageData<SurveyTask[]>(this.storageKey);
    if (!existingData) {
      setStorageData(this.storageKey, mockTasks);
    }
  }

  createTask(params: CreateTaskParams): SurveyTask {
    const currentUser = this.userService.getCurrentUser();
    const newTask: SurveyTask = {
      taskId: this.generateId(),
      taskNo: generateTaskNo(),
      claimNo: params.claimNo,
      policyNo: params.policyNo,
      licensePlate: params.licensePlate,
      vehicleType: params.vehicleType,
      ownerName: params.ownerName,
      ownerPhone: params.ownerPhone,
      accidentTime: params.accidentTime,
      accidentLocation: params.accidentLocation,
      accidentDesc: params.accidentDesc,
      urgencyLevel: params.urgencyLevel,
      claimAmount: params.claimAmount,
      status: TaskStatus.PENDING_ASSIGN,
      createdBy: currentUser.userId,
      createdByName: currentUser.realName,
      createdTime: this.getCurrentTime(),
      updatedTime: this.getCurrentTime()
    };

    const tasks = this.getAll();
    tasks.unshift(newTask);
    this.saveAll(tasks);

    this.logService.createLog({
      taskId: newTask.taskId,
      operationType: OperationType.CREATE_TASK,
      operationDesc: '创建查勘任务',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      afterStatus: TaskStatus.PENDING_ASSIGN,
      remark: `报案号：${params.claimNo}，车牌号：${params.licensePlate}`
    });

    return newTask;
  }

  assignTask(taskId: string, surveyorId: string, remark?: string): SurveyTask {
    const tasks = this.getAll();
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }

    const surveyor = this.userService.getUserById(surveyorId);
    if (!surveyor) {
      throw new Error('查勘员不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = tasks[taskIndex].status;

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      assignedSurveyorId: surveyor.userId,
      assignedSurveyorName: surveyor.realName,
      assignedTime: this.getCurrentTime(),
      status: TaskStatus.PENDING_PROCESS,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(tasks);

    this.logService.createLog({
      taskId,
      operationType: OperationType.ASSIGN_TASK,
      operationDesc: '分配查勘任务',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: TaskStatus.PENDING_PROCESS,
      remark: remark || `分配给查勘员：${surveyor.realName}`
    });

    return tasks[taskIndex];
  }

  acceptTask(taskId: string, remark?: string): SurveyTask {
    const tasks = this.getAll();
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = tasks[taskIndex].status;

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: TaskStatus.PROCESSING,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(tasks);

    this.logService.createLog({
      taskId,
      operationType: OperationType.ACCEPT_TASK,
      operationDesc: '接单',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: TaskStatus.PROCESSING,
      remark: remark || '已接收任务'
    });

    return tasks[taskIndex];
  }

  startSurvey(taskId: string, surveyLocation: string, remark?: string): SurveyTask {
    const tasks = this.getAll();
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }

    const currentUser = this.userService.getCurrentUser();

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: TaskStatus.PROCESSING,
      surveyStartTime: this.getCurrentTime(),
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(tasks);

    this.logService.createLog({
      taskId,
      operationType: OperationType.START_SURVEY,
      operationDesc: '开始查勘',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      remark: remark || `查勘地点：${surveyLocation}`
    });

    return tasks[taskIndex];
  }

  completeSurvey(taskId: string, remark?: string): SurveyTask {
    const tasks = this.getAll();
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = tasks[taskIndex].status;

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: TaskStatus.PENDING_ASSESSMENT,
      surveyEndTime: this.getCurrentTime(),
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(tasks);

    this.logService.createLog({
      taskId,
      operationType: OperationType.COMPLETE_SURVEY,
      operationDesc: '完成查勘',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: TaskStatus.PENDING_ASSESSMENT,
      remark: remark || '查勘完成，等待定损'
    });

    return tasks[taskIndex];
  }

  getTaskById(taskId: string): SurveyTask | undefined {
    const tasks = this.getAll();
    return tasks.find(t => t.taskId === taskId);
  }

  getTasks(filters?: TaskFilter): { list: SurveyTask[]; total: number; page: number; pageSize: number } {
    let tasks = this.getAll();

    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      if (filters.surveyorId) {
        tasks = tasks.filter(task => task.assignedSurveyorId === filters.surveyorId);
      }
      if (filters.urgencyLevel) {
        tasks = tasks.filter(task => task.urgencyLevel === filters.urgencyLevel);
      }
      if (filters.startDate) {
        tasks = tasks.filter(task => task.createdTime >= filters.startDate!);
      }
      if (filters.endDate) {
        tasks = tasks.filter(task => task.createdTime <= filters.endDate!);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        tasks = tasks.filter(task =>
          task.taskNo.toLowerCase().includes(keyword) ||
          task.claimNo.toLowerCase().includes(keyword) ||
          task.licensePlate.toLowerCase().includes(keyword) ||
          task.ownerName.toLowerCase().includes(keyword)
        );
      }

      tasks.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        list: tasks.slice(start, end),
        total: tasks.length,
        page,
        pageSize
      };
    }

    tasks.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
    return {
      list: tasks,
      total: tasks.length,
      page: 1,
      pageSize: tasks.length
    };
  }

  getTaskStats(): { today: number; pending: number; processing: number; completed: number } {
    const tasks = this.getAll();
    const today = new Date().toISOString().split('T')[0];

    return {
      today: tasks.filter(t => t.createdTime.startsWith(today)).length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING_ASSIGN || t.status === TaskStatus.PENDING_PROCESS).length,
      processing: tasks.filter(t => t.status === TaskStatus.PROCESSING || t.status === TaskStatus.PENDING_ASSESSMENT).length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length
    };
  }

  cancelTask(taskId: string, remark?: string): SurveyTask {
    const tasks = this.getAll();
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = tasks[taskIndex].status;

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: TaskStatus.CANCELLED,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(tasks);

    this.logService.createLog({
      taskId,
      operationType: OperationType.CANCEL_TASK,
      operationDesc: '取消任务',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: TaskStatus.CANCELLED,
      remark: remark || '任务已取消'
    });

    return tasks[taskIndex];
  }

  updateTaskStatus(taskId: string, newStatus: TaskStatus, remark?: string): SurveyTask {
    const tasks = this.getAll();
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }

    const currentUser = this.userService.getCurrentUser();
    const oldStatus = tasks[taskIndex].status;

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: newStatus,
      updatedTime: this.getCurrentTime()
    };

    this.saveAll(tasks);

    this.logService.createLog({
      taskId,
      operationType: OperationType.UPDATE_TASK_STATUS,
      operationDesc: '更新任务状态',
      operatorId: currentUser.userId,
      operatorName: currentUser.realName,
      operatorRole: currentUser.role,
      beforeStatus: oldStatus,
      afterStatus: newStatus,
      remark: remark || `状态变更: ${oldStatus} -> ${newStatus}`
    });

    return tasks[taskIndex];
  }

  getTaskTimeline(taskId: string): Array<{
    timestamp: string;
    title: string;
    description: string;
    operator: string;
    role: string;
    beforeStatus?: string;
    afterStatus?: string;
  }> {
    const logs = this.logService.getTaskLogs(taskId);
    return logs.map(log => ({
      timestamp: log.createdTime,
      title: log.operationDesc,
      description: log.remark || '-',
      operator: log.operatorName,
      role: log.operatorRole,
      beforeStatus: log.beforeStatus,
      afterStatus: log.afterStatus
    }));
  }

  getTaskWithDetails(taskId: string): SurveyTask | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const logs = this.logService.getTaskLogs(taskId);
    const assessment = new (require('./assessment.service').AssessmentService)().getAssessmentByTaskId(taskId);

    return {
      ...task,
      timeline: logs.map(log => ({
        timestamp: log.createdTime,
        title: log.operationDesc,
        description: log.remark || '-',
        operator: log.operatorName,
        role: log.operatorRole,
        beforeStatus: log.beforeStatus,
        afterStatus: log.afterStatus
      })),
      assessment
    } as SurveyTask;
  }
}
