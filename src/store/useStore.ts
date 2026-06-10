import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  monthlyRentals as rawInitialRentals,
  auditProcesses as rawInitialAudits,
  dispatchRecords as rawInitialDispatches,
  operators as initialOperators,
  exceptionOrders as rawInitialExceptions,
  riskItems as initialRisks,
  activityItems as initialActivities,
} from "../data/mockData";
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
  RentalStatus,
  AuditNode,
  OperatorRole,
} from "../data/types";

export const inferAuditStatus = (a: any): AuditProcess["status"] => {
  const nodes: AuditNode[] = a.nodes;
  if (nodes.some((n) => n.status === "stuck")) return "stuck";
  if (nodes.every((n) => n.status === "completed" || n.status === "success"))
    return "completed";
  if (nodes.some((n) => n.status === "failed")) return "rejected";
  if (a.currentNode === 0 && (!nodes[0] || nodes[0].status === "pending"))
    return "pending";
  return "processing";
};

export const isAuditPending = (audit: AuditProcess): boolean => {
  const status = audit.status || inferAuditStatus(audit);
  return status === 'pending' || status === 'processing' || status === 'stuck';
};

const initialRentals: MonthlyRental[] = rawInitialRentals.map((r: any) => ({
  ...r,
  updatedAt: r.updatedAt || r.createdAt,
}));

const initialAudits: AuditProcess[] = rawInitialAudits.map((a: any) => ({
  ...a,
  status: a.status || inferAuditStatus(a),
}));

const initialExceptions: ExceptionOrder[] = rawInitialExceptions.map(
  (e: any) => ({
    ...e,
    closedAt: e.closedAt,
  }),
);

const initialDispatches: DispatchRecord[] = rawInitialDispatches;

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
    updateAuditNode: (
      auditId: string,
      nodeIndex: number,
      status: NodeStatus,
      remark?: string,
    ) => void;
    advanceAuditNode: (auditId: string) => void;
    passAuditNode: (auditId: string, handlerId?: string) => void;
    rejectAuditNode: (
      auditId: string,
      remark: string,
      handlerId?: string,
    ) => void;
    retryDispatch: (dispatchId: string, nodeId: string) => void;
    completeDispatch: (dispatchId: string) => void;
    updateExceptionStatus: (
      exceptionId: string,
      status: ExceptionStatus,
      handlerId?: string,
    ) => void;
    addExceptionLog: (
      exceptionId: string,
      operatorId: string,
      action: string,
      remark: string,
    ) => void;
    addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
    assignHandler: (exceptionId: string, handlerId: string) => void;
    closeException: (
      exceptionId: string,
      operatorId: string,
      remark: string,
    ) => void;
    claimException: (exceptionId: string, operatorId: string) => void;
    transferException: (
      exceptionId: string,
      fromOperatorId: string,
      toOperatorId: string,
      remark: string,
    ) => void;
    addTodoItem: (todo: Omit<TodoItem, "id" | "createdAt">) => void;
    updateTodoStatus: (todoId: string, completed: boolean) => void;
    removeTodoById: (todoId: string) => void;
    removeRiskById: (riskId: string) => void;
    refreshTodos: () => void;
    resetAll: () => void;
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      rentals: initialRentals,
      audits: initialAudits,
      dispatches: initialDispatches,
      operators: initialOperators,
      exceptions: initialExceptions,
      risks: initialRisks,
      activities: initialActivities,
      todos: [] as TodoItem[],
      currentUser: initialOperators[0],

      actions: {
        getAuditById: (id) => get().audits.find((a) => a.id === id),
        getRentalById: (id) => get().rentals.find((r) => r.id === id),
        getDispatchById: (id) => get().dispatches.find((d) => d.id === id),
        getExceptionById: (id) => get().exceptions.find((e) => e.id === id),
        getRentalByAuditId: (auditId) =>
          get().rentals.find((r) => r.auditId === auditId),
        getAuditByRentalId: (rentalId) =>
          get().audits.find((a) => a.rentalId === rentalId),

        updateAuditNode: (auditId, nodeIndex, status, remark) => {
          const now = new Date().toISOString();
          set((state) => ({
            audits: state.audits.map((audit) => {
              if (audit.id !== auditId) return audit;
              const newNodes = [...audit.nodes];
              newNodes[nodeIndex] = {
                ...newNodes[nodeIndex],
                status,
                remark: remark || newNodes[nodeIndex].remark,
                endTime:
                  status === "completed" || status === "failed"
                    ? now
                    : newNodes[nodeIndex].endTime,
              };
              const lastIdx = audit.nodes.length - 1;
              const isAllCompleted =
                status === "completed" && nodeIndex === lastIdx;
              return {
                ...audit,
                nodes: newNodes,
                updatedAt: now,
                status: isAllCompleted
                  ? "completed"
                  : status === "failed"
                    ? "rejected"
                    : audit.status,
                currentNode: status === "completed" ? nodeIndex + 1 : nodeIndex,
              };
            }),
            rentals: state.rentals.map((rental) => {
              if (rental.auditId !== auditId) return rental;
              const audit = get().audits.find((a) => a.id === auditId);
              const lastIdx = audit ? audit.nodes.length - 1 : 0;
              const isAllCompleted =
                status === "completed" && nodeIndex === lastIdx;
              let newStatus: RentalStatus = rental.status;
              if (status === "failed") newStatus = "rejected";
              if (isAllCompleted) newStatus = "active";
              return {
                ...rental,
                status: newStatus,
                updatedAt: now,
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        advanceAuditNode: (auditId) => {
          const now = new Date().toISOString();
          set((state) => {
            const audit = state.audits.find((a) => a.id === auditId);
            if (!audit) return state;
            const nextNode = audit.currentNode + 1;
            const lastIdx = audit.nodes.length - 1;
            const newNodes = audit.nodes.map((node, idx) => {
              if (idx === audit.currentNode) {
                return {
                  ...node,
                  status: "completed" as NodeStatus,
                  endTime: now,
                };
              }
              if (idx === nextNode && nextNode <= lastIdx) {
                return {
                  ...node,
                  status: "processing" as NodeStatus,
                  startTime: now,
                };
              }
              return node;
            });
            const isAuditComplete = nextNode > lastIdx;
            return {
              audits: state.audits.map((a) => {
                if (a.id !== auditId) return a;
                return {
                  ...a,
                  nodes: newNodes,
                  currentNode: nextNode,
                  updatedAt: now,
                  status: isAuditComplete ? "completed" : a.status,
                };
              }),
              rentals: state.rentals.map((rental) => {
                if (rental.auditId !== auditId) return rental;
                return {
                  ...rental,
                  status: isAuditComplete ? "active" : rental.status,
                  updatedAt: now,
                };
              }),
            };
          });
          get().actions.refreshTodos();
        },

        passAuditNode: (auditId, handlerId) => {
          const now = new Date().toISOString();
          const state = get();
          const audit = state.audits.find((a) => a.id === auditId);
          if (!audit) return;
          const currentIdx = audit.currentNode;
          const lastIdx = audit.nodes.length - 1;
          const nextIdx = currentIdx + 1;
          const handler = handlerId
            ? state.operators.find((o) => o.id === handlerId)
            : state.currentUser;

          set((s) => {
            const newNodes = audit.nodes.map((node, idx) => {
              if (idx === currentIdx) {
                return {
                  ...node,
                  status: "completed" as NodeStatus,
                  endTime: now,
                  handlerId: handler?.id || node.handlerId,
                  handlerName: handler?.name || node.handlerName,
                };
              }
              if (idx === nextIdx && nextIdx <= lastIdx) {
                return {
                  ...node,
                  status: "processing" as NodeStatus,
                  startTime: now,
                };
              }
              return node;
            });
            const isAuditComplete = nextIdx > lastIdx;
            return {
              audits: s.audits.map((a) => {
                if (a.id !== auditId) return a;
                return {
                  ...a,
                  nodes: newNodes,
                  currentNode: Math.min(nextIdx, lastIdx),
                  updatedAt: now,
                  status: isAuditComplete ? "completed" : a.status,
                  handlerId: isAuditComplete
                    ? a.handlerId
                    : newNodes[Math.min(nextIdx, lastIdx)]?.handlerId ||
                      a.handlerId,
                };
              }),
              rentals: s.rentals.map((rental) => {
                if (rental.auditId !== auditId) return rental;
                return {
                  ...rental,
                  status: isAuditComplete ? "active" : rental.status,
                  updatedAt: now,
                };
              }),
            };
          });
          get().actions.refreshTodos();
        },

        rejectAuditNode: (auditId, remark, handlerId) => {
          const now = new Date().toISOString();
          const state = get();
          const audit = state.audits.find((a) => a.id === auditId);
          if (!audit) return;
          const currentIdx = audit.currentNode;
          const handler = handlerId
            ? state.operators.find((o) => o.id === handlerId)
            : state.currentUser;

          set((s) => ({
            audits: s.audits.map((a) => {
              if (a.id !== auditId) return a;
              const newNodes = [...a.nodes];
              newNodes[currentIdx] = {
                ...newNodes[currentIdx],
                status: "failed" as NodeStatus,
                endTime: now,
                remark,
                handlerId: handler?.id || newNodes[currentIdx].handlerId,
                handlerName: handler?.name || newNodes[currentIdx].handlerName,
              };
              return {
                ...a,
                nodes: newNodes,
                status: "rejected",
                updatedAt: now,
              };
            }),
            rentals: s.rentals.map((rental) => {
              if (rental.auditId !== auditId) return rental;
              return {
                ...rental,
                status: "rejected",
                updatedAt: now,
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        retryDispatch: (dispatchId, nodeId) => {
          const now = new Date().toISOString();
          set((state) => ({
            dispatches: state.dispatches.map((dispatch) => {
              if (dispatch.id !== dispatchId) return dispatch;
              const nodeIndex = dispatch.nodes.findIndex(
                (n) => n.id === nodeId,
              );
              if (nodeIndex === -1) return dispatch;

              const newNodes = [...dispatch.nodes];
              newNodes[nodeIndex] = {
                ...newNodes[nodeIndex],
                status: "processing",
                startTime: now,
                endTime: null,
                errorCode: undefined,
                errorMessage: undefined,
                rawLog: undefined,
              };

              for (let i = nodeIndex + 1; i < newNodes.length; i++) {
                newNodes[i] = {
                  ...newNodes[i],
                  status: "pending",
                  startTime: null,
                  endTime: null,
                  errorCode: undefined,
                  errorMessage: undefined,
                  rawLog: undefined,
                };
              }

              return {
                ...dispatch,
                nodes: newNodes,
                status: "dispatching",
                retryCount: dispatch.retryCount + 1,
                updatedAt: now,
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        completeDispatch: (dispatchId) => {
          const now = new Date().toISOString();
          set((state) => ({
            dispatches: state.dispatches.map((dispatch) => {
              if (dispatch.id !== dispatchId) return dispatch;
              const newNodes = dispatch.nodes.map((node) =>
                node.status === "pending" || node.status === "processing"
                  ? { ...node, status: "success" as const, endTime: now }
                  : node,
              );
              return {
                ...dispatch,
                nodes: newNodes,
                status: "success",
                updatedAt: now,
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        updateExceptionStatus: (exceptionId, status, handlerId) => {
          const now = new Date().toISOString();
          set((state) => ({
            exceptions: state.exceptions.map((exc) => {
              if (exc.id !== exceptionId) return exc;
              return {
                ...exc,
                status,
                handlerId: handlerId ?? exc.handlerId,
                updatedAt: now,
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        addExceptionLog: (exceptionId, operatorId, action, remark) => {
          const now = new Date().toISOString();
          const state = get();
          const operator = state.operators.find((o) => o.id === operatorId);
          set((s) => ({
            exceptions: s.exceptions.map((exc) => {
              if (exc.id !== exceptionId) return exc;
              return {
                ...exc,
                logs: [
                  ...exc.logs,
                  {
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
          set((state) => ({
            activities: [
              {
                ...activity,
                id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                timestamp: now,
              },
              ...state.activities,
            ].slice(0, 100),
          }));
        },

        assignHandler: (exceptionId, handlerId) => {
          const now = new Date().toISOString();
          const state = get();
          const operator = state.operators.find((o) => o.id === handlerId);
          set((s) => ({
            exceptions: s.exceptions.map((exc) => {
              if (exc.id !== exceptionId) return exc;
              return {
                ...exc,
                handlerId,
                handlerName: operator?.name,
                updatedAt: now,
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        claimException: (exceptionId, operatorId) => {
          const now = new Date().toISOString();
          const state = get();
          const operator = state.operators.find((o) => o.id === operatorId);
          set((s) => ({
            exceptions: s.exceptions.map((exc) => {
              if (exc.id !== exceptionId) return exc;
              return {
                ...exc,
                handlerId: operatorId,
                handlerName: operator?.name,
                status: "processing",
                updatedAt: now,
                logs: [
                  ...exc.logs,
                  {
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    operatorId,
                    operatorName: operator?.name,
                    action: "接单处理",
                    remark: "已接单，开始处理",
                    timestamp: now,
                  },
                ],
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        transferException: (
          exceptionId,
          fromOperatorId,
          toOperatorId,
          remark,
        ) => {
          const now = new Date().toISOString();
          const state = get();
          const fromOp = state.operators.find((o) => o.id === fromOperatorId);
          const toOp = state.operators.find((o) => o.id === toOperatorId);
          set((s) => ({
            exceptions: s.exceptions.map((exc) => {
              if (exc.id !== exceptionId) return exc;
              return {
                ...exc,
                handlerId: toOperatorId,
                handlerName: toOp?.name,
                status: "transferred",
                updatedAt: now,
                logs: [
                  ...exc.logs,
                  {
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    operatorId: fromOperatorId,
                    operatorName: fromOp?.name,
                    action: "转派处理",
                    remark: `转派给 ${toOp?.name}: ${remark}`,
                    timestamp: now,
                  },
                ],
              };
            }),
          }));
          get().actions.refreshTodos();
        },

        closeException: (exceptionId, operatorId, remark) => {
          const now = new Date().toISOString();
          const state = get();
          const operator = state.operators.find((o) => o.id === operatorId);
          set((s) => ({
            exceptions: s.exceptions.map((exc) => {
              if (exc.id !== exceptionId) return exc;
              return {
                ...exc,
                status: "closed",
                updatedAt: now,
                closedAt: now,
                logs: [
                  ...exc.logs,
                  {
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    operatorId,
                    operatorName: operator?.name,
                    action: "关闭工单",
                    remark,
                    timestamp: now,
                  },
                ],
              };
            }),
            risks: s.risks.filter((r) => {
              if (r.relatedType !== "exception") return true;
              return r.relatedId !== exceptionId;
            }),
          }));
          get().actions.refreshTodos();
        },

        addTodoItem: (todo) => {
          const now = new Date().toISOString();
          set((state) => ({
            todos: [
              {
                ...todo,
                id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                createdAt: now,
              },
              ...state.todos,
            ],
          }));
        },

        updateTodoStatus: (todoId, completed) => {
          set((state) => ({
            todos: state.todos.map((t) =>
              t.id === todoId ? { ...t, completed } : t,
            ),
          }));
        },

        removeTodoById: (todoId) => {
          set((state) => ({
            todos: state.todos.filter((t) => t.id !== todoId),
          }));
        },

        removeRiskById: (riskId) => {
          set((state) => ({
            risks: state.risks.filter((r) => r.id !== riskId),
          }));
        },

        refreshTodos: () => {
          const state = get();
          const newTodos: TodoItem[] = [];

          state.exceptions.forEach((exc) => {
            if (
              exc.status === "pending" ||
              exc.status === "processing" ||
              exc.status === "transferred"
            ) {
              const priority =
                exc.priority === "high"
                  ? "high"
                  : exc.priority === "medium"
                    ? "medium"
                    : "low";
              const titleMap: Record<string, string> = {
                permission_expired: "月租权限失效",
                unlicensed_dispute: "无牌车争议",
                gate_fault: "道闸故障抢修",
              };
              const handlerMap: Record<string, OperatorRole[]> = {
                permission_expired: ["service", "operation"],
                unlicensed_dispute: ["service"],
                gate_fault: ["maintenance"],
              };
              const handlerOp = exc.handlerId
                ? state.operators.find((o) => o.id === exc.handlerId)
                : null;
              const statusLabel =
                exc.status === "transferred"
                  ? "已转派"
                  : exc.status === "processing"
                    ? "处理中"
                    : "待分配";
              newTodos.push({
                id: `auto-exc-${exc.id}`,
                type: "exception",
                title: titleMap[exc.type] || "异常处理",
                subtitle: `${exc.plateNumber || "-"} - ${exc.parkingLot} - ${handlerOp?.name || statusLabel}`,
                description: `${exc.plateNumber || "-"} - ${exc.parkingLot} - ${handlerOp?.name || statusLabel}`,
                priority,
                status: exc.status === "pending" ? "pending" : "processing",
                completed: false,
                roles: handlerMap[exc.type],
                handlerRole: handlerMap[exc.type],
                relatedId: exc.id,
                relatedType: "exception",
                path: `/exception/${exc.id}`,
                createdAt: exc.createdAt,
              });
            }
          });

          state.audits.forEach((audit) => {
            if (isAuditPending(audit)) {
              const rental = state.rentals.find((r) => r.auditId === audit.id);
              const currentNode = audit.nodes[audit.currentNode];
              const stuckNode = audit.nodes.find((n) => n.status === "stuck");
              newTodos.push({
                id: `auto-audit-${audit.id}`,
                type: "audit",
                title: stuckNode
                  ? `${stuckNode.name}卡住`
                  : currentNode
                    ? currentNode.name
                    : "新月租审核",
                subtitle: `${rental?.plateNumber || "无牌车"} - ${currentNode?.handlerName || "待分配"}`,
                description: `${rental?.plateNumber || "无牌车"} - ${rental?.parkingLot || "-"} - ${currentNode?.handlerName || "待分配"}`,
                priority: stuckNode
                  ? "high"
                  : audit.currentNode <= 1
                    ? "medium"
                    : "low",
                status: stuckNode
                  ? "pending"
                  : currentNode?.status === "processing"
                    ? "processing"
                    : "pending",
                completed: false,
                roles: ["operation"],
                handlerRole: ["operation"],
                relatedId: audit.id,
                relatedType: "audit",
                path: `/audit/${audit.id}`,
                createdAt: audit.createdAt,
              });
            }
          });

          state.dispatches.forEach((dispatch) => {
            if (dispatch.status === "failed") {
              const failedNode = dispatch.nodes.find(
                (n) => n.status === "failed",
              );
              newTodos.push({
                id: `auto-dispatch-${dispatch.id}`,
                type: "dispatch_retry",
                title: "权限下发重试",
                subtitle: `${dispatch.plateNumber} - ${failedNode?.name || "未知节点"}`,
                description: `${dispatch.plateNumber} - ${failedNode?.name || "未知节点"} - 待重试`,
                priority: failedNode?.name?.includes("道闸")
                  ? "high"
                  : "medium",
                status: "pending",
                completed: false,
                roles: ["maintenance", "operation"],
                handlerRole: ["maintenance", "operation"],
                relatedId: dispatch.id,
                relatedType: "dispatch",
                path: `/dispatch/${dispatch.id}`,
                createdAt: dispatch.updatedAt,
              });
            }
          });

          const manualTodos = state.todos.filter((t) =>
            t.id.startsWith("todo-"),
          );

          const sorted = [...newTodos, ...manualTodos].sort((a, b) => {
            const pOrder = { high: 0, medium: 1, low: 2 };
            const pDiff = pOrder[a.priority] - pOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

          set({ todos: sorted });
        },

        resetAll: () => {
          set({
            rentals: initialRentals,
            audits: initialAudits,
            dispatches: initialDispatches,
            operators: initialOperators,
            exceptions: initialExceptions,
            risks: initialRisks,
            activities: initialActivities,
            todos: [],
            currentUser: initialOperators[0],
          });
          localStorage.removeItem("parking_recent_visits");
          get().actions.refreshTodos();
        },
      },
    }),
    {
      name: "parking_app_state",
      version: 2,
      partialize: (state) => ({
        rentals: state.rentals,
        audits: state.audits,
        dispatches: state.dispatches,
        operators: state.operators,
        exceptions: state.exceptions,
        risks: state.risks,
        activities: state.activities,
        currentUserId: state.currentUser.id,
      }),
      merge: (persistedState: any, currentState) => {
        const todos = (persistedState?.todos || []).filter((t: TodoItem) =>
          t.id.startsWith("todo-"),
        );
        const merged = {
          ...currentState,
          ...persistedState,
          todos,
          currentUser:
            persistedState?.currentUserId &&
            currentState.operators.find(
              (o) => o.id === persistedState.currentUserId,
            )
              ? currentState.operators.find(
                  (o) => o.id === persistedState.currentUserId,
                )!
              : currentState.currentUser,
        };
        return merged;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.actions.refreshTodos(), 0);
        }
      },
    },
  ),
);
