import { create } from "zustand";
import type { UserRole, Verification, Complaint, ActivityItem } from "@/types";
import { mockVerifications, mockComplaints, mockActivities, getRoleTodos, getRoleRisks } from "@/data/mockData";

interface TodoItem {
  id: string;
  type: "verification" | "complaint" | "visit";
  relatedId: string;
  complaintStatus?: "pending" | "processing" | "to_visit" | "completed" | "escalated";
}

interface AppState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  verifications: Verification[];
  complaints: Complaint[];
  activities: ActivityItem[];
  getTodos: () => ReturnType<typeof getRoleTodos>;
  getRisks: () => ReturnType<typeof getRoleRisks>;
  updateComplaintStatus: (id: string, status: Complaint["status"], operator?: string) => void;
  addVisitLog: (complaintId: string, log: Omit<Complaint["visitLogs"][number], "id" | "complaintId">) => void;
  createComplaint: (data: Omit<Complaint, "id" | "visitLogs" | "createTime" | "status" | "handler"> & { verificationId: string }) => string;
  batchUpdateComplaintStatus: (ids: string[], status: Complaint["status"]) => void;
  updateKitchenNote: (id: string, note: string) => void;

  todoSelectedIds: Set<string>;
  toggleTodoSelected: (id: string) => void;
  clearTodoSelected: () => void;
  selectAllTodo: (ids: string[]) => void;

  verificationSelectedIds: Set<string>;
  toggleVerificationSelected: (id: string) => void;
  clearVerificationSelected: () => void;
  selectAllVerification: (ids: string[]) => void;

  complaintSelectedIds: Set<string>;
  toggleComplaintSelected: (id: string) => void;
  clearComplaintSelected: () => void;
  selectAllComplaint: (ids: string[]) => void;

  batchProcessTodos: (todos: TodoItem[]) => void;
}

function generateId(prefix: string) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}${date}${rand}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: "floor_manager",
  setCurrentRole: (role) => set({
    currentRole: role,
    todoSelectedIds: new Set(),
    verificationSelectedIds: new Set(),
    complaintSelectedIds: new Set(),
  }),
  verifications: mockVerifications,
  complaints: mockComplaints,
  activities: mockActivities,
  getTodos: () => getRoleTodos(get().currentRole, get().verifications, get().complaints),
  getRisks: () => getRoleRisks(get().currentRole, get().verifications, get().complaints),

  createComplaint: (data) => {
    const id = generateId("TS");
    const roleName = { cashier: "收银", kitchen_lead: "后厨主管", floor_manager: "前厅经理" }[get().currentRole];
    const handlerName = get().currentRole === "floor_manager" ? "陈静" : get().currentRole === "kitchen_lead" ? "赵刚" : "张婷";
    const newComplaint: Complaint = {
      id,
      status: "pending",
      createTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      handler: `${roleName}-${handlerName}`,
      visitLogs: [],
      ...data,
    };
    set((state) => ({
      complaints: [newComplaint, ...state.complaints],
      verifications: state.verifications.map((v) =>
        v.id === data.verificationId ? { ...v, complaintId: id } : v
      ),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: handlerName,
          role: get().currentRole,
          action: "发起了客诉",
          target: id,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
    return id;
  },

  updateComplaintStatus: (id, status, operator) => {
    const opName = operator || (get().currentRole === "floor_manager" ? "陈静" : get().currentRole === "kitchen_lead" ? "赵刚" : "张婷");
    const statusLabel: Record<string, string> = {
      pending: "受理",
      processing: "开始处理",
      to_visit: "标记待回访",
      completed: "完成回访",
      escalated: "升级处理",
    };
    set((state) => ({
      complaints: state.complaints.map((c) => (c.id === id ? { ...c, status } : c)),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: opName,
          role: get().currentRole,
          action: `${statusLabel[status] || "更新状态"}了客诉`,
          target: id,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },

  addVisitLog: (complaintId, log) => {
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              visitLogs: [
                ...c.visitLogs,
                { ...log, id: `HF${Date.now()}`, complaintId },
              ],
            }
          : c
      ),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: log.visitor,
          role: get().currentRole,
          action: "添加了回访记录",
          target: complaintId,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },

  batchUpdateComplaintStatus: (ids, status) => {
    const opName = get().currentRole === "floor_manager" ? "陈静" : get().currentRole === "kitchen_lead" ? "赵刚" : "张婷";
    const statusLabel: Record<string, string> = {
      pending: "受理",
      processing: "开始处理",
      to_visit: "标记待回访",
      completed: "完成回访",
      escalated: "升级处理",
    };
    set((state) => ({
      complaints: state.complaints.map((c) =>
        ids.includes(c.id) ? { ...c, status } : c
      ),
      complaintSelectedIds: new Set(),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: opName,
          role: get().currentRole,
          action: `批量${statusLabel[status] || "更新状态"}了${ids.length}条客诉`,
          target: ids.join(","),
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },

  updateKitchenNote: (id, note) => {
    const opName = get().currentRole === "floor_manager" ? "陈静" : get().currentRole === "kitchen_lead" ? "赵刚" : "张婷";
    set((state) => ({
      complaints: state.complaints.map((c) => (c.id === id ? { ...c, kitchenNote: note } : c)),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: opName,
          role: get().currentRole,
          action: "录入了后厨处理说明",
          target: id,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },

  todoSelectedIds: new Set(),
  toggleTodoSelected: (id) =>
    set((state) => {
      const next = new Set(state.todoSelectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { todoSelectedIds: next };
    }),
  clearTodoSelected: () => set({ todoSelectedIds: new Set() }),
  selectAllTodo: (ids) => set({ todoSelectedIds: new Set(ids) }),

  verificationSelectedIds: new Set(),
  toggleVerificationSelected: (id) =>
    set((state) => {
      const next = new Set(state.verificationSelectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { verificationSelectedIds: next };
    }),
  clearVerificationSelected: () => set({ verificationSelectedIds: new Set() }),
  selectAllVerification: (ids) => set({ verificationSelectedIds: new Set(ids) }),

  complaintSelectedIds: new Set(),
  toggleComplaintSelected: (id) =>
    set((state) => {
      const next = new Set(state.complaintSelectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { complaintSelectedIds: next };
    }),
  clearComplaintSelected: () => set({ complaintSelectedIds: new Set() }),
  selectAllComplaint: (ids) => set({ complaintSelectedIds: new Set(ids) }),

  batchProcessTodos: (todos) => {
    const opName = get().currentRole === "floor_manager" ? "陈静" : get().currentRole === "kitchen_lead" ? "赵刚" : "张婷";
    const { verifications } = get();

    const complaintUpdates: Map<string, Complaint["status"]> = new Map();
    const verificationUpdates: Set<string> = new Set();

    for (const todo of todos) {
      if (todo.type === "complaint" || todo.type === "visit") {
        const currentStatus = todo.complaintStatus;
        let nextStatus: Complaint["status"] | null = null;

        if (todo.type === "visit") {
          nextStatus = "completed";
        } else if (currentStatus === "pending") {
          nextStatus = "processing";
        } else if (currentStatus === "processing") {
          nextStatus = "to_visit";
        } else if (currentStatus === "to_visit") {
          nextStatus = "completed";
        } else if (currentStatus === "escalated") {
          nextStatus = "to_visit";
        }

        if (nextStatus) {
          complaintUpdates.set(todo.relatedId, nextStatus);
        }
      } else if (todo.type === "verification") {
        const v = verifications.find((ver) => ver.id === todo.relatedId);
        if (v && v.status === "abnormal") {
          verificationUpdates.add(todo.relatedId);
        }
      }
    }

    set((state) => ({
      complaints: state.complaints.map((c) =>
        complaintUpdates.has(c.id) ? { ...c, status: complaintUpdates.get(c.id)! } : c
      ),
      verifications: state.verifications.map((v) =>
        verificationUpdates.has(v.id) ? { ...v, status: "normal" as const } : v
      ),
      todoSelectedIds: new Set(),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: opName,
          role: get().currentRole,
          action: `批量处理了${todos.length}条待办事项`,
          target: todos.map((t) => t.id).join(","),
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },
}));
