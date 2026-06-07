import { create } from 'zustand';
import type { ShiftRecord, DiscrepancyStatus, OilLossRecordForm } from '@/types';
import { mockShiftRecords } from '@/data/mockData';

interface ShiftStore {
  shifts: ShiftRecord[];
  selectedShift: ShiftRecord | null;
  setSelectedShift: (shift: ShiftRecord | null) => void;
  updateDiscrepancyStatus: (shiftId: string, discrepancyId: string, status: DiscrepancyStatus, opinion?: string, reviewer?: string) => void;
  updateStationMasterOpinion: (shiftId: string, opinion: string, reviewer: string) => void;
  updateMeterOpinion: (shiftId: string, opinion: string, reviewer: string) => void;
  confirmShift: (shiftId: string) => void;
  recordOilLoss: (shiftId: string, formData: OilLossRecordForm[]) => void;
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
  recordOilLoss: (shiftId, formData) =>
    set((state) => {
      const updatedShifts = state.shifts.map((shift) => {
        if (shift.id !== shiftId) return shift;

        const newOilData = shift.oilData?.map((oil) => {
          const form = formData.find((f) => f.tankNo === oil.tankNo);
          if (!form) return oil;

          const actualLoss = oil.startStock - form.endStock - oil.salesVolume;
          const difference = actualLoss - oil.standardLoss;

          return {
            ...oil,
            endStock: form.endStock,
            actualLoss: Math.max(0, actualLoss),
            difference: Math.max(0, difference),
            isRecorded: true,
          };
        });

        const hasAbnormalLoss = newOilData?.some((oil) => oil.difference > 10);
        const allRecorded = newOilData?.every((oil) => oil.isRecorded) ?? false;

        const avgLossRate = newOilData && newOilData.length > 0
          ? (newOilData.reduce((sum, oil) => sum + (oil.salesVolume > 0 ? (oil.actualLoss / oil.salesVolume) * 100 : 0), 0) / newOilData.length).toFixed(2)
          : '0.00';

        return {
          ...shift,
          oilData: newOilData,
          oilLossRecorded: allRecorded,
          discrepancies: shift.discrepancies.map((d) => {
            if (d.type === 'oil') {
              return {
                ...d,
                actualValue: avgLossRate,
                difference: hasAbnormalLoss ? (parseFloat(avgLossRate) - 0.15).toFixed(2) : '0.00',
                status: allRecorded ? (hasAbnormalLoss ? 'pending' : 'confirmed') : d.status,
                title: hasAbnormalLoss ? '油品损耗异常' : '油品损耗正常',
                description: hasAbnormalLoss
                  ? '部分油品实际损耗超出标准范围'
                  : '各油品损耗均在标准范围内',
              };
            }
            return d;
          }),
        };
      });

      return { shifts: updatedShifts };
    }),
}));
