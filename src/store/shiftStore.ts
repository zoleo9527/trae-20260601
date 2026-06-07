import { create } from 'zustand';
import type { ShiftRecord, DiscrepancyStatus, OilLossRecordForm, DiscrepancySummary, DiscrepancyType } from '@/types';
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
  getDiscrepancySummaries: () => DiscrepancySummary[];
}

const typeNameMap: Record<DiscrepancyType, string> = {
  cash: '现金差异',
  oil: '油品差异',
  member: '会员差异',
  invoice: '发票差异',
  nozzle: '油枪差异',
};

const getUnitForType = (type: DiscrepancyType): string => {
  const unitMap: Record<DiscrepancyType, string> = {
    cash: '元',
    oil: '%',
    member: '笔',
    invoice: '张',
    nozzle: '支',
  };
  return unitMap[type];
};

export const useShiftStore = create<ShiftStore>((set, get) => ({
  shifts: mockShiftRecords,
  selectedShift: null,
  setSelectedShift: (shift) => set({ selectedShift: shift }),
  getDiscrepancySummaries: () => {
    const { shifts } = get();
    const typeMap = new Map<DiscrepancyType, { count: number; amount: number; unit: string }>();

    shifts.forEach((shift) => {
      shift.discrepancies.forEach((d) => {
        const diffValue = Number(d.difference);
        if (isNaN(diffValue) || diffValue === 0) return;
        const existing = typeMap.get(d.type) || { count: 0, amount: 0, unit: d.unit };
        typeMap.set(d.type, {
          count: existing.count + 1,
          amount: existing.amount + Math.abs(diffValue),
          unit: d.unit,
        });
      });
    });

    const allTypes: DiscrepancyType[] = ['cash', 'oil', 'member', 'invoice', 'nozzle'];
    return allTypes.map((type) => {
      const data = typeMap.get(type) || { count: 0, amount: 0, unit: getUnitForType(type) };
      return {
        type,
        typeName: typeNameMap[type],
        count: data.count,
        amount: Number(data.amount.toFixed(2)),
        unit: data.unit,
      };
    });
  },
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

        const totalSales = newOilData?.reduce((sum, oil) => sum + oil.salesVolume, 0) || 0;
        const totalLoss = newOilData?.reduce((sum, oil) => sum + oil.actualLoss, 0) || 0;
        const avgLossRate = totalSales > 0 ? ((totalLoss / totalSales) * 100).toFixed(2) : '0.00';
        const standardLossRate = '0.15';
        const diffRate = hasAbnormalLoss
          ? (parseFloat(avgLossRate) - parseFloat(standardLossRate)).toFixed(2)
          : '0.00';

        return {
          ...shift,
          oilData: newOilData,
          oilLossRecorded: allRecorded,
          discrepancies: shift.discrepancies.map((d) => {
            if (d.type === 'oil') {
              return {
                ...d,
                systemValue: standardLossRate,
                actualValue: avgLossRate,
                difference: diffRate,
                status: allRecorded ? (hasAbnormalLoss ? 'pending' : 'confirmed') : d.status,
                title: hasAbnormalLoss ? '油品损耗异常' : '油品损耗正常',
                description: hasAbnormalLoss
                  ? '部分油品实际损耗超出标准范围'
                  : '各油品损耗均在标准范围内',
                reviewer: allRecorded ? '刘计量员' : d.reviewer,
                reviewTime: allRecorded ? new Date().toLocaleString('zh-CN') : d.reviewTime,
              };
            }
            return d;
          }),
        };
      });

      return { shifts: updatedShifts };
    }),
}));
