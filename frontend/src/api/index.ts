import axios from 'axios';
import { LoginResponse, User, ServiceRecord, Volunteer, TodayTasksResponse, CheckinRequest, ConfirmRequest, RejectRequest, ServiceCreateRequest } from '../types';

const API_BASE = '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
});

const TOKEN_KEY = 'volunteer_token';

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await axiosInstance.post('/login', { username, password });
  return response.data;
}

export async function getProfile(): Promise<User> {
  const response = await axiosInstance.get('/profile');
  return response.data;
}

export async function getVolunteers(): Promise<Volunteer[]> {
  const response = await axiosInstance.get('/volunteers');
  return response.data;
}

export async function createVolunteer(data: { name: string; phone: string; id_card: string }): Promise<Volunteer> {
  const response = await axiosInstance.post('/volunteers', data);
  return response.data;
}

export async function getServiceRecords(params?: { status?: string; date?: string; volunteer_id?: number }): Promise<ServiceRecord[]> {
  const response = await axiosInstance.get('/services', { params });
  return response.data;
}

export async function getServiceRecordById(id: number): Promise<ServiceRecord> {
  const response = await axiosInstance.get(`/services/${id}`);
  return response.data;
}

export async function createServiceRecord(data: ServiceCreateRequest): Promise<ServiceRecord> {
  const response = await axiosInstance.post('/services', data);
  return response.data;
}

export async function checkin(data: CheckinRequest): Promise<ServiceRecord> {
  const response = await axiosInstance.post('/services/checkin', data);
  return response.data;
}

export async function completeService(data: { service_record_id: number; end_time: string; duration: number }): Promise<ServiceRecord> {
  const response = await axiosInstance.post('/services/complete', data);
  return response.data;
}

export async function confirmDuration(data: ConfirmRequest): Promise<ServiceRecord> {
  const response = await axiosInstance.post('/services/confirm', data);
  return response.data;
}

export async function rejectDuration(data: RejectRequest): Promise<ServiceRecord> {
  const response = await axiosInstance.post('/services/reject', data);
  return response.data;
}

export async function resetRecord(service_record_id: number): Promise<ServiceRecord> {
  const response = await axiosInstance.post('/services/reset', { service_record_id });
  return response.data;
}

export async function getTodayTasks(): Promise<TodayTasksResponse> {
  const response = await axiosInstance.get('/services/today');
  return response.data;
}
