import axios from 'axios';
import type {
  ApiResponse,
  DashboardStats,
  Registration,
  PhysicalCheck,
  PhysicalHistory,
  ExceptionRecord,
  HandoverLog,
  TrainingSchedule,
  ExamBatch,
  PhysicalForm,
  RegistrationStatus,
  Role,
  ResponsibilityMark,
  ResponsibilityWarning,
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

export const getStats = () =>
  unwrap<DashboardStats>(api.get('/stats'));

export const getRegistrations = (status?: RegistrationStatus) =>
  unwrap<Registration[]>(
    api.get('/registrations', { params: status ? { status } : undefined })
  );

export const getRegistration = (id: string) =>
  unwrap<Registration>(api.get(`/registrations/${id}`));

export const updateRegistration = (id: string, patch: Partial<Registration>) =>
  unwrap<Registration>(api.put(`/registrations/${id}`, patch));

export const updateRegistrationStatus = (
  id: string,
  body: {
    status: RegistrationStatus;
    remark?: string;
    rejectReason?: string;
    supplementNote?: string;
    delayHours?: number;
  }
) => unwrap<{ registration: Registration; responsibilityWarning?: ResponsibilityWarning }>(api.put(`/registrations/${id}/status`, body));

export const getPhysicals = (params?: { status?: string; registrationId?: string }) =>
  unwrap<PhysicalCheck[]>(api.get('/physicals', { params }));

export const getPhysical = (id: string) =>
  unwrap<PhysicalCheck>(api.get(`/physicals/${id}`));

export const getPhysicalHistory = (id: string) =>
  unwrap<PhysicalHistory[]>(api.get(`/physicals/${id}/history`));

export const getPhysicalHistoryByReg = (regId: string) =>
  unwrap<PhysicalHistory[]>(api.get(`/physicals/registration/${regId}/history`));

export const updatePhysical = (id: string, patch: Partial<PhysicalCheck>) =>
  unwrap<PhysicalCheck>(api.put(`/physicals/${id}`, patch));

export const submitPhysical = (
  id: string,
  body: Partial<PhysicalCheck> & { examiner: string; examinerRole: Role }
) => unwrap<{ physical: PhysicalCheck; historyCount: number }>(api.put(`/physicals/${id}/submit`, body));

export const markResponsibility = (
  id: string,
  body: { mark: ResponsibilityMark; note?: string; operator: string; operatorRole: Role }
) => unwrap<PhysicalCheck>(api.put(`/physicals/${id}/responsibility`, body));

export const getExceptions = (params?: { resolved?: boolean; type?: string }) =>
  unwrap<ExceptionRecord[]>(api.get('/exceptions', { params }));

export const resolveException = (
  id: string,
  body: { resolveNote: string; handler: string; handlerRole: Role }
) => unwrap<ExceptionRecord>(api.put(`/exceptions/${id}/resolve`, body));

export const getHandoverLogs = () =>
  unwrap<HandoverLog[]>(api.get('/handover'));

export const createHandover = (body: Omit<HandoverLog, 'id' | 'createdAt'>) =>
  unwrap<HandoverLog>(api.post('/handover', body));

export const getSchedules = () =>
  unwrap<TrainingSchedule[]>(api.get('/schedules'));

export const getExamBatches = () =>
  unwrap<ExamBatch[]>(api.get('/exam-batches'));

export const getPhysicalForms = () =>
  unwrap<PhysicalForm[]>(api.get('/physical-forms'));
