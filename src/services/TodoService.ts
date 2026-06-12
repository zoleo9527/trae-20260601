import { v4 as uuidv4 } from 'uuid';
import {
  Todo, TodoStatus, TodoType, UserRole, WorkflowRecord,
  WorkflowStage, RecordStatus
} from './types';
import {
  getTodosByAssignee, getTodosByRole, saveTodo, deleteTodo,
  getAllRecords, getRecordById
} from '../dataStore';

export class TodoService {
  generateTodosFromRecords(): void {
    const records = getAllRecords();
    const now = new Date();

    records.forEach(record => {
      this.generateTodosForRecord(record, now);
    });
  }

  private generateTodosForRecord(record: WorkflowRecord, now: Date): void {
    switch (record.currentStage) {
      case WorkflowStage.DRAFT_CREATED:
        this.createTodoIfNotExists({
          recordId: record.id,
          type: TodoType.DRAFT_PENDING,
          title: '待提交申报底稿',
          description: `税务期间 ${record.taxPeriod} 的申报底稿待提交`,
          assigneeId: record.draftInfo.taxConsultantId,
          assigneeRole: UserRole.TAX_CONSULTANT,
          priority: 'high',
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        });
        break;

      case WorkflowStage.AWAITING_CONFIRMATION:
      case WorkflowStage.CONFIRMATION_IN_PROGRESS:
        if (record.confirmationInfo.clientFinanceId) {
          const pendingMaterials = record.confirmationInfo.requiredMaterials.filter(
            m => m.status === 'pending' && m.required
          );

          if (pendingMaterials.length > 0) {
            this.createTodoIfNotExists({
              recordId: record.id,
              type: TodoType.MATERIAL_PREPARATION,
              title: '待准备确认材料',
              description: `有 ${pendingMaterials.length} 项必需材料待准备`,
              assigneeId: record.confirmationInfo.clientFinanceId,
              assigneeRole: UserRole.CLIENT_FINANCE,
              priority: 'high',
              dueDate: record.confirmationInfo.deadline
            });
          }

          this.createTodoIfNotExists({
            recordId: record.id,
            type: TodoType.CONFIRMATION_PENDING,
            title: '待确认申报底稿',
            description: `税务期间 ${record.taxPeriod} 的申报底稿待确认`,
            assigneeId: record.confirmationInfo.clientFinanceId,
            assigneeRole: UserRole.CLIENT_FINANCE,
            priority: 'medium',
            dueDate: record.confirmationInfo.deadline
          });
        }
        break;

      case WorkflowStage.RETURNED:
        this.createTodoIfNotExists({
          recordId: record.id,
          type: TodoType.DRAFT_REVISION,
          title: '待修订退回的申报底稿',
          description: `退回原因: ${record.returnInfo?.returnReason.description || '未知'}`,
          assigneeId: record.draftInfo.taxConsultantId,
          assigneeRole: UserRole.TAX_CONSULTANT,
          priority: 'high',
          dueDate: record.returnInfo?.expectedFixDeadline
        });
        break;

      case WorkflowStage.CONFIRMED:
        break;
    }

    if (record.confirmationInfo.deadline && record.confirmationInfo.deadline < now) {
      if (record.currentStage === WorkflowStage.AWAITING_CONFIRMATION ||
          record.currentStage === WorkflowStage.CONFIRMATION_IN_PROGRESS) {
        this.createTodoIfNotExists({
          recordId: record.id,
          type: TodoType.OVERDUE_HANDLING,
          title: '确认超时处理',
          description: `税务期间 ${record.taxPeriod} 的确认已超时`,
          assigneeId: record.confirmationInfo.clientFinanceId,
          assigneeRole: UserRole.CLIENT_FINANCE,
          priority: 'high'
        });
      }
    }
  }

  private createTodoIfNotExists(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'status'>): void {
    const existingTodos = getTodosByRole(todoData.assigneeRole).filter(
      t => t.recordId === todoData.recordId && t.type === todoData.type && t.status !== TodoStatus.COMPLETED
    );

    if (existingTodos.length === 0) {
      const now = new Date();
      const todo: Todo = {
        ...todoData,
        id: uuidv4(),
        status: TodoStatus.PENDING,
        createdAt: now,
        updatedAt: now
      };
      saveTodo(todo);
    }
  }

  getTaxConsultantTodos(consultantId: string): Todo[] {
    return getTodosByAssignee(consultantId).filter(
      t => t.status !== TodoStatus.COMPLETED
    );
  }

  getProjectManagerTodos(managerId: string): Todo[] {
    const records = getAllRecords();
    const projectRecords = records.filter(r => {
      const project = require('../dataStore').getProjectById(r.projectId);
      return project?.projectManagerId === managerId;
    });

    const todos: Todo[] = [];

    projectRecords.forEach(record => {
      if (record.currentStage === WorkflowStage.RETURNED && record.returnInfo) {
        const overdueTodos = getTodosByRole(UserRole.TAX_CONSULTANT).filter(
          t => t.recordId === record.id && t.type === TodoType.DRAFT_REVISION
        );

        if (overdueTodos.length > 0 && record.returnInfo.expectedFixDeadline < new Date()) {
          todos.push({
            id: `pm-${record.id}`,
            recordId: record.id,
            type: TodoType.OVERDUE_HANDLING,
            title: '待介入的退回争议',
            description: `税务期间 ${record.taxPeriod} 的退回记录已超时，需介入处理`,
            assigneeId: managerId,
            assigneeRole: UserRole.PROJECT_MANAGER,
            status: TodoStatus.PENDING,
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      if (record.currentStage === WorkflowStage.CONFIRMED) {
        todos.push({
          id: `pm-approval-${record.id}`,
          recordId: record.id,
          type: TodoType.APPROVAL_PENDING,
          title: '待审批最终申报',
          description: `税务期间 ${record.taxPeriod} 的申报已确认，待项目经理审批`,
          assigneeId: managerId,
          assigneeRole: UserRole.PROJECT_MANAGER,
          status: TodoStatus.PENDING,
          priority: 'medium'
        });
      }
    });

    return todos;
  }

  getClientFinanceTodos(clientId: string, financeId: string): Todo[] {
    const records = getAllRecords();
    const clientRecords = records.filter(
      r => r.clientId === clientId && r.confirmationInfo.clientFinanceId === financeId
    );

    const todos: Todo[] = [];

    clientRecords.forEach(record => {
      const existingTodos = getTodosByAssignee(financeId).filter(
        t => t.recordId === record.id && t.status !== TodoStatus.COMPLETED
      );
      todos.push(...existingTodos);
    });

    return todos;
  }

  completeTodo(todoId: string): Todo | undefined {
    const allTodos = require('../dataStore').getAllTodos();
    const todo = allTodos.find(t => t.id === todoId);

    if (todo) {
      todo.status = TodoStatus.COMPLETED;
      todo.updatedAt = new Date();
      saveTodo(todo);
      return todo;
    }

    return undefined;
  }

  getTodosByRecord(recordId: string): Todo[] {
    const allTodos = require('../dataStore').getAllTodos();
    return allTodos.filter(t => t.recordId === recordId);
  }
}
