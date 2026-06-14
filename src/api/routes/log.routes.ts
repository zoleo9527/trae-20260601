import { Router } from '../Router';
import { logController } from '../controllers/log.controller';

export const logRoutes: Router[] = [
  {
    method: 'GET',
    path: '/api/logs',
    handler: logController.getLogs
  },
  {
    method: 'GET',
    path: '/api/logs/task/:taskId',
    handler: logController.getTaskLogs
  },
  {
    method: 'GET',
    path: '/api/logs/assessment/:assessmentId',
    handler: logController.getAssessmentLogs
  },
  {
    method: 'GET',
    path: '/api/logs/export',
    handler: logController.exportLogs
  }
];