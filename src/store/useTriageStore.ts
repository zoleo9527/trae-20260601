import { create } from 'zustand';
import type { TriageItem } from '../types';
import { mockTriageItems } from '../data/mockData';
import { useAppointmentStore } from './useAppointmentStore';
import { useCounselorStore } from './useCounselorStore';

interface TriageState {
  triageItems: TriageItem[];
  selectedTriage: TriageItem | null;
  setTriageItems: (items: TriageItem[]) => void;
  setSelectedTriage: (item: TriageItem | null) => void;
  assignCounselor: (id: string, counselorId: string) => void;
  getPendingTriage: () => TriageItem[];
  getAssignedTriage: () => TriageItem[];
}

export const useTriageStore = create<TriageState>((set, get) => ({
  triageItems: mockTriageItems,
  selectedTriage: null,

  setTriageItems: (items) => set({ triageItems: items }),
  setSelectedTriage: (item) => set({ selectedTriage: item }),

  assignCounselor: (id, counselorId) => {
    const item = get().triageItems.find((t) => t.id === id);
    if (!item) return;

    const counselor = useCounselorStore.getState().getCounselorById(counselorId);
    if (!counselor) return;

    set((state) => ({
      triageItems: state.triageItems.map((t) =>
        t.id === id ? { ...t, assignedCounselorId: counselorId, status: 'assigned' as const } : t
      ),
    }));

    if (item.appointmentId) {
      const appointmentStore = useAppointmentStore.getState();
      const appointment = appointmentStore.appointments.find((a) => a.id === item.appointmentId);

      appointmentStore.setAppointments(
        appointmentStore.appointments.map((a) =>
          a.id === item.appointmentId
            ? { ...a, counselorId, counselorName: counselor.name, status: 'scheduled' as const }
            : a
        )
      );

      if (appointment) {
        const counselorStore = useCounselorStore.getState();
        const existingSchedule = counselorStore.schedules.find(
          (s) => s.counselorId === counselorId && s.date === appointment.date
        );
        const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

        if (existingSchedule && existingSchedule.availableSlots.includes(appointment.time)) {
          const newSchedules = counselorStore.schedules.map((s) => {
            if (s.counselorId !== counselorId || s.date !== appointment.date) return s;
            return {
              ...s,
              availableSlots: s.availableSlots.filter((t) => t !== appointment.time),
              bookedSlots: [...s.bookedSlots, appointment.time].sort(),
            };
          });
          counselorStore.setSchedules(newSchedules);
        } else if (!existingSchedule) {
          const newSchedule = {
            counselorId,
            date: appointment.date,
            availableSlots: timeSlots.filter((t) => t !== appointment.time),
            bookedSlots: [appointment.time],
          };
          counselorStore.setSchedules([...counselorStore.schedules, newSchedule]);
        }
      }
    }
  },

  getPendingTriage: () => get().triageItems.filter((t) => t.status === 'pending'),
  getAssignedTriage: () => get().triageItems.filter((t) => t.status === 'assigned'),
}));
