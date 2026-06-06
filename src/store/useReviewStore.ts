import { create } from "zustand";
import type { LiveReview, ReviewFilters, AbnormalOrder, OperationLog } from "@/types";
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
  submitReview: (id: string) => void;
  rejectReview: (id: string, reason: string) => void;
  confirmReview: (id: string) => void;
  supplementReview: (id: string, data: Partial<LiveReview>) => void;
  transferToAftersales: (id: string) => void;
  processOrder: (reviewId: string, orderId: string, result: string) => void;
  rejectOrder: (reviewId: string, orderId: string, reason: string) => void;
  confirmOrder: (reviewId: string, orderId: string) => void;
  supplementOrder: (reviewId: string, orderId: string, notes: string) => void;
  closeReview: (id: string) => void;
  getFilteredReviews: () => LiveReview[];
  getTodayPending: () => LiveReview[];
  getOverdue: () => LiveReview[];
  getRecentlyRejected: () => LiveReview[];
  getAllLogs: () => OperationLog[];
}

const STORAGE_KEY = "live_review_data";

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
  operatorRole: "assistant" | "controller" | "aftersales",
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
            abnormalOrders: updatedOrders,
            updatedAt: new Date().toISOString(),
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
          return {
            ...r,
            abnormalOrders: updatedOrders,
            updatedAt: new Date().toISOString(),
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
          return {
            ...r,
            abnormalOrders: updatedOrders,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      saveToStorage(reviews);
      return { reviews };
    });
  },

  closeReview: (id: string) => {
    set((state) => {
      const reviews = state.reviews.map((r) => {
        if (r.id === id) {
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
      if (filters.hasReject && !r.rejectReason) return false;
      if (filters.hasSupplement && !r.supplementRequired) return false;
      if (filters.currentHandler && r.currentHandler !== filters.currentHandler) return false;
      return true;
    });
  },

  getTodayPending: () => {
    const { reviews } = get();
    return reviews.filter((r) => r.status !== "closed" && r.status !== "draft");
  },

  getOverdue: () => {
    const { reviews } = get();
    return reviews.filter((r) => r.isOverdue && r.status !== "closed");
  },

  getRecentlyRejected: () => {
    const { reviews } = get();
    return reviews.filter((r) => r.status === "rejected");
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
