import { create } from "zustand";
import type { LiveReview, ReviewFilters, AbnormalOrder, OperationLog, UserRole } from "@/types";
import { createMockReviews } from "@/utils/mock";

interface ReviewState {
  reviews: LiveReview[];
  currentReview: LiveReview | null;
  currentOrder: AbnormalOrder | null;
  filters: ReviewFilters;
  loading: boolean;
  fetchReviews: () => void;
  fetchReviewById: (id: string) => void;
  fetchOrderById: (reviewId: string, orderId: string) => void;
  setFilters: (filters: Partial<ReviewFilters>) => void;
  resetFilters: () => void;
  submitReview: (id: string) => void;
  rejectReview: (id: string, reason: string) => void;
  confirmReview: (id: string) => void;
  supplementReview: (id: string, data: Partial<LiveReview>) => void;
  transferToAftersales: (id: string) => void;
  processOrder: (reviewId: string, orderId: string, result: string) => void;
  rejectOrder: (reviewId: string, orderId: string, reason: string) => void;
  confirmOrder: (reviewId: string, orderId: string) => void;
  supplementOrder: (reviewId: string, orderId: string, notes: string) => void;
  closeReview: (id: string) => boolean;
  canCloseReview: (id: string) => boolean;
  getFilteredReviews: () => LiveReview[];
  getTodayPending: (userRole?: UserRole) => LiveReview[];
  getOverdue: (userRole?: UserRole) => LiveReview[];
  getRecentlyRejected: (userRole?: UserRole) => LiveReview[];
  getAllLogs: () => OperationLog[];
}

const STORAGE_KEY = "live_review_data";

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isRecentlyRejected(review: LiveReview): boolean {
  return review.status === "rejected" || !!review.supplementRequired;
}

function loadFromStorage(): LiveReview[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load from storage", e);
  }
  const mockData = createMockReviews();
  saveToStorage(mockData);
  return mockData;
}

function saveToStorage(reviews: LiveReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error("Failed to save to storage", e);
  }
}

function addLog(
  logs: OperationLog[],
  targetId: string,
  targetType: "review" | "order",
  operator: string,
  operatorRole: UserRole,
  operationType: OperationLog["operationType"],
  operationDesc: string
): OperationLog[] {
  return [
    ...logs,
    {
      id: Math.random().toString(36).substring(2, 15),
      targetId,
      targetType,
      operator,
      operatorRole,
      operationType,
      operationDesc,
      createdAt: new Date().toISOString(),
    },
  ];
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  currentReview: null,
  currentOrder: null,
  filters: {},
  loading: false,

  fetchReviews: () => {
    set({ reviews: loadFromStorage(), loading: false });
  },

  fetchReviewById: (id: string) => {
    const reviews = get().reviews.length > 0 ? get().reviews : loadFromStorage();
    const review = reviews.find((r) => r.id === id) || null;
    set({ currentReview: review });
  },

  fetchOrderById: (reviewId: string, orderId: string) => {
    const reviews = get().reviews.length > 0 ? get().reviews : loadFromStorage();
    const review = reviews.find((r) => r.id === reviewId);
    const order = review?.abnormalOrders.find((o) => o.id === orderId) || null;
    set({ currentOrder: order, currentReview: review || null });
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => {
    set({ filters: {} });
  },

  submitReview: (id: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === id) {
          const updated: LiveReview = {
            ...r,
            status: "pending",
            currentHandler: "controller",
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              id,
              "review",
              r.assistantName,
              "assistant",
              "submit",
              "提交场控审核"
            ),
          };
          return updated;
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  rejectReview: (id: string, reason: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === id) {
          const updated: LiveReview = {
            ...r,
            status: "rejected",
            currentHandler: "assistant",
            rejectReason: reason,
            supplementRequired: true,
            supplementNotes: reason,
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              id,
              "review",
              "场控A",
              "controller",
              "reject",
              `驳回复盘单：${reason}`
            ),
          };
          return updated;
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  confirmReview: (id: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === id) {
          const updatedOrders = r.abnormalOrders.map((o) => ({
            ...o,
            status: "confirmed" as const,
            operationLogs: addLog(
              o.operationLogs,
              o.id,
              "order",
              "场控A",
              "controller",
              "confirm",
              "场控确认异常订单"
            ),
          }));
          const updated: LiveReview = {
            ...r,
            status: "confirmed",
            currentHandler: "aftersales",
            rejectReason: undefined,
            supplementRequired: false,
            supplementNotes: undefined,
            abnormalOrders: updatedOrders,
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              id,
              "review",
              "场控A",
              "controller",
              "confirm",
              "确认异常，流转至售后组长"
            ),
          };
          return updated;
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  supplementReview: (id: string, data: Partial<LiveReview>) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === id) {
          const updated: LiveReview = {
            ...r,
            ...data,
            status: "pending",
            currentHandler: "controller",
            supplementRequired: false,
            rejectReason: undefined,
            supplementNotes: undefined,
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              id,
              "review",
              r.assistantName,
              "assistant",
              "supplement",
              "补充信息后重新提交审核"
            ),
          };
          return updated;
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  transferToAftersales: (id: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === id) {
          const updated: LiveReview = {
            ...r,
            status: "processing",
            currentHandler: "aftersales",
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              id,
              "review",
              "张组长",
              "aftersales",
              "transfer",
              "售后组长已接收处理"
            ),
          };
          return updated;
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  processOrder: (reviewId: string, orderId: string, result: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === reviewId) {
          const updatedOrders = r.abnormalOrders.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: "resolved" as const,
                processResult: result,
                updatedAt: new Date().toISOString(),
                operationLogs: addLog(
                  o.operationLogs,
                  o.id,
                  "order",
                  "张组长",
                  "aftersales",
                  "process",
                  `处理完成：${result}`
                ),
              };
            }
            return o;
          });
          const allResolved = updatedOrders.every((o) => o.status === "resolved");
          return {
            ...r,
            abnormalOrders: updatedOrders,
            status: allResolved ? ("closed" as const) : r.status,
            updatedAt: new Date().toISOString(),
            operationLogs: allResolved
              ? addLog(
                  r.operationLogs,
                  r.id,
                  "review",
                  "张组长",
                  "aftersales",
                  "close",
                  "所有异常订单处理完成，自动关闭复盘单"
                )
              : r.operationLogs,
          };
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  rejectOrder: (reviewId: string, orderId: string, reason: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === reviewId) {
          const updatedOrders = r.abnormalOrders.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: "rejected" as const,
                rejectReason: reason,
                supplementRequired: true,
                supplementNotes: reason,
                updatedAt: new Date().toISOString(),
                operationLogs: addLog(
                  o.operationLogs,
                  o.id,
                  "order",
                  "场控A",
                  "controller",
                  "reject",
                  `驳回：${reason}`
                ),
              };
            }
            return o;
          });
          return {
            ...r,
            status: "rejected" as const,
            currentHandler: "assistant" as const,
            rejectReason: reason,
            supplementRequired: true,
            supplementNotes: reason,
            abnormalOrders: updatedOrders,
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              r.id,
              "review",
              "场控A",
              "controller",
              "reject",
              `异常订单被驳回，退回主播助理补录：${reason}`
            ),
          };
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  confirmOrder: (reviewId: string, orderId: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === reviewId) {
          const updatedOrders = r.abnormalOrders.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: "confirmed" as const,
                rejectReason: undefined,
                supplementRequired: false,
                supplementNotes: undefined,
                updatedAt: new Date().toISOString(),
                operationLogs: addLog(
                  o.operationLogs,
                  o.id,
                  "order",
                  "场控A",
                  "controller",
                  "confirm",
                  "确认异常订单"
                ),
              };
            }
            return o;
          });
          const allOrdersConfirmed = updatedOrders.every(
            (o) => o.status === "confirmed" || o.status === "resolved"
          );
          return {
            ...r,
            status: allOrdersConfirmed ? ("confirmed" as const) : r.status,
            currentHandler: allOrdersConfirmed ? ("aftersales" as const) : r.currentHandler,
            rejectReason: allOrdersConfirmed ? undefined : r.rejectReason,
            supplementRequired: allOrdersConfirmed ? false : r.supplementRequired,
            supplementNotes: allOrdersConfirmed ? undefined : r.supplementNotes,
            abnormalOrders: updatedOrders,
            updatedAt: new Date().toISOString(),
            operationLogs: allOrdersConfirmed
              ? addLog(
                  r.operationLogs,
                  r.id,
                  "review",
                  "场控A",
                  "controller",
                  "confirm",
                  "所有异常订单已确认，流转至售后组长"
                )
              : r.operationLogs,
          };
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  supplementOrder: (reviewId: string, orderId: string, notes: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === reviewId) {
          const updatedOrders = r.abnormalOrders.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: "pending" as const,
                supplementRequired: false,
                rejectReason: undefined,
                supplementNotes: undefined,
                updatedAt: new Date().toISOString(),
                operationLogs: addLog(
                  o.operationLogs,
                  o.id,
                  "order",
                  "小王",
                  "assistant",
                  "supplement",
                  `补充信息：${notes}`
                ),
              };
            }
            return o;
          });
          const hasRejectedOrder = updatedOrders.some(
            (o) => o.status === "rejected" || o.supplementRequired
          );
          return {
            ...r,
            status: hasRejectedOrder ? r.status : ("pending" as const),
            currentHandler: hasRejectedOrder ? r.currentHandler : ("controller" as const),
            rejectReason: hasRejectedOrder ? r.rejectReason : undefined,
            supplementRequired: hasRejectedOrder,
            supplementNotes: hasRejectedOrder ? r.supplementNotes : undefined,
            abnormalOrders: updatedOrders,
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              r.id,
              "review",
              "小王",
              "assistant",
              "supplement",
              `补充异常订单信息后重新提交审核`
            ),
          };
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  canCloseReview: (id: string) => {
    const review = get().reviews.find((r) => r.id === id);
    if (!review) return false;
    return review.abnormalOrders.every((o) => o.status === "resolved");
  },

  closeReview: (id: string) => {
    if (!get().canCloseReview(id)) {
      return false;
    }
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === id) {
          const allResolved = r.abnormalOrders.every(
            (o) => o.status === "resolved"
          );
          if (!allResolved) return r;
          const updated: LiveReview = {
            ...r,
            status: "closed",
            updatedAt: new Date().toISOString(),
            operationLogs: addLog(
              r.operationLogs,
              id,
              "review",
              "张组长",
              "aftersales",
              "close",
              "手动关闭复盘单"
            ),
          };
          return updated;
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
    return true;
  },

  getFilteredReviews: () => {
    const { reviews, filters } = get();
    return reviews.filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !r.sessionNo.toLowerCase().includes(kw) &&
          !r.liveTitle.toLowerCase().includes(kw) &&
          !r.anchorName.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (filters.anchorName && r.anchorName !== filters.anchorName) return false;
      if (filters.currentHandler && r.currentHandler !== filters.currentHandler) return false;
      if (filters.isOverdue && !r.isOverdue) return false;
      if (filters.todayUpdated && !isToday(r.updatedAt)) return false;
      if (filters.recentlyRejected && !isRecentlyRejected(r)) return false;
      return true;
    });
  },

  getTodayPending: (userRole?: UserRole) => {
    const { reviews } = get();
    return reviews.filter((r) => {
      if (r.status === "closed" || r.status === "draft") return false;
      if (!isToday(r.updatedAt)) return false;
      if (userRole && r.currentHandler !== userRole) return false;
      return true;
    });
  },

  getOverdue: (userRole?: UserRole) => {
    const { reviews } = get();
    return reviews.filter((r) => {
      if (!r.isOverdue || r.status === "closed") return false;
      if (userRole && r.currentHandler !== userRole) return false;
      return true;
    });
  },

  getRecentlyRejected: (userRole?: UserRole) => {
    const { reviews } = get();
    return reviews.filter((r) => {
      if (!isRecentlyRejected(r)) return false;
      if (userRole && r.currentHandler !== userRole) return false;
      return true;
    });
  },

  getAllLogs: () => {
    const { reviews } = get();
    const allLogs: OperationLog[] = [];
    reviews.forEach((r) => {
      allLogs.push(...r.operationLogs);
      r.abnormalOrders.forEach((o) => {
        allLogs.push(...o.operationLogs);
      });
    });
    return allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
