import { create } from 'zustand';
import type { ShiftRecord, DiscrepancyStatus } from '@/types';
import { mockShiftRecords } from '@/data/mockData';

interface ShiftStore {
  shifts: ShiftRecord[];
  selectedShift: ShiftRecord | null;
  setSelectedShift: (shift: ShiftRecord | null) => void;
  updateDiscrepancyStatus: (shiftId: string, discrepancyId: string, status: DiscrepancyStatus, opinion?: string, reviewer?: string) => void;
  updateStationMasterOpinion: (shiftId: string, opinion: string, reviewer: string) => void;
  updateMeterOpinion: (shiftId: string, opinion: string, reviewer: string) => void;
  confirmShift: (shiftId: string) => void;
}

export const useShiftStore = create<ShiftStore>((set) => ({
  shifts: mockShiftRecords,
  selectedShift: null,
  setSelectedShift: (shift) => set({ selectedShift: shift }),
  updateDiscrepancyStatus: (shiftId, discrepancyId, status, opinion, reviewer) =>
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              discrepancies: shift.discrepancies.map((d) =>
                d.id === discrepancyId
                  ? {
                      ...d,
                      status,
                      reviewOpinion: opinion || d.reviewOpinion,
                      reviewer: reviewer || d.reviewer,
                      reviewTime: new Date().toLocaleString('zh-CN'),
                    }
                  : d
              ),
            }
          : shift
      ),
    })),
  updateStationMasterOpinion: (shiftId, opinion, reviewer) =>
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              stationMasterOpinion: opinion,
              stationMaster: reviewer,
              stationMasterTime: new Date().toLocaleString('zh-CN'),
              status: 'reviewing',
            }
          : shift
      ),
    })),
  updateMeterOpinion: (shiftId, opinion, reviewer) =>
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              meterOpinion: opinion,
              meter: reviewer,
              meterTime: new Date().toLocaleString('zh-CN'),
            }
          : shift
      ),
    })),
  confirmShift: (shiftId) =>
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift.id === shiftId ? { ...shift, status: 'confirmed' } : shift
      ),
    })),
}));
