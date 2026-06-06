import type { ScheduleStatus } from './common';

export interface Schedule {
  id: string;
  movieName: string;
  moviePoster?: string;
  hallId: string;
  hallName: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: ScheduleStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  remark?: string;
}

export interface ScheduleLog {
  id: string;
  scheduleId: string;
  action: string;
  operator: string;
  operatorRole: string;
  remark?: string;
  createdAt: string;
  beforeData?: Partial<Schedule>;
  afterData?: Partial<Schedule>;
}

export interface CreateScheduleDTO {
  movieName: string;
  hallId: string;
  startTime: string;
  endTime: string;
  price: number;
  remark?: string;
}

export interface UpdateScheduleDTO {
  movieName?: string;
  hallId?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  status?: ScheduleStatus;
  remark?: string;
}

export interface BatchScheduleItem {
  movieName: string;
  hallId: string;
  startTime: string;
  endTime: string;
  price: number;
  remark?: string;
}

export interface BatchScheduleResult {
  total: number;
  success: number;
  failed: number;
  failedItems: { index: number; movieName: string; reason: string }[];
  successIds: string[];
}
