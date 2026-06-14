import { taskRoutes } from './routes/task.routes';
import { assessmentRoutes } from './routes/assessment.routes';
import { logRoutes } from './routes/log.routes';
import type { Router, Request, Response } from './Router';

const routes: Router[] = [
  ...taskRoutes,
  ...assessmentRoutes,
  ...logRoutes
];

interface RouteMatch {
  route: Router;
  params: Record<string, string>;
}

function matchRoute(method: string, path: string): RouteMatch | undefined {
  const parsedPath = path.split('?')[0];
  
  for (const route of routes) {
    if (route.method !== method) continue;
    
    const routeParts = route.path.split('/');
    const pathParts = parsedPath.split('/');
    
    if (routeParts.length !== pathParts.length) continue;
    
    const params: Record<string, string> = {};
    let match = true;
    
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];
      
      if (routePart.startsWith(':')) {
        params[routePart.slice(1)] = pathPart;
      } else if (routePart !== pathPart) {
        match = false;
        break;
      }
    }
    
    if (match) {
      return { route, params };
    }
  }
  
  return undefined;
}

function parseQuery(queryString?: string): Record<string, string | string[] | undefined> {
  if (!queryString) return {};
  
  const query: Record<string, string | string[] | undefined> = {};
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value || '');
    
    if (query[decodedKey]) {
      if (Array.isArray(query[decodedKey])) {
        (query[decodedKey] as string[]).push(decodedValue);
      } else {
        query[decodedKey] = [query[decodedKey] as string, decodedValue];
      }
    } else {
      query[decodedKey] = decodedValue;
    }
  }
  
  return query;
}

export class API {
  static handle(request: {
    method: string;
    url: string;
    body?: Record<string, unknown>;
  }): Promise<{ status: number; body: unknown }> {
    return new Promise((resolve) => {
      const { method, url, body } = request;
      const [pathname, queryString] = url.split('?');
      
      const match = matchRoute(method.toUpperCase(), pathname);
      
      if (!match) {
        resolve({
          status: 404,
          body: {
            success: false,
            data: null,
            message: '接口不存在'
          }
        });
        return;
      }
      
      const { route, params } = match;
      
      const req: Request = {
        method: method.toUpperCase(),
        path: pathname,
        params,
        query: parseQuery(queryString),
        body
      };
      
      const res: Response = {
        status: 200,
        json: (data) => {
          resolve({
            status: res.status,
            body: data
          });
        }
      };
      
      try {
        route.handler(req, res);
      } catch (error) {
        resolve({
          status: 500,
          body: {
            success: false,
            data: null,
            message: (error as Error).message
          }
        });
      }
    });
  }
  
  static async createTask(params: Record<string, unknown>) {
    return this.handle({
      method: 'POST',
      url: '/api/tasks',
      body: params
    });
  }
  
  static async assignTask(taskId: string, surveyorId: string, remark?: string) {
    return this.handle({
      method: 'PUT',
      url: `/api/tasks/${taskId}/assign`,
      body: { surveyorId, remark }
    });
  }
  
  static async acceptTask(taskId: string, remark?: string) {
    return this.handle({
      method: 'PUT',
      url: `/api/tasks/${taskId}/accept`,
      body: { remark }
    });
  }
  
  static async startSurvey(taskId: string, surveyLocation: string, remark?: string) {
    return this.handle({
      method: 'PUT',
      url: `/api/tasks/${taskId}/start-survey`,
      body: { surveyLocation, remark }
    });
  }
  
  static async completeSurvey(taskId: string, remark?: string) {
    return this.handle({
      method: 'PUT',
      url: `/api/tasks/${taskId}/complete-survey`,
      body: { remark }
    });
  }
  
  static async getTaskDetail(taskId: string) {
    return this.handle({
      method: 'GET',
      url: `/api/tasks/${taskId}`
    });
  }
  
  static async getTaskTimeline(taskId: string) {
    return this.handle({
      method: 'GET',
      url: `/api/tasks/${taskId}/timeline`
    });
  }
  
  static async getTaskList(filters?: Record<string, string>) {
    const query = filters ? new URLSearchParams(filters).toString() : '';
    return this.handle({
      method: 'GET',
      url: `/api/tasks${query ? '?' + query : ''}`
    });
  }
  
  static async createAssessment(params: Record<string, unknown>) {
    return this.handle({
      method: 'POST',
      url: '/api/assessments',
      body: params
    });
  }
  
  static async submitAssessment(assessmentId: string, remark?: string) {
    return this.handle({
      method: 'PUT',
      url: `/api/assessments/${assessmentId}/submit`,
      body: { remark }
    });
  }
  
  static async reviewAssessment(assessmentId: string, action: 'approve' | 'reject', reviewComment: string, remark?: string) {
    return this.handle({
      method: 'PUT',
      url: `/api/assessments/${assessmentId}/review`,
      body: { action, reviewComment, remark }
    });
  }
  
  static async getAssessmentDetail(assessmentId: string) {
    return this.handle({
      method: 'GET',
      url: `/api/assessments/${assessmentId}`
    });
  }
  
  static async getAssessmentList(filters?: Record<string, string>) {
    const query = filters ? new URLSearchParams(filters).toString() : '';
    return this.handle({
      method: 'GET',
      url: `/api/assessments${query ? '?' + query : ''}`
    });
  }
  
  static async getLogs(filters?: Record<string, string>) {
    const query = filters ? new URLSearchParams(filters).toString() : '';
    return this.handle({
      method: 'GET',
      url: `/api/logs${query ? '?' + query : ''}`
    });
  }
  
  static async getTaskLogs(taskId: string) {
    return this.handle({
      method: 'GET',
      url: `/api/logs/task/${taskId}`
    });
  }
}