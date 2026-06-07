import { create } from 'zustand';
import { Order, RefundRecord, Role, StoreState, StoreActions } from './types';
import { mockMembers, mockRooms, mockDrinks, mockOrders, abnormalOrders } from './mockData';
import dayjs from 'dayjs';

const userNames: Record<Role, string> = {
  reception: '前台小王',
  handler: '处理员小张',
  manager: '店长陈经理',
};

const generateOrderNo = () => {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `KTV${date}${random}`;
};

const initialOrders: Order[] = [...mockOrders, ...abnormalOrders];

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  currentRole: 'reception',
  currentUser: userNames.reception,
  members: mockMembers,
  rooms: mockRooms,
  drinks: mockDrinks,
  orders: initialOrders,

  setRole: (role: Role) => {
    set({
      currentRole: role,
      currentUser: userNames[role],
    });
  },

  createOrder: (order) => {
    const newOrder: Order = {
      ...order,
      id: 'o' + Date.now(),
      orderNo: generateOrderNo(),
      status: 'consuming',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      items: [],
      drinksFee: 0,
      complimentaryFee: 0,
      totalAmount: 0,
      useBalance: 0,
      payAmount: 0,
    };
    set((state) => ({
      orders: [...state.orders, newOrder],
      rooms: state.rooms.map((r) =>
        r.id === order.roomId ? { ...r, status: 'occupied' as const } : r
      ),
    }));
  },

  updateOrder: (orderId, updates) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o
      ),
    }));
  },

  completeConsume: (orderId, data) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;

    set((state) => {
      const updatedOrders = state.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            ...data,
            status: 'completed' as const,
          };
        }
        return o;
      });

      const updatedMembers = data.useBalance > 0 && order.memberId
        ? state.members.map((m) =>
            m.id === order.memberId
              ? { ...m, balance: Math.max(0, m.balance - data.useBalance) }
              : m
          )
        : state.members;

      const updatedRooms = state.rooms.map((r) =>
        r.id === order.roomId ? { ...r, status: 'available' as const } : r
      );

      return {
        orders: updatedOrders,
        members: updatedMembers,
        rooms: updatedRooms,
      };
    });
  },

  reportAbnormal: (orderId, abnormal) => {
    const { currentUser } = get();
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'abnormal' as const,
            abnormalRecord: {
              id: 'a' + Date.now(),
              orderId,
              ...abnormal,
              reportedBy: currentUser,
              reportedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            },
          };
        }
        return o;
      }),
    }));
  },

  handleAbnormal: (orderId, data) => {
    const { currentUser } = get();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    set((state) => {
      let newStatus: Order['status'] = 'abnormal';
      let refundRecord = undefined;
      let refundHistoryUpdate: RefundRecord[] | undefined;

      if (data.needRefund && data.refundAmount && data.refundReason) {
        newStatus = 'refunding';
        const order = state.orders.find(o => o.id === orderId);
        refundRecord = {
          id: 'rf' + Date.now(),
          orderId,
          orderNo: order?.orderNo,
          memberName: order?.memberName || '散客',
          amount: data.refundAmount,
          reason: data.refundReason,
          applicant: currentUser,
          appliedAt: now,
          status: 'pending' as const,
        };
        refundHistoryUpdate = [...(order?.refundHistory || []), refundRecord];
      } else {
        newStatus = 'completed';
      }

      return {
        orders: state.orders.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              status: newStatus,
              handlerNote: data.handlerNote,
              handledBy: currentUser,
              handledAt: now,
              abnormalRecord: o.abnormalRecord
                ? {
                    ...o.abnormalRecord,
                    handlerNote: data.handlerNote,
                    handledAt: now,
                    handledBy: currentUser,
                  }
                : undefined,
              refundRecord,
              ...(refundHistoryUpdate ? { refundHistory: refundHistoryUpdate } : {}),
            };
          }
          return o;
        }),
      };
    });
  },

  applyRefund: (orderId, data) => {
    const { currentUser } = get();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id === orderId) {
          const newRecord: RefundRecord = {
            id: 'rf' + Date.now(),
            orderId,
            orderNo: o.orderNo,
            memberName: o.memberName || '散客',
            amount: data.amount,
            reason: data.reason,
            applicant: currentUser,
            appliedAt: now,
            status: 'pending' as const,
          };
          return {
            ...o,
            status: 'refunding' as const,
            refundRecord: newRecord,
            refundHistory: [...(o.refundHistory || []), newRecord],
          };
        }
        return o;
      }),
    }));
  },

  reviewRefund: (refundId, data) => {
    const { currentUser } = get();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    set((state) => {
      const order = state.orders.find((o) => o.refundRecord?.id === refundId);
      if (!order) return state;

      let newStatus: Order['status'];
      let refundStatus: 'approved' | 'rejected';

      if (data.approved) {
        newStatus = 'refunded';
        refundStatus = 'approved';
      } else if (data.returnToHandler) {
        newStatus = 'refund_rejected';
        refundStatus = 'rejected';
      } else {
        newStatus = 'rejected';
        refundStatus = 'rejected';
      }

      let updatedMembers = state.members;
      if (data.approved && order.memberId && order.refundRecord) {
        updatedMembers = state.members.map((m) =>
          m.id === order.memberId
            ? { ...m, balance: m.balance + order.refundRecord!.amount }
            : m
        );
      }

      const reviewedRecord: RefundRecord = {
        ...order.refundRecord!,
        status: refundStatus,
        managerNote: data.managerNote,
        reviewedAt: now,
        reviewedBy: currentUser,
        returnToHandler: data.returnToHandler,
        orderNo: order.orderNo,
        memberName: order.memberName || '散客',
      };

      return {
        orders: state.orders.map((o) => {
          if (o.refundRecord?.id === refundId) {
            return {
              ...o,
              status: newStatus,
              refundRecord: reviewedRecord,
              refundHistory: [...(o.refundHistory || []), reviewedRecord],
            };
          }
          return o;
        }),
        members: updatedMembers,
      };
    });
  },

  resubmitRefund: (orderId, data) => {
    const { currentUser } = get();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id === orderId) {
          const newRecord: RefundRecord = {
            id: 'rf' + Date.now(),
            orderId,
            orderNo: o.orderNo,
            memberName: o.memberName || '散客',
            amount: data.amount,
            reason: data.reason,
            applicant: currentUser,
            appliedAt: now,
            status: 'pending' as const,
          };
          return {
            ...o,
            status: 'refunding' as const,
            handlerNote: data.handlerNote,
            handledBy: currentUser,
            handledAt: now,
            refundRecord: newRecord,
            refundHistory: [...(o.refundHistory || []), newRecord],
          };
        }
        return o;
      }),
    }));
  },

  addMemberBalance: (memberId, amount) => {
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              balance: m.balance + amount,
              totalRecharge: m.totalRecharge + amount,
            }
          : m
      ),
    }));
  },
}));
