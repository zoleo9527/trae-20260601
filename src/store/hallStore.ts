import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hall, HallLog, Inspection, FaultTicket, CreateFaultTicketDTO, SubmitInspectionDTO, AffectedSchedule } from '@/types/hall';
import type { HallStatus, FaultStatus } from '@/types/common';
import { generateId } from '@/utils/id';
import { now } from '@/utils/date';
import { useRoleStore } from './roleStore';
import { roleLabels } from '@/types/common';

interface HallState {
  halls: Hall[];
  hallLogs: HallLog[];
  inspections: Inspection[];
  faultTickets: FaultTicket[];
  initHalls: () => void;
  getHall: (id: string) => Hall | undefined;
  getHallLogs: (hallId: string) => HallLog[];
  getInspections: (hallId: string) => Inspection[];
  getFaultTickets: (hallId?: string) => FaultTicket[];
  getFaultTicket: (id: string) => FaultTicket | undefined;
  changeHallStatus: (hallId: string, status: HallStatus, reason?: string) => void;
  submitInspection: (data: SubmitInspectionDTO) => void;
  createFaultTicket: (data: CreateFaultTicketDTO, affectedSchedules: AffectedSchedule[]) => void;
  updateFaultTicketStatus: (ticketId: string, status: FaultStatus, remark?: string) => void;
  resolveFaultTicket: (ticketId: string, resolveRemark: string) => void;
  closeFaultTicket: (ticketId: string) => void;
  addHallLog: (hallId: string, action: string, reason?: string) => void;
}

const initialHalls: Hall[] = [
  {
    id: 'hall-1',
    name: '1号厅（激光IMAX）',
    seatCount: 350,
    equipment: ['IMAX', '激光放映', '杜比全景声', '3D'],
    status: 'idle',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'hall-2',
    name: '2号厅（杜比影院）',
    seatCount: 280,
    equipment: ['杜比视界', '杜比全景声', '4K'],
    status: 'idle',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'hall-3',
    name: '3号厅',
    seatCount: 180,
    equipment: ['4K', '5.1声道', '3D'],
    status: 'idle',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'hall-4',
    name: '4号厅',
    seatCount: 150,
    equipment: ['2K', '5.1声道'],
    status: 'idle',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'hall-5',
    name: '5号厅（VIP）',
    seatCount: 40,
    equipment: ['4K', '真皮座椅', '独立空调', '3D'],
    status: 'idle',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'hall-6',
    name: '6号厅',
    seatCount: 120,
    equipment: ['2K', '5.1声道', '3D'],
    status: 'maintenance',
    lastInspection: now(),
    createdAt: now(),
    updatedAt: now(),
  },
];

export const useHallStore = create<HallState>()(
  persist(
    (set, get) => ({
      halls: [],
      hallLogs: [],
      inspections: [],
      faultTickets: [],

      initHalls: () => {
        if (get().halls.length === 0) {
          set({ halls: initialHalls });
        }
      },

      getHall: (id) => get().halls.find((h) => h.id === id),

      getHallLogs: (hallId) =>
        get()
          .hallLogs.filter((l) => l.hallId === hallId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getInspections: (hallId) =>
        get()
          .inspections.filter((i) => i.hallId === hallId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getFaultTickets: (hallId) => {
        let tickets = get().faultTickets;
        if (hallId) {
          tickets = tickets.filter((t) => t.hallId === hallId);
        }
        return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getFaultTicket: (id) => get().faultTickets.find((t) => t.id === id),

      addHallLog: (hallId, action, reason) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const log: HallLog = {
          id: generateId(),
          hallId,
          action,
          reason,
          operator: getRoleName(),
          operatorRole: currentRole,
          createdAt: now(),
        };
        set((state) => ({
          hallLogs: [...state.hallLogs, log],
        }));
      },

      changeHallStatus: (hallId, status, reason) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const hall = get().halls.find((h) => h.id === hallId);
        if (!hall) return;

        const log: HallLog = {
          id: generateId(),
          hallId,
          fromStatus: hall.status,
          toStatus: status,
          action: '状态变更',
          reason,
          operator: getRoleName(),
          operatorRole: currentRole,
          createdAt: now(),
        };

        set((state) => ({
          halls: state.halls.map((h) =>
            h.id === hallId ? { ...h, status, updatedAt: now() } : h
          ),
          hallLogs: [...state.hallLogs, log],
        }));
      },

      submitInspection: (data) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const inspection: Inspection = {
          id: generateId(),
          hallId: data.hallId,
          operator: getRoleName(),
          operatorRole: currentRole,
          result: data.result,
          remark: data.remark,
          createdAt: now(),
        };

        const log: HallLog = {
          id: generateId(),
          hallId: data.hallId,
          action: '提交巡检',
          reason: `巡检结果：${data.result === 'normal' ? '正常' : data.result === 'warning' ? '异常' : '故障'}`,
          operator: getRoleName(),
          operatorRole: currentRole,
          createdAt: now(),
        };

        set((state) => ({
          inspections: [...state.inspections, inspection],
          hallLogs: [...state.hallLogs, log],
          halls: state.halls.map((h) =>
            h.id === data.hallId ? { ...h, lastInspection: now(), updatedAt: now() } : h
          ),
        }));
      },

      createFaultTicket: (data, affectedSchedules) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const hall = get().halls.find((h) => h.id === data.hallId);
        if (!hall) return;

        const ticket: FaultTicket = {
          id: generateId(),
          hallId: data.hallId,
          hallName: hall.name,
          scheduleId: data.scheduleId,
          affectedSchedules,
          title: data.title,
          description: data.description,
          status: 'pending',
          reportedBy: getRoleName(),
          reportedByRole: currentRole,
          createdAt: now(),
          refundGenerated: false,
        };

        if (hall.status !== 'fault') {
          get().changeHallStatus(data.hallId, 'fault', `设备故障：${data.title}`);
        }

        get().addHallLog(data.hallId, '上报故障', `${data.title}：${data.description}`);

        set((state) => ({
          faultTickets: [...state.faultTickets, ticket],
        }));
      },

      updateFaultTicketStatus: (ticketId, status, remark) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const ticket = get().faultTickets.find((t) => t.id === ticketId);
        if (!ticket) return;

        set((state) => ({
          faultTickets: state.faultTickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status,
                  handledBy: getRoleName(),
                  handledByRole: currentRole,
                  resolveRemark: remark || t.resolveRemark,
                  resolvedAt: status === 'resolved' ? now() : t.resolvedAt,
                  closedAt: status === 'closed' ? now() : t.closedAt,
                }
              : t
          ),
        }));
      },

      resolveFaultTicket: (ticketId, resolveRemark) => {
        const ticket = get().faultTickets.find((t) => t.id === ticketId);
        if (!ticket) return;

        get().updateFaultTicketStatus(ticketId, 'resolved', resolveRemark);
        get().addHallLog(ticket.hallId, '故障解决', resolveRemark);

        const pendingFaults = get().faultTickets.filter(
          (t) => t.hallId === ticket.hallId && t.status !== 'closed' && t.status !== 'resolved' && t.id !== ticketId
        );
        if (pendingFaults.length === 0) {
          get().changeHallStatus(ticket.hallId, 'idle', '故障已解决');
        }
      },

      closeFaultTicket: (ticketId) => {
        const ticket = get().faultTickets.find((t) => t.id === ticketId);
        if (ticket) {
          get().updateFaultTicketStatus(ticketId, 'closed');
          get().addHallLog(ticket.hallId, '关闭工单');
        }
      },
    }),
    {
      name: 'cinema-ops-hall',
    }
  )
);
