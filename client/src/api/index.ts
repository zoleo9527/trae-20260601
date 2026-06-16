import axios, { AxiosError, AxiosInstance } from 'axios';
import type { 
  ReturnExchangeRequest, 
  ReissueTracking, 
  SalesOrder, 
  WarehouseLocation,
  PaginatedResult,
  OperationLog,
  Attachment,
  ReturnItem,
} from '../types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryConfig = {
  retries?: number;
  retryDelay?: number;
  retryOn?: number[];
};

const defaultRetryConfig: Required<RetryConfig> = {
  retries: 3,
  retryDelay: 1000,
  retryOn: [500, 502, 503, 504],
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { retries, retryDelay, retryOn } = { ...defaultRetryConfig, ...config };
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === retries) break;
      
      const status = error.response?.status || (error.message?.includes('Network') ? 'NETWORK_ERROR' : null);
      const shouldRetry = retryOn.includes(status as any) || status === 'NETWORK_ERROR';
      
      if (!shouldRetry) break;
      
      console.log('请求失败，' + (retryDelay / 1000) + 's 后重试 (' + (attempt + 1) + '/' + retries + ')...');
      await sleep(retryDelay);
    }
  }
  
  if (lastError.response?.data?.error) {
    throw new Error(lastError.response.data.error);
  }
  if (lastError.message?.includes('timeout')) {
    throw new Error('请求超时，请稍后重试');
  }
  if (lastError.message?.includes('Network') || !lastError.response) {
    throw new Error('服务暂时不可用，请检查后端服务是否启动');
  }
  throw lastError;
}

type HealthListener = (isHealthy: boolean) => void;
let healthCheckInterval: NodeJS.Timeout | null = null;
let lastHealthStatus = true;
const healthListeners: HealthListener[] = [];

export function addHealthListener(listener: HealthListener) {
  healthListeners.push(listener);
  if (!healthCheckInterval) {
    startHealthCheck();
  }
  return () => {
    const idx = healthListeners.indexOf(listener);
    if (idx > -1) healthListeners.splice(idx, 1);
    if (healthListeners.length === 0 && healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  };
}

function startHealthCheck() {
  healthCheckInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const healthy = res.ok;
      if (healthy !== lastHealthStatus) {
        lastHealthStatus = healthy;
        healthListeners.forEach(l => l(healthy));
      }
    } catch {
      if (lastHealthStatus !== false) {
        lastHealthStatus = false;
        healthListeners.forEach(l => l(false));
      }
    }
  }, 5000);
}

export function isServiceHealthy() {
  return lastHealthStatus;
}

function createRequestWrapper(instance: AxiosInstance) {
  return {
    get: <T>(url: string, config?: any) => 
      requestWithRetry<T>(() => instance.get<T>(url, config).then(r => r.data)),
    post: <T>(url: string, data?: any, config?: any) => 
      requestWithRetry<T>(() => instance.post<T>(url, data, config).then(r => r.data)),
    put: <T>(url: string, data?: any, config?: any) => 
      requestWithRetry<T>(() => instance.put<T>(url, data, config).then(r => r.data)),
    delete: <T>(url: string, config?: any) => 
      requestWithRetry<T>(() => instance.delete<T>(url, config).then(r => r.data)),
  };
}

const request = createRequestWrapper(api);

export const returnsApi = {
  getList: (params?: any): Promise<PaginatedResult<ReturnExchangeRequest>> => {
    return request.get('/returns', { params });
  },
  getDetail: (id: string): Promise<ReturnExchangeRequest> => {
    return request.get('/returns/' + id);
  },
  getLogs: (id: string): Promise<OperationLog[]> => {
    return request.get('/returns/' + id + '/logs');
  },
  create: (data: any): Promise<ReturnExchangeRequest> => {
    return request.post('/returns', data);
  },
  submit: (id: string, data: any): Promise<ReturnExchangeRequest> => {
    return request.put('/returns/' + id + '/submit', data);
  },
  warehouseConfirm: (id: string, data: any): Promise<ReturnExchangeRequest> => {
    return request.put('/returns/' + id + '/warehouse-confirm', data);
  },
  cancel: (id: string, data: any): Promise<ReturnExchangeRequest> => {
    return request.put('/returns/' + id + '/cancel', data);
  },
  complete: (id: string, data: any) => {
    return request.put('/returns/' + id + '/complete', data);
  },
  batchWarehouseConfirm: (data: any): Promise<{ success: boolean; count: number; message: string }> => {
    return request.put('/returns/batch-warehouse-confirm', data);
  },
  batchCancel: (data: any): Promise<{ success: boolean; count: number; message: string }> => {
    return request.put('/returns/batch-cancel', data);
  },
};

export const reissueApi = {
  getList: (params?: any): Promise<PaginatedResult<ReissueTracking>> => {
    return request.get('/reissue', { params });
  },
  getDetail: (id: string): Promise<ReissueTracking> => {
    return request.get('/reissue/' + id);
  },
  getLogs: (id: string): Promise<OperationLog[]> => {
    return request.get('/reissue/' + id + '/logs');
  },
  create: (data: any): Promise<ReissueTracking> => {
    return request.post('/reissue', data);
  },
  startPicking: (id: string, data: any): Promise<ReissueTracking> => {
    return request.put('/reissue/' + id + '/picking', data);
  },
  ship: (id: string, data: any): Promise<ReissueTracking> => {
    return request.put('/reissue/' + id + '/ship', data);
  },
  outForDelivery: (id: string, data: any): Promise<ReissueTracking> => {
    return request.put('/reissue/' + id + '/out-for-delivery', data);
  },
  deliver: (id: string, data: any): Promise<ReissueTracking> => {
    return request.put('/reissue/' + id + '/deliver', data);
  },
  cancel: (id: string, data: any): Promise<ReissueTracking> => {
    return request.put('/reissue/' + id + '/cancel', data);
  },
  getByRequestId: (requestId: string): Promise<ReissueTracking[]> => {
    return request.get('/reissue/request/' + requestId);
  },
};

export const ordersApi = {
  getList: (params?: any): Promise<PaginatedResult<SalesOrder>> => {
    return request.get('/orders', { params });
  },
  getDetail: (id: string): Promise<SalesOrder> => {
    return request.get('/orders/' + id);
  },
  getReceipts: (id: string): Promise<any[]> => {
    return request.get('/orders/' + id + '/receipts');
  },
};

export const warehouseApi = {
  getLocations: (): Promise<WarehouseLocation[]> => {
    return request.get('/warehouse/locations');
  },
  getLocation: (id: string): Promise<WarehouseLocation> => {
    return request.get('/warehouse/locations/' + id);
  },
  getInventory: (): Promise<any[]> => {
    return request.get('/warehouse/inventory');
  },
};

export const attachmentsApi = {
  getByRequestId: (requestId: string): Promise<Attachment[]> => {
    return request.get('/attachments/request/' + requestId);
  },
  getByReissueId: (reissueId: string): Promise<Attachment[]> => {
    return request.get('/attachments/reissue/' + reissueId);
  },
  addToRequest: (requestId: string, data: any): Promise<Attachment> => {
    return request.post('/attachments/request/' + requestId, data);
  },
  addToReissue: (reissueId: string, data: any): Promise<Attachment> => {
    return request.post('/attachments/reissue/' + reissueId, data);
  },
  delete: (id: string): Promise<{ success: boolean }> => {
    return request.delete('/attachments/' + id);
  },
};

export default api;
