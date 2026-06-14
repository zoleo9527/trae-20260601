import axios from 'axios';
import type {
  ApiResponse,
  DashboardStats,
  CarSource,
  InspectionReport,
  LoanApplication,
  TransferOrder,
  StatusChangeLog,
  Role,
  TransferStage,
  UrgencyAction,
} from 'shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

const unwrap = async <T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> => {
  const { data } = await request;
  if (!data.success) {
    throw new Error(data.error || data.message || '请求失败');
  }
  return data.data as T;
};

export const healthCheck = () =>
  unwrap(api.get('/health'));

export const getFullStore = () =>
  unwrap(api.get('/store'));

export const resetAllData = () =>
  unwrap(api.post('/reset'));

export const getDemoAccounts = () =>
  unwrap<Record<Role, { user: string; name: string }>>(api.get('/demo-accounts'));

export const getStats = (role?: Role) =>
  unwrap<DashboardStats>(api.get('/stats', { params: role ? { role } : undefined }));

export const getCarSources = (status?: string) =>
  unwrap<CarSource[]>(api.get('/car-sources', { params: status ? { status } : undefined }));

export const getCarSource = (id: string) =>
  unwrap<CarSource>(api.get(`/car-sources/${id}`));

export const getInspections = (params?: { orderId?: string; carSourceId?: string }) =>
  unwrap<InspectionReport[]>(api.get('/inspections', { params }));

export const getInspection = (id: string) =>
  unwrap<InspectionReport>(api.get(`/inspections/${id}`));

export const getLoans = (params?: { orderId?: string; status?: string }) =>
  unwrap<LoanApplication[]>(api.get('/loans', { params }));

export const getLoan = (id: string) =>
  unwrap<LoanApplication>(api.get(`/loans/${id}`));

export const getOrders = (params?: { stage?: TransferStage; role?: Role; handlerRole?: Role; urgency?: UrgencyAction }) =>
  unwrap<TransferOrder[]>(api.get('/orders', { params }));

export const getOrderDetail = (id: string) =>
  unwrap<{
    order: TransferOrder;
    inspection?: InspectionReport;
    loan?: LoanApplication;
    carSource?: CarSource;
    statusLogs: StatusChangeLog[];
  }>(api.get(`/orders/${id}`));

export const getOrderLogs = (id: string) =>
  unwrap<StatusChangeLog[]>(api.get(`/orders/${id}/logs`));

export const markOrderUrgency = (
  id: string,
  body: { action: UrgencyAction; note?: string; operator: string; operatorRole: Role; docIds?: string[] }
) => unwrap<TransferOrder>(api.put(`/orders/${id}/urgency`, body));

export const advanceOrder = (
  id: string,
  body: { transferRemark?: string; operator: string; operatorRole: Role }
) => unwrap<TransferOrder>(api.put(`/orders/${id}/advance`, body));

export const updateTransferRemark = (
  id: string,
  body: { remark: string; operator: string; operatorRole: Role }
) => unwrap<TransferOrder>(api.put(`/orders/${id}/transfer-remark`, body));

export const updateLoanRemark = (
  id: string,
  body: { remark: string; operator: string; operatorRole: Role }
) => unwrap<TransferOrder>(api.put(`/orders/${id}/loan-remark`, body));

export const fundLoan = (
  id: string,
  body: { operator: string; operatorRole: Role }
) => unwrap<{ loan: LoanApplication; order?: TransferOrder }>(api.put(`/loans/${id}/fund`, body));

export const markLoanSupplement = (
  id: string,
  body: { note: string; operator: string; operatorRole: Role; docs?: { id: string; submitted: boolean; placeholder?: string }[] }
) => unwrap<LoanApplication>(api.put(`/loans/${id}/supplement`, body));

export const markInspectionRecheck = (
  id: string,
  body: { note: string; operator: string; operatorRole: Role }
) => unwrap<InspectionReport>(api.put(`/inspections/${id}/recheck`, body));

export const getStatusLogs = (params?: { orderId?: string; role?: Role }) =>
  unwrap<StatusChangeLog[]>(api.get('/status-logs', { params }));
