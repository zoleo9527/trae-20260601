import axios from 'axios';
import type { ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export default api;

export async function getProjects(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  handler?: string;
}) {
  const { data } = await api.get<ApiResponse<any>>('/projects', { params });
  return data;
}

export async function getProject(id: string) {
  const { data } = await api.get<ApiResponse<any>>(`/projects/${id}`);
  return data;
}

export async function createProject(payload: any) {
  const { data } = await api.post<ApiResponse<any>>('/projects', payload);
  return data;
}

export async function updateProject(id: string, payload: any) {
  const { data } = await api.patch<ApiResponse<any>>(`/projects/${id}`, payload);
  return data;
}

export async function updateProjectStatus(id: string, payload: { status: string; reason: string }) {
  const { data } = await api.patch<ApiResponse<any>>(`/projects/${id}/status`, payload);
  return data;
}

export async function deleteProject(id: string) {
  const { data } = await api.delete<ApiResponse<any>>(`/projects/${id}`);
  return data;
}

export async function getDocuments(params?: { projectId?: string; status?: string }) {
  const { data } = await api.get<ApiResponse<any>>('/documents', { params });
  return data;
}

export async function getDocument(id: string) {
  const { data } = await api.get<ApiResponse<any>>(`/documents/${id}`);
  return data;
}

export async function updateDocument(id: string, payload: any) {
  const { data } = await api.patch<ApiResponse<any>>(`/documents/${id}`, payload);
  return data;
}

export async function addQARecord(documentId: string, payload: any) {
  const { data } = await api.post<ApiResponse<any>>(`/documents/${documentId}/qa-records`, payload);
  return data;
}

export async function scheduleEvaluation(documentId: string, payload: any) {
  const { data } = await api.post<ApiResponse<any>>(`/documents/${documentId}/evaluation`, payload);
  return data;
}

export async function getStatusHistory(entityType: string, entityId: string) {
  const { data } = await api.get<ApiResponse<any>>('/status-history', {
    params: { entityType, entityId },
  });
  return data;
}

export async function getStats() {
  const { data } = await api.get<ApiResponse<any>>('/stats');
  return data;
}
