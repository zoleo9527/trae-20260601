import { create } from 'zustand';
import type { Counselor, CounselorSchedule } from '../types';
import { mockCounselors, mockSchedules } from '../data/mockData';

interface CounselorState {
  counselors: Counselor[];
  schedules: CounselorSchedule[];
  selectedDate: string;
  selectedCounselor: string | null;
  setCounselors: (counselors: Counselor[]) => void;
  setSchedules: (schedules: CounselorSchedule[]) => void;
  setSelectedDate: (date: string) => void;
  setSelectedCounselor: (id: string | null) => void;
  getCounselorById: (id: string) => Counselor | undefined;
  getScheduleForDate: (date: string) => CounselorSchedule[];
}

export const useCounselorStore = create<CounselorState>((set, get) => ({
  counselors: mockCounselors,
  schedules: mockSchedules,
  selectedDate: '2026-06-02',
  selectedCounselor: null,
  
  setCounselors: (counselors) => set({ counselors }),
  setSchedules: (schedules) => set({ schedules }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedCounselor: (id) => set({ selectedCounselor: id }),
  
  getCounselorById: (id) => get().counselors.find((c) => c.id === id),
  
  getScheduleForDate: (date) => get().schedules.filter((s) => s.date === date),
}));
