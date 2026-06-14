import { Router } from '../Router';
import { taskController } from '../controllers/task.controller';

export const taskRoutes: Router[] = [
  {
    method: 'POST',
    path: '/api/tasks',
    handler: taskController.createTask
  },
  {
    method: 'GET',
    path: '/api/tasks',
    handler: taskController.getTaskList
  },
  {
    method: 'GET',
    path: '/api/tasks/stats',
    handler: taskController.getTaskStats
  },
  {
    method: 'GET',
    path: '/api/tasks/:taskId/timeline',
    handler: taskController.getTaskTimeline
  },
  {
    method: 'GET',
    path: '/api/tasks/:taskId',
    handler: taskController.getTaskDetail
  },
  {
    method: 'PUT',
    path: '/api/tasks/:taskId/assign',
    handler: taskController.assignTask
  },
  {
    method: 'PUT',
    path: '/api/tasks/:taskId/accept',
    handler: taskController.acceptTask
  },
  {
    method: 'PUT',
    path: '/api/tasks/:taskId/start-survey',
    handler: taskController.startSurvey
  },
  {
    method: 'PUT',
    path: '/api/tasks/:taskId/complete-survey',
    handler: taskController.completeSurvey
  },
  {
    method: 'PUT',
    path: '/api/tasks/:taskId/cancel',
    handler: taskController.cancelTask
  }
];
