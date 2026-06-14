import { Router } from '../Router';
import { assessmentController } from '../controllers/assessment.controller';

export const assessmentRoutes: Router[] = [
  {
    method: 'POST',
    path: '/api/assessments',
    handler: assessmentController.createAssessment
  },
  {
    method: 'PUT',
    path: '/api/assessments/:assessmentId/submit',
    handler: assessmentController.submitAssessment
  },
  {
    method: 'PUT',
    path: '/api/assessments/:assessmentId/review',
    handler: assessmentController.reviewAssessment
  },
  {
    method: 'PUT',
    path: '/api/assessments/:assessmentId',
    handler: assessmentController.updateAssessment
  },
  {
    method: 'GET',
    path: '/api/assessments/:assessmentId',
    handler: assessmentController.getAssessmentDetail
  },
  {
    method: 'GET',
    path: '/api/assessments/:assessmentId/history',
    handler: assessmentController.getAssessmentHistory
  },
  {
    method: 'GET',
    path: '/api/assessments',
    handler: assessmentController.getAssessmentList
  },
  {
    method: 'GET',
    path: '/api/assessments/stats',
    handler: assessmentController.getAssessmentStats
  }
];