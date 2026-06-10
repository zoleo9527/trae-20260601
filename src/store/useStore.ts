import { create } from 'zustand';
import {
  monthlyRentals as initialRentals,
  auditProcesses as initialAudits,
  dispatchRecords as initialDispatches,
  operators as initialOperators,
  exceptionOrders as initialExceptions,
  riskItems as initialRisks,
  activityItems as initialActivities,
  todoItems as initialTodos,
} from '../data/mockData';
import type {
  MonthlyRental,
  AuditProcess,
  DispatchRecord,
  Operator,
  ExceptionOrder,
  RiskItem,
  ActivityItem,
  TodoItem,
  ExceptionStatus,
  NodeStatus,
} from '../data/types';

interface AppState {
  rentals: MonthlyRental[];
  audits: AuditProcess[];
  dispatches: DispatchRecord[];
  operators: Operator[];
  exceptions: ExceptionOrder[];
  risks: RiskItem[];
  activities: ActivityItem[];
  todos: TodoItem[];
  currentUser: Operator;
  actions: {
    getAuditById: (id: string) => AuditProcess | undefined;
    getRentalById: (id: string) => MonthlyRental | undefined;
    getDispatchById: (id: string) => DispatchRecord | undefined;
    getExceptionById: (id: string) => ExceptionOrder | undefined;
    getRentalByAuditId: (auditId: string) => MonthlyRental | undefined;
    getAuditByRentalId: (rentalId: string) => AuditProcess | undefined;
    updateAuditNode: (auditId: string, nodeIndex: number, status: NodeStatus, remark?: string) => void;
    advanceAuditNode: (auditId: string) => void;
    retryDispatch: (dispatchId: string, nodeId: string) => void;
    updateExceptionStatus: (exceptionId: string, status: ExceptionStatus, handlerId?: string) => void;
    addExceptionLog: (exceptionId: string, operatorId: string, action: string, remark: string) => void;
    addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
    assignHandler: (exceptionId: string, handlerId: string) => void;
  };
}

export const useStore = create<AppState>((set, get) => ({
  rentals: initialRentals,
  audits: initialAudits,
  dispatches: initialDispatches,
  operators: initialOperators,
  exceptions: initialExceptions,
  risks: initialRisks,
  activities: initialActivities,
  todos: initialTodos,
  currentUser: initialOperators[0],

  actions: {
    getAuditById: (id) => get().audits.find(a => a.id === id),
    getRentalById: (id) => get().rentals.find(r => r.id === id),
    getDispatchById: (id) => get().dispatches.find(d => d.id === id),
    getExceptionById: (id) => get().exceptions.find(e => e.id === id),
    getRentalByAuditId: (auditId) => get().rentals.find(r => r.auditId === auditId),
    getAuditByRentalId: (rentalId) => get().audits.find(a => a.rentalId === rentalId),

    updateAuditNode: (auditId, nodeIndex, status, remark) => {
      const now = new Date().toISOString();
      set(state => ({
        audits: state.audits.map(audit => {
          if (audit.id !== auditId) return audit;
          const newNodes = [...audit.nodes];
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            status,
            remark: remark || newNodes[nodeIndex].remark,
            endTime: status === 'completed' || status === 'failed' ? now : newNodes[nodeIndex].endTime,
          };
          return {
            ...audit,
            nodes: newNodes,
            updatedAt: now,
            currentNode: status === 'completed' ? nodeIndex + 1 : nodeIndex,
          };
        }),
      }));
    },

    advanceAuditNode: (auditId) => {
      const now = new Date().toISOString();
      set(state => ({
        audits: state.audits.map(audit => {
          if (audit.id !== auditId) return audit;
          const nextNode = audit.currentNode + 1;
          const newNodes = audit.nodes.map((node, idx) => {
            if (idx === audit.currentNode) {
              return { ...node, status: 'completed' as NodeStatus, endTime: now };
            }
            if (idx === nextNode) {
              return { ...node, status: 'processing' as NodeStatus, startTime: now };
            }
            return node;
          });
          return {
            ...audit,
            nodes: newNodes,
            currentNode: nextNode,
            updatedAt: now,
          };
        }),
      }));
    },

    retryDispatch: (dispatchId, nodeId) => {
      const now = new Date().toISOString();
      set(state => ({
        dispatches: state.dispatches.map(dispatch => {
          if (dispatch.id !== dispatchId) return dispatch;
          const nodeIndex = dispatch.nodes.findIndex(n => n.id === nodeId);
          if (nodeIndex === -1) return dispatch;

          const newNodes = [...dispatch.nodes];
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            status: 'processing',
            startTime: now,
            endTime: null,
            errorCode: undefined,
            errorMessage: undefined,
            rawLog: undefined,
          };

          for (let i = nodeIndex + 1; i < newNodes.length; i++) {
            newNodes[i] = {
              ...newNodes[i],
              status: 'pending',
              startTime: null,
              endTime: null,
            };
          }

          return {
            ...dispatch,
            nodes: newNodes,
            status: 'dispatching',
            retryCount: dispatch.retryCount + 1,
            updatedAt: now,
          };
        }),
      }));
    },

    updateExceptionStatus: (exceptionId, status, handlerId) => {
      const now = new Date().toISOString();
      set(state => ({
        exceptions: state.exceptions.map(exc => {
          if (exc.id !== exceptionId) return exc;
          return {
            ...exc,
            status,
            handlerId: handlerId ?? exc.handlerId,
            updatedAt: now,
          };
        }),
      }));
    },

    addExceptionLog: (exceptionId, operatorId, action, remark) => {
      const now = new Date().toISOString();
      const state = get();
      const operator = state.operators.find(o => o.id === operatorId);
      set(state => ({
        exceptions: state.exceptions.map(exc => {
          if (exc.id !== exceptionId) return exc;
          return {
            ...exc,
            logs: [
              ...exc.logs,
              {
                id: `log-${Date.now()}`,
                operatorId,
                operatorName: operator?.name,
                action,
                remark,
                timestamp: now,
              },
            ],
            updatedAt: now,
          };
        }),
      }));
    },

    addActivity: (activity) => {
      const now = new Date().toISOString();
      set(state => ({
        activities: [
          {
            ...activity,
            id: `act-${Date.now()}`,
            timestamp: now,
          },
          ...state.activities,
        ].slice(0, 50),
      }));
    },

    assignHandler: (exceptionId, handlerId) => {
      const now = new Date().toISOString();
      const state = get();
      const operator = state.operators.find(o => o.id === handlerId);
      set(state => ({
        exceptions: state.exceptions.map(exc => {
          if (exc.id !== exceptionId) return exc;
          return {
            ...exc,
            handlerId,
            handlerName: operator?.name,
            updatedAt: now,
          };
        }),
      }));
    },
  },
}));
