import { Request, Response } from 'express';
import { PickTaskService } from '../services/pickTask.service';

const pickTaskService = new PickTaskService();

export const assignTask = async (req: Request, res: Response) => {
  try {
    const { taskId, pickerId } = req.body;
    const task = await pickTaskService.assignTask(taskId, pickerId);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const startPicking = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { pickerId } = req.body;
    const task = await pickTaskService.startPicking(taskId, pickerId);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { pickerId, pickedQuantity } = req.body;
    const task = await pickTaskService.completeTask(taskId, pickerId, pickedQuantity);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const { pickerId } = req.params;
    const status = req.query.status as string;
    const tasks = await pickTaskService.getMyTasks(pickerId, status);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAvailableTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await pickTaskService.getAvailableTasks();
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await pickTaskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
