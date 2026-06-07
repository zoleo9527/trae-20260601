import { create } from 'zustand';
import { Member, Transaction, TransactionType } from '../types';
import { storage, generateId } from '../utils/storage';
import { mockMembers, mockTransactions } from '../data/mockData';
import { useAuditStore } from './auditStore';
import { useAuthStore } from './authStore';

interface MemberStore {
  members: Member[];
  transactions: Transaction[];
  addMember: (member: Omit<Member, 'id' | 'totalSpent' | 'createdAt'>) => string;
  updateMember: (id: string, updates: Partial<Member>) => void;
  addTransaction: (
    memberId: string,
    type: TransactionType,
    amount: number,
    relatedBookingId?: string,
    note?: string
  ) => string;
  getMemberById: (id: string) => Member | undefined;
  getMemberByPhone: (phone: string) => Member | undefined;
  getTransactionsByMember: (memberId: string) => Transaction[];
  calculateBalance: (memberId: string) => number;
  checkBalanceConsistency: (memberId: string) => { consistent: boolean; diff: number };
}

const initialMembers = storage.get<Member[]>('members', mockMembers);
const initialTransactions = storage.get<Transaction[]>('transactions', mockTransactions);

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: initialMembers,
  transactions: initialTransactions,
  
  addMember: (memberData) => {
    const member: Member = {
      ...memberData,
      id: generateId(),
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    const members = [...get().members, member];
    set({ members });
    storage.set('members', members);
    
    useAuditStore.getState().addLog(
      'member',
      member.id,
      'create',
      undefined,
      member as unknown as Record<string, unknown>,
      '新增会员'
    );
    
    return member.id;
  },
  
  updateMember: (id, updates) => {
    const members = get().members.map((m) => {
      if (m.id === id) {
        const updated = { ...m, ...updates };
        
        useAuditStore.getState().addLog(
          'member',
          id,
          'update',
          m as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>
        );
        
        return updated;
      }
      return m;
    });
    set({ members });
    storage.set('members', members);
  },
  
  addTransaction: (memberId, type, amount, relatedBookingId, note) => {
    const member = get().getMemberById(memberId);
    if (!member) throw new Error('会员不存在');

    const currentBalance = member.balance;
    let balanceAfter: number;
    let actualAmount = Math.abs(amount);

    switch (type) {
      case 'recharge':
        balanceAfter = currentBalance + actualAmount;
        break;
      case 'consume':
        balanceAfter = currentBalance - actualAmount;
        break;
      case 'refund':
        balanceAfter = currentBalance + actualAmount;
        break;
      default:
        balanceAfter = currentBalance;
    }

    const transaction: Transaction = {
      id: generateId(),
      memberId,
      type,
      amount: type === 'consume' ? -actualAmount : actualAmount,
      balanceAfter,
      relatedBookingId,
      operator: useAuthStore.getState().currentUser,
      note,
      createdAt: new Date().toISOString(),
    };

    const transactions = [...get().transactions, transaction];
    set({ transactions });
    storage.set('transactions', transactions);

    const newTotalSpent = type === 'consume' ? member.totalSpent + actualAmount : member.totalSpent;
    get().updateMember(memberId, { balance: balanceAfter, totalSpent: newTotalSpent });

    useAuditStore.getState().addLog(
      'transaction',
      transaction.id,
      'create',
      undefined,
      transaction as unknown as Record<string, unknown>,
      note || (type === 'recharge' ? '会员充值' : type === 'consume' ? '会员消费' : '会员退款')
    );

    return transaction.id;
  },
  
  getMemberById: (id) => {
    return get().members.find((m) => m.id === id);
  },
  
  getMemberByPhone: (phone) => {
    return get().members.find((m) => m.phone === phone);
  },
  
  getTransactionsByMember: (memberId) => {
    return get().transactions.filter((t) => t.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  calculateBalance: (memberId) => {
    const transactions = get().getTransactionsByMember(memberId);
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  },
  
  checkBalanceConsistency: (memberId) => {
    const member = get().getMemberById(memberId);
    if (!member) return { consistent: true, diff: 0 };
    
    const calculated = get().calculateBalance(memberId);
    const diff = member.balance - calculated;
    
    return {
      consistent: Math.abs(diff) < 0.01,
      diff,
    };
  },
}));
