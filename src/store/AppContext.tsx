import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type {
  AppState,
  User,
  Complaint,
  VisitRecord,
  TimelineEvent,
  NotificationItem,
  RoleType,
  ComplaintStatus,
  VisitStatus,
  VisitResult,
  ComplaintCategory,
  Customer,
} from '@/types';
import {
  mockUsers,
  mockComplaints,
  mockVisits,
  mockNotifications,
  mockCustomers,
} from '@/data/mock';
import { uid, now } from '@/lib/utils';

interface AppContextValue extends AppState {
  switchUser: (userId: string) => void;
  usersByRole: (role: RoleType) => User[];
  getComplaint: (id: string) => Complaint | undefined;
  getVisit: (id: string) => VisitRecord | undefined;
  registerComplaint: (data: {
    category: ComplaintCategory;
    title: string;
    content: string;
    customer: Customer;
    queueNo?: string;
    counterNo?: string;
  }) => Complaint;
  assignComplaint: (complaintId: string, handlerId: string) => void;
  updateComplaintStatus: (
    complaintId: string,
    status: ComplaintStatus,
    content: string,
  ) => void;
  escalateComplaint: (complaintId: string, reason: string) => void;
  rejectComplaint: (complaintId: string, reason: string) => void;
  resolveComplaint: (complaintId: string, resolution: string) => void;
  addTimelineToComplaint: (complaintId: string, event: Omit<TimelineEvent, 'id' | 'createdAt'>) => void;
  triggerAbnormalSample: (complaintId: string, rule: string) => void;
  createVisitFromComplaint: (complaintId: string, assigneeId: string) => VisitRecord;
  updateVisitStatus: (visitId: string, status: VisitStatus, note?: string) => void;
  submitVisitResult: (
    visitId: string,
    data: {
      result: VisitResult;
      customerFeedback: string;
      internalNote?: string;
      visitMethod?: 'phone' | 'onsite' | 'online';
    },
  ) => void;
  returnVisit: (visitId: string, reason: string) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (n: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [users] = useState<User[]>(mockUsers);
  const [complaints, setComplaints] = useState<Complaint[]>(() => clone(mockComplaints));
  const [visits, setVisits] = useState<VisitRecord[]>(() => clone(mockVisits));
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    () => clone(mockNotifications),
  );

  const switchUser = useCallback((userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (u) setCurrentUser(u);
  }, [users]);

  const usersByRole = useCallback(
    (role: RoleType) => users.filter((u) => u.role === role),
    [users],
  );

  const getComplaint = useCallback(
    (id: string) => complaints.find((c) => c.id === id),
    [complaints],
  );
  const getVisit = useCallback((id: string) => visits.find((v) => v.id === id), [visits]);

  const addNotification = useCallback((n: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => [
      { ...n, id: uid('n_'), createdAt: now(), read: false },
      ...prev,
    ]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const addTimelineToComplaint = useCallback(
    (complaintId: string, event: Omit<TimelineEvent, 'id' | 'createdAt'>) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? { ...c, timeline: [...c.timeline, { ...event, id: uid('e_'), createdAt: now() }] }
            : c,
        ),
      );
    },
    [],
  );

  const registerComplaint: AppContextValue['registerComplaint'] = useCallback(
    (data) => {
      const newC: Complaint = {
        id: uid('cp_'),
        code: 'TS' + new Date().toISOString().slice(0, 10).replace(/-/g, '') +
          String(Math.floor(Math.random() * 900) + 100),
        category: data.category,
        title: data.title,
        content: data.content,
        customer: data.customer,
        status: 'registered',
        registeredBy: currentUser.id,
        registeredByName: currentUser.name,
        registeredAt: now(),
        queueNo: data.queueNo,
        counterNo: data.counterNo,
        branch: '朝阳支行营业部',
        visits: [],
        timeline: [
          {
            id: uid('e_'),
            complaintId: '',
            type: 'register',
            createdAt: now(),
            operatorId: currentUser.id,
            operatorName: currentUser.name,
            operatorRole: currentUser.role,
            content: `${currentUser.name} 登记投诉`,
          },
        ],
      };
      newC.timeline[0].complaintId = newC.id;
      setComplaints((prev) => [newC, ...prev]);
      addNotification({
        type: 'info',
        title: '新投诉待分派',
        message: `投诉 ${newC.code} 已登记，请及时分派处理人`,
        linkTo: `/complaints/${newC.id}`,
      });
      return newC;
    },
    [currentUser, addNotification],
  );

  const assignComplaint = useCallback(
    (complaintId: string, handlerId: string) => {
      const handler = users.find((u) => u.id === handlerId);
      if (!handler) return;
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status: 'assigned',
                assigneeId: handler.id,
                assigneeName: handler.name,
                assigneeRole: handler.role,
                handlerId: handler.id,
                handlerName: handler.name,
                handlerRole: handler.role,
                assignedAt: now(),
                timeline: [
                  ...c.timeline,
                  {
                    id: uid('e_'),
                    complaintId,
                    type: 'assign',
                    createdAt: now(),
                    operatorId: currentUser.id,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    content: `分派给 ${handler.name}（${handler.role === 'manager' ? '客户经理' : handler.role === 'lobby' ? '大堂经理' : '运营主管'}）处理`,
                  },
                ],
              }
            : c,
        ),
      );
    },
    [currentUser, users],
  );

  const updateComplaintStatus = useCallback(
    (complaintId: string, status: ComplaintStatus, content: string) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status,
                timeline: [
                  ...c.timeline,
                  {
                    id: uid('e_'),
                    complaintId,
                    type: 'update',
                    createdAt: now(),
                    operatorId: currentUser.id,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    content,
                  },
                ],
              }
            : c,
        ),
      );
    },
    [currentUser],
  );

  const escalateComplaint = useCallback(
    (complaintId: string, reason: string) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status: 'escalated',
                isAbnormal: true,
                abnormalReason: reason,
                timeline: [
                  ...c.timeline,
                  {
                    id: uid('e_'),
                    complaintId,
                    type: 'escalate',
                    createdAt: now(),
                    operatorId: currentUser.id,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    content: `已升级：${reason}`,
                  },
                ],
              }
            : c,
        ),
      );
      const cp = complaints.find((c) => c.id === complaintId);
      addNotification({
        type: 'danger',
        title: '投诉已升级',
        message: `投诉 ${cp?.code ?? complaintId} 已升级：${reason}`,
        linkTo: `/complaints/${complaintId}`,
      });
    },
    [currentUser, complaints, addNotification],
  );

  const rejectComplaint = useCallback(
    (complaintId: string, reason: string) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status: 'rejected',
                isAbnormal: true,
                abnormalReason: reason,
                timeline: [
                  ...c.timeline,
                  {
                    id: uid('e_'),
                    complaintId,
                    type: 'reject',
                    createdAt: now(),
                    operatorId: currentUser.id,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    content: `退回：${reason}`,
                  },
                ],
              }
            : c,
        ),
      );
      const cp = complaints.find((c) => c.id === complaintId);
      addNotification({
        type: 'warning',
        title: '投诉材料被退回',
        message: `投诉 ${cp?.code ?? complaintId} 被退回：${reason}`,
        linkTo: `/complaints/${complaintId}`,
      });
    },
    [currentUser, complaints, addNotification],
  );

  const resolveComplaint = useCallback(
    (complaintId: string, resolution: string) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status: 'pending_verification',
                resolution,
                resolvedAt: now(),
                timeline: [
                  ...c.timeline,
                  {
                    id: uid('e_'),
                    complaintId,
                    type: 'resolve',
                    createdAt: now(),
                    operatorId: currentUser.id,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    content: `处理完成，等待回访核实：${resolution}`,
                  },
                ],
              }
            : c,
        ),
      );
    },
    [currentUser],
  );

  const triggerAbnormalSample = useCallback(
    (complaintId: string, rule: string) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                isAbnormal: true,
                abnormalReason: `异常样例触发：${rule}`,
                timeline: [
                  ...c.timeline,
                  {
                    id: uid('e_'),
                    complaintId,
                    type: 'reminder',
                    createdAt: now(),
                    operatorId: 'system',
                    operatorName: '系统',
                    operatorRole: 'supervisor',
                    content: `【异常提醒】触发规则：${rule}`,
                    detail: { rule, abnormal: true },
                  },
                ],
              }
            : c,
        ),
      );
      const cp = complaints.find((c) => c.id === complaintId);
      addNotification({
        type: 'danger',
        title: '异常样例提醒',
        message: `投诉 ${cp?.code ?? complaintId} 触发异常：${rule}`,
        linkTo: `/complaints/${complaintId}`,
      });
    },
    [complaints, addNotification],
  );

  const createVisitFromComplaint = useCallback(
    (complaintId: string, assigneeId: string) => {
      const cp = complaints.find((c) => c.id === complaintId);
      const assignee = users.find((u) => u.id === assigneeId);
      if (!cp || !assignee) throw new Error('invalid data');
      const newVisit: VisitRecord = {
        id: uid('vs_'),
        complaintId: cp.id,
        complaintCode: cp.code,
        complaintTitle: cp.title,
        customer: cp.customer,
        status: 'pending',
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        assigneeRole: assignee.role,
        assignedAt: now(),
        timeline: [
          {
            id: uid('e_'),
            complaintId: cp.id,
            type: 'assign',
            createdAt: now(),
            operatorId: currentUser.id,
            operatorName: currentUser.name,
            operatorRole: currentUser.role,
            content: `回访任务分派给 ${assignee.name}`,
          },
        ],
      };
      setVisits((prev) => [newVisit, ...prev]);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? { ...c, visits: [...c.visits, newVisit.id], currentVisitId: newVisit.id }
            : c,
        ),
      );
      return newVisit;
    },
    [complaints, users, currentUser],
  );

  const updateVisitStatus = useCallback(
    (visitId: string, status: VisitStatus, note?: string) => {
      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId
            ? {
                ...v,
                status,
                startedAt: status === 'in_progress' ? v.startedAt ?? now() : v.startedAt,
                finishedAt:
                  status === 'verified' || status === 'unverified' || status === 'returned'
                    ? now()
                    : v.finishedAt,
                timeline: [
                  ...v.timeline,
                  {
                    id: uid('e_'),
                    complaintId: v.complaintId,
                    type: status === 'in_progress' ? 'visit_start' : 'update',
                    createdAt: now(),
                    operatorId: currentUser.id,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    content: note ?? `回访状态更新`,
                  },
                ],
              }
            : v,
        ),
      );
    },
    [currentUser],
  );

  const submitVisitResult = useCallback(
    (visitId, data) => {
      setVisits((prev) =>
        prev.map((v) => {
          if (v.id !== visitId) return v;
          const newStatus: VisitStatus =
            data.result === 'satisfied' || data.result === 'partially_satisfied'
              ? 'verified'
              : data.result === 'unsatisfied'
                ? 'returned'
                : 'unverified';
          return {
            ...v,
            status: newStatus,
            result: data.result,
            customerFeedback: data.customerFeedback,
            internalNote: data.internalNote,
            visitMethod: data.visitMethod,
            finishedAt: now(),
            needReturn: data.result === 'unsatisfied',
            timeline: [
              ...v.timeline,
              {
                id: uid('e_'),
                complaintId: v.complaintId,
                type: 'visit_result',
                createdAt: now(),
                operatorId: currentUser.id,
                operatorName: currentUser.name,
                operatorRole: currentUser.role,
                content: `回访结果提交：${
                  data.result === 'satisfied'
                    ? '满意'
                    : data.result === 'partially_satisfied'
                      ? '基本满意'
                      : data.result === 'unsatisfied'
                        ? '不满意'
                        : '无法联系'
                }`,
                detail: { result: data.result },
              },
            ],
          };
        }),
      );
    },
    [currentUser],
  ) as AppContextValue['submitVisitResult'];

  const returnVisit = useCallback(
    (visitId: string, reason: string) => {
      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId
            ? {
                ...v,
                status: 'returned',
                needReturn: true,
                returnReason: reason,
                finishedAt: now(),
                timeline: [
                  ...v.timeline,
                  {
                    id: uid('e_'),
                    complaintId: v.complaintId,
                    type: 'return',
                    createdAt: now(),
                    operatorId: currentUser.id,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    content: `退回：${reason}`,
                  },
                ],
              }
            : v,
        ),
      );
      const vs = visits.find((v) => v.id === visitId);
      addNotification({
        type: 'warning',
        title: '回访被退回',
        message: `投诉 ${vs?.complaintCode ?? visitId} 的回访被退回：${reason}`,
        linkTo: `/visits/${visitId}`,
      });
    },
    [currentUser, visits, addNotification],
  );

  const resetAllData = useCallback(() => {
    setComplaints(clone(mockComplaints));
    setVisits(clone(mockVisits));
    setNotifications(clone(mockNotifications));
    addNotification({
      type: 'success',
      title: '数据已重置',
      message: '所有投诉和回访数据已恢复为初始样例',
    });
  }, [addNotification]);

  const value = useMemo<AppContextValue>(
    () => ({
      currentUser,
      users,
      complaints,
      visits,
      notifications,
      switchUser,
      usersByRole,
      getComplaint,
      getVisit,
      registerComplaint,
      assignComplaint,
      updateComplaintStatus,
      escalateComplaint,
      rejectComplaint,
      resolveComplaint,
      addTimelineToComplaint,
      triggerAbnormalSample,
      createVisitFromComplaint,
      updateVisitStatus,
      submitVisitResult,
      returnVisit,
      markNotificationRead,
      addNotification,
      resetAllData,
    }),
    [
      currentUser,
      users,
      complaints,
      visits,
      notifications,
      switchUser,
      usersByRole,
      getComplaint,
      getVisit,
      registerComplaint,
      assignComplaint,
      updateComplaintStatus,
      escalateComplaint,
      rejectComplaint,
      resolveComplaint,
      addTimelineToComplaint,
      triggerAbnormalSample,
      createVisitFromComplaint,
      updateVisitStatus,
      submitVisitResult,
      returnVisit,
      markNotificationRead,
      addNotification,
      resetAllData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { mockCustomers };
