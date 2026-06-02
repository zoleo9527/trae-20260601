import { create } from 'zustand';
import type { Appointment } from '../types';
import { mockAppointments } from '../data/mockData';

interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  filterStatus: Appointment['status'] | 'all';
  filterType: Appointment['type'] | 'all';
  setAppointments: (appointments: Appointment[]) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setFilterStatus: (status: Appointment['status'] | 'all') => void;
  setFilterType: (type: Appointment['type'] | 'all') => void;
  approveReschedule: (id: string) => void;
  rejectReschedule: (id: string) => void;
  getFilteredAppointments: () => Appointment[];
  getTodayAppointments: () => Appointment[];
  getPendingAppointments: () => Appointment[];
  getRescheduleRequests: () => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: mockAppointments,
  selectedAppointment: null,
  filterStatus: 'all',
  filterType: 'all',
  
  setAppointments: (appointments) => set({ appointments }),
  setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterType: (type) => set({ filterType: type }),
  
  approveReschedule: (id) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id
          ? { ...a, date: a.rescheduleRequest?.requestedDate || a.date, time: a.rescheduleRequest?.requestedTime || a.time, status: 'scheduled' as const, rescheduleRequest: undefined }
          : a
      ),
    })),
  
  rejectReschedule: (id) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status: 'scheduled' as const, rescheduleRequest: undefined } : a
      ),
    })),
  
  getFilteredAppointments: () => {
    const { appointments, filterStatus, filterType } = get();
    return appointments.filter((a) => {
      const statusMatch = filterStatus === 'all' || a.status === filterStatus;
      const typeMatch = filterType === 'all' || a.type === filterType;
      return statusMatch && typeMatch;
    });
  },
  
  getTodayAppointments: () => {
    const today = '2026-06-02';
    return get().appointments.filter((a) => a.date === today);
  },
  
  getPendingAppointments: () => get().appointments.filter((a) => a.status === 'pending'),
  
  getRescheduleRequests: () => get().appointments.filter((a) => a.rescheduleRequest),
}));
