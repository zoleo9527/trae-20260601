import axios from 'axios';
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

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || error.message);
  }
);

export const returnsApi = {
  getList: (params?: {
    status?: string;
    type?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<ReturnExchangeRequest>> => {
    return api.get('/returns', { params });
  },

  getDetail: (id: string): Promise<ReturnExchangeRequest> => {
    return api.get(`/returns/${id}`);
  },

  create: (data: {
    order_id: string;
    type: string;
    reason?: string;
    reason_category?: string;
    applicant: string;
    applicant_role: string;
    remarks?: string;
    items: Array<{
      product_name: string;
      product_code?: string;
      quantity: number;
      unit?: string;
      warehouse_location?: string;
    }>;
  }): Promise<ReturnExchangeRequest> => {
    return api.post('/returns', data);
  },

  submit: (id: string, data: {
    operator: string;
    operator_role: string;
    remark?: string;
  }): Promise<ReturnExchangeRequest> => {
    return api.put(`/returns/${id}/submit`, data);
  },

  warehouseConfirm: (id: string, data: {
    operator: string;
    operator_role: string;
    items?: ReturnItem[];
    remark?: string;
  }): Promise<ReturnExchangeRequest> => {
    return api.put(`/returns/${id}/warehouse-confirm`, data);
  },

  cancel: (id: string, data: {
    operator: string;
    operator_role: string;
    reason?: string;
  }): Promise<ReturnExchangeRequest> => {
    return api.put(`/returns/${id}/cancel`, data);
  },

  batchWarehouseConfirm: (data: {
    ids: string[];
    operator: string;
    operator_role: string;
    remark?: string;
  }): Promise<{ success: boolean; count: number; message: string }> => {
    return api.post('/returns/batch-warehouse-confirm', data);
  },

  batchCancel: (data: {
    ids: string[];
    operator: string;
    operator_role: string;
    reason?: string;
  }): Promise<{ success: boolean; count: number; message: string }> => {
    return api.post('/returns/batch-cancel', data);
  },

  getLogs: (id: string): Promise<OperationLog[]> => {
    return api.get(`/returns/${id}/logs`);
  },
};

export const reissueApi = {
  getList: (params?: {
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<ReissueTracking>> => {
    return api.get('/reissue', { params });
  },

  getDetail: (id: string): Promise<ReissueTracking> => {
    return api.get(`/reissue/${id}`);
  },

  create: (data: {
    request_id: string;
    handler: string;
    handler_role: string;
    items: Array<{
      product_name: string;
      product_code?: string;
      quantity: number;
      unit?: string;
      warehouse_location?: string;
    }>;
    driver_name?: string;
    vehicle_no?: string;
    estimated_delivery_date?: string;
    remarks?: string;
  }): Promise<ReissueTracking> => {
    return api.post('/reissue', data);
  },

  startPicking: (id: string, data: {
    operator: string;
    operator_role: string;
    warehouse_location?: string;
    remark?: string;
  }): Promise<ReissueTracking> => {
    return api.put(`/reissue/${id}/picking`, data);
  },

  ship: (id: string, data: {
    operator: string;
    operator_role: string;
    driver_name?: string;
    vehicle_no?: string;
    remark?: string;
  }): Promise<ReissueTracking> => {
    return api.put(`/reissue/${id}/ship`, data);
  },

  outForDelivery: (id: string, data: {
    operator: string;
    operator_role: string;
    remark?: string;
  }): Promise<ReissueTracking> => {
    return api.put(`/reissue/${id}/out-for-delivery`, data);
  },

  deliver: (id: string, data: {
    operator: string;
    operator_role: string;
    signer_name?: string;
    remark?: string;
  }): Promise<ReissueTracking> => {
    return api.put(`/reissue/${id}/deliver`, data);
  },

  cancel: (id: string, data: {
    operator: string;
    operator_role: string;
    reason?: string;
  }): Promise<ReissueTracking> => {
    return api.put(`/reissue/${id}/cancel`, data);
  },

  getByRequestId: (requestId: string): Promise<ReissueTracking[]> => {
    return api.get(`/reissue/request/${requestId}`);
  },
};

export const ordersApi = {
  getList: (params?: {
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<SalesOrder>> => {
    return api.get('/orders', { params });
  },

  getDetail: (id: string): Promise<SalesOrder> => {
    return api.get(`/orders/${id}`);
  },

  getReceipts: (id: string): Promise<any[]> => {
    return api.get(`/orders/${id}/receipts`);
  },
};

export const warehouseApi = {
  getLocations: (): Promise<WarehouseLocation[]> => {
    return api.get('/warehouse/locations');
  },

  getLocation: (id: string): Promise<WarehouseLocation> => {
    return api.get(`/warehouse/locations/${id}`);
  },

  getInventory: (): Promise<any[]> => {
    return api.get('/warehouse/inventory');
  },
};

export const attachmentsApi = {
  getByRequestId: (requestId: string): Promise<Attachment[]> => {
    return api.get(`/attachments/request/${requestId}`);
  },

  getByReissueId: (reissueId: string): Promise<Attachment[]> => {
    return api.get(`/attachments/reissue/${reissueId}`);
  },

  addToRequest: (requestId: string, data: {
    file_name: string;
    file_type?: string;
    file_size?: number;
    placeholder?: boolean;
    uploaded_by?: string;
  }): Promise<Attachment> => {
    return api.post(`/attachments/request/${requestId}`, data);
  },

  addToReissue: (reissueId: string, data: {
    file_name: string;
    file_type?: string;
    file_size?: number;
    placeholder?: boolean;
    uploaded_by?: string;
  }): Promise<Attachment> => {
    return api.post(`/attachments/reissue/${reissueId}`, data);
  },

  delete: (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/attachments/${id}`);
  },
};

export default api;
