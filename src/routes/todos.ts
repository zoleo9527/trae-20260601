import { Router, Request, Response } from 'express';
import { TodoService } from '../services/TodoService';

const router = Router();
const todoService = new TodoService();

router.get('/tax-consultant/:consultantId', (req: Request, res: Response) => {
  try {
    const todos = todoService.getTaxConsultantTodos(req.params.consultantId);
    res.json({
      success: true,
      data: {
        todos,
        summary: {
          total: todos.length,
          highPriority: todos.filter(t => t.priority === 'high').length,
          mediumPriority: todos.filter(t => t.priority === 'medium').length,
          lowPriority: todos.filter(t => t.priority === 'low').length
        }
      },
      message: '税务顾问待办列表'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/project-manager/:managerId', (req: Request, res: Response) => {
  try {
    const todos = todoService.getProjectManagerTodos(req.params.managerId);
    res.json({
      success: true,
      data: {
        todos,
        summary: {
          total: todos.length,
          pendingApprovals: todos.filter(t => t.type === 'approval_pending').length,
          overdueHandling: todos.filter(t => t.type === 'overdue_handling').length
        }
      },
      message: '项目经理待办列表'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/client-finance/:clientId/:financeId', (req: Request, res: Response) => {
  try {
    const todos = todoService.getClientFinanceTodos(
      req.params.clientId,
      req.params.financeId
    );
    res.json({
      success: true,
      data: {
        todos,
        summary: {
          total: todos.length,
          pendingConfirmations: todos.filter(t => t.type === 'confirmation_pending').length,
          pendingMaterials: todos.filter(t => t.type === 'material_preparation').length
        }
      },
      message: '客户财务待办列表'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:todoId/complete', (req: Request, res: Response) => {
  try {
    const todo = todoService.completeTodo(req.params.todoId);
    if (!todo) {
      res.status(404).json({
        success: false,
        error: '待办不存在'
      });
      return;
    }
    res.json({
      success: true,
      data: todo,
      message: '待办已完成'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
