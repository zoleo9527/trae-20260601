import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket, TicketLog, BatchCheckResult, RefundList, BatchRefundResult, RefundListLog } from '@/types/ticket';
import type { TicketStatus } from '@/types/common';
import { generateId } from '@/utils/id';
import { now } from '@/utils/date';
import { useRoleStore } from './roleStore';
import { useScheduleStore } from './scheduleStore';
import { useHallStore } from './hallStore';

interface TicketState {
  tickets: Ticket[];
  ticketLogs: TicketLog[];
  refundLists: RefundList[];
  refundListLogs: RefundListLog[];
  generateTickets: (scheduleId: string, count: number, type: 'normal' | 'group') => Ticket[];
  getTicket: (id: string) => Ticket | undefined;
  getTicketByCode: (code: string) => Ticket | undefined;
  getTicketsBySchedule: (scheduleId: string) => Ticket[];
  verifyTicket: (code: string) => { valid: boolean; ticket?: Ticket; reason?: string };
  checkTicket: (code: string) => { success: boolean; ticket?: Ticket; reason?: string };
  batchCheckTickets: (codes: string[]) => BatchCheckResult;
  applyRefund: (ticketId: string, reason: string) => boolean;
  approveRefund: (ticketId: string) => boolean;
  getTicketLogs: (ticketId: string) => TicketLog[];
  createRefundList: (scheduleId: string, reason: string, faultTicketId?: string) => RefundList | null;
  getRefundLists: () => RefundList[];
  getRefundList: (id: string) => RefundList | undefined;
  getPendingRefundLists: () => RefundList[];
  processRefundList: (refundListId: string) => BatchRefundResult;
  getRefundListLogs: (refundListId: string) => RefundListLog[];
  getAllRefundListLogs: () => RefundListLog[];
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: [],
      ticketLogs: [],
      refundLists: [],
      refundListLogs: [],

      generateTickets: (scheduleId, count, type) => {
        const schedule = useScheduleStore.getState().getSchedule(scheduleId);
        if (!schedule) return [];

        const newTickets: Ticket[] = [];
        for (let i = 0; i < count; i++) {
          const ticket: Ticket = {
            id: generateId(),
            code: `${type === 'group' ? 'G' : 'N'}${Date.now().toString().slice(-6)}${String(i + 1).padStart(4, '0')}`,
            scheduleId,
            scheduleName: `${schedule.movieName} - ${schedule.hallName}`,
            type,
            status: 'unused',
            price: schedule.price,
            createdAt: now(),
          };
          newTickets.push(ticket);
        }

        set((state) => ({
          tickets: [...state.tickets, ...newTickets],
        }));

        return newTickets;
      },

      getTicket: (id) => get().tickets.find((t) => t.id === id),

      getTicketByCode: (code) => get().tickets.find((t) => t.code === code),

      getTicketsBySchedule: (scheduleId) =>
        get()
          .tickets.filter((t) => t.scheduleId === scheduleId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      verifyTicket: (code) => {
        const ticket = get().getTicketByCode(code);
        if (!ticket) {
          return { valid: false, reason: '票券不存在' };
        }
        if (ticket.status === 'checked') {
          return { valid: false, ticket, reason: '票券已核销' };
        }
        if (ticket.status === 'refunded' || ticket.status === 'refunding') {
          return { valid: false, ticket, reason: '票券已退票或退票中' };
        }
        return { valid: true, ticket };
      },

      checkTicket: (code) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const verification = get().verifyTicket(code);

        if (!verification.valid || !verification.ticket) {
          return { success: false, reason: verification.reason };
        }

        const ticket = verification.ticket;
        const updated: Ticket = {
          ...ticket,
          status: 'checked',
          checkedBy: getRoleName(),
          checkedByRole: currentRole,
          checkedAt: now(),
        };

        const log: TicketLog = {
          id: generateId(),
          ticketId: ticket.id,
          action: '核销',
          operator: getRoleName(),
          operatorRole: currentRole,
          createdAt: now(),
        };

        set((state) => ({
          tickets: state.tickets.map((t) => (t.id === ticket.id ? updated : t)),
          ticketLogs: [...state.ticketLogs, log],
        }));

        return { success: true, ticket: updated };
      },

      batchCheckTickets: (codes) => {
        const result: BatchCheckResult = {
          total: codes.length,
          success: 0,
          failed: 0,
          failedItems: [],
          successItems: [],
        };

        const uniqueCodes = [...new Set(codes)];
        uniqueCodes.forEach((code) => {
          const checkResult = get().checkTicket(code.trim());
          if (checkResult.success && checkResult.ticket) {
            result.success++;
            result.successItems.push({ code, ticketId: checkResult.ticket.id });
          } else {
            result.failed++;
            result.failedItems.push({ code, reason: checkResult.reason || '未知错误' });
          }
        });

        return result;
      },

      applyRefund: (ticketId, reason) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const ticket = get().getTicket(ticketId);
        if (!ticket || ticket.status !== 'unused') return false;

        const updated: Ticket = {
          ...ticket,
          status: 'refunding',
          refundReason: reason,
        };

        const log: TicketLog = {
          id: generateId(),
          ticketId,
          action: '申请退票',
          operator: getRoleName(),
          operatorRole: currentRole,
          remark: reason,
          createdAt: now(),
        };

        set((state) => ({
          tickets: state.tickets.map((t) => (t.id === ticketId ? updated : t)),
          ticketLogs: [...state.ticketLogs, log],
        }));

        return true;
      },

      approveRefund: (ticketId) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const ticket = get().getTicket(ticketId);
        if (!ticket || ticket.status !== 'refunding') return false;

        const updated: Ticket = {
          ...ticket,
          status: 'refunded',
          refundedBy: getRoleName(),
          refundedByRole: currentRole,
          refundedAt: now(),
        };

        const log: TicketLog = {
          id: generateId(),
          ticketId,
          action: '退票完成',
          operator: getRoleName(),
          operatorRole: currentRole,
          createdAt: now(),
        };

        set((state) => ({
          tickets: state.tickets.map((t) => (t.id === ticketId ? updated : t)),
          ticketLogs: [...state.ticketLogs, log],
        }));

        return true;
      },

      getTicketLogs: (ticketId) =>
        get()
          .ticketLogs.filter((l) => l.ticketId === ticketId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      createRefundList: (scheduleId, reason, faultTicketId) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const schedule = useScheduleStore.getState().getSchedule(scheduleId);
        if (!schedule) return null;

        const scheduleTickets = get().getTicketsBySchedule(scheduleId);
        const unusedTickets = scheduleTickets.filter((t) => t.status === 'unused');
        const ticketIds = unusedTickets.map((t) => t.id);

        if (ticketIds.length === 0) return null;

        const refundList: RefundList = {
          id: generateId(),
          faultTicketId,
          scheduleId,
          scheduleName: schedule.movieName,
          hallName: schedule.hallName,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          ticketIds,
          reason,
          status: 'pending',
          createdBy: getRoleName(),
          createdAt: now(),
        };

        ticketIds.forEach((ticketId) => {
          get().applyRefund(ticketId, reason);
        });

        const log: RefundListLog = {
          id: generateId(),
          refundListId: refundList.id,
          action: '生成退票清单',
          operator: getRoleName(),
          operatorRole: currentRole,
          remark: `${reason}，共 ${ticketIds.length} 张票`,
          createdAt: now(),
        };

        set((state) => ({
          refundLists: [...state.refundLists, refundList],
          refundListLogs: [...state.refundListLogs, log],
        }));

        const halls = useHallStore.getState().halls;
        const hall = halls.find((h) => h.name === schedule.hallName);
        if (hall) {
          useHallStore.getState().addHallLog(
            hall.id,
            '生成退票清单',
            `《${schedule.movieName}》因${reason}生成退票清单，共 ${ticketIds.length} 张票待处理`
          );
        }

        return refundList;
      },

      getRefundLists: () =>
        get()
          .refundLists.slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getRefundList: (id) => get().refundLists.find((r) => r.id === id),

      getPendingRefundLists: () =>
        get()
          .refundLists.filter((r) => r.status === 'pending')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getRefundListLogs: (refundListId) =>
        get()
          .refundListLogs.filter((l) => l.refundListId === refundListId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getAllRefundListLogs: () =>
        get()
          .refundListLogs.slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      processRefundList: (refundListId) => {
        const { currentRole, getRoleName } = useRoleStore.getState();
        const refundList = get().getRefundList(refundListId);
        if (!refundList || refundList.status !== 'pending') {
          return { total: 0, success: 0, failed: 0, failedItems: [], successItems: [] };
        }

        const result: BatchRefundResult = {
          total: refundList.ticketIds.length,
          success: 0,
          failed: 0,
          failedItems: [],
          successItems: [],
        };

        refundList.ticketIds.forEach((ticketId) => {
          const ticket = get().getTicket(ticketId);
          if (ticket && ticket.status === 'refunding') {
            const success = get().approveRefund(ticketId);
            if (success) {
              result.success++;
              result.successItems.push({ ticketId, code: ticket.code });
            } else {
              result.failed++;
              result.failedItems.push({ ticketId, code: ticket.code, reason: '退票失败' });
            }
          } else if (ticket && ticket.status === 'refunded') {
            result.success++;
            result.successItems.push({ ticketId, code: ticket.code });
          } else {
            result.failed++;
            result.failedItems.push({
              ticketId,
              code: ticket?.code || '未知票券',
              reason: `状态异常：${ticket?.status || '不存在'}`,
            });
          }
        });

        const log: RefundListLog = {
          id: generateId(),
          refundListId,
          action: '批量处理退票',
          operator: getRoleName(),
          operatorRole: currentRole,
          remark: `成功 ${result.success} 张，失败 ${result.failed} 张`,
          createdAt: now(),
        };

        set((state) => ({
          refundLists: state.refundLists.map((r) =>
            r.id === refundListId
              ? {
                  ...r,
                  status: result.failed === 0 ? 'completed' : 'processing',
                  processedBy: getRoleName(),
                  processedAt: now(),
                }
              : r
          ),
          refundListLogs: [...state.refundListLogs, log],
        }));

        const halls = useHallStore.getState().halls;
        const hall = halls.find((h) => h.name === refundList.hallName);
        if (hall) {
          useHallStore.getState().addHallLog(
            hall.id,
            '退票处理完成',
            `《${refundList.scheduleName}》退票清单处理完成：成功 ${result.success} 张，失败 ${result.failed} 张，原因：${refundList.reason}`
          );
        }

        return result;
      },
    }),
    {
      name: 'cinema-ops-ticket',
    }
  )
);
