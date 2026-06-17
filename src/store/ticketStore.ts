import { create } from 'zustand';
import { Ticket, ReleaseRecord, User } from '../types';
import { mockTickets, mockRecords, mockUsers } from '../data/mockData';

interface TicketStore {
    tickets: Ticket[];
    records: ReleaseRecord[];
    users: User[];
    currentUser: User | null;
    selectedTicket: Ticket | null;
    searchTicket: (ticketId: string) => Ticket | undefined;
    createReleaseRecord: (record: Omit<ReleaseRecord, 'record_id' | 'created_at'>) => void;
    approveRecord: (recordId: string, approver: string) => void;
    rejectRecord: (recordId: string, approver: string) => void;
    setCurrentUser: (user: User) => void;
    setSelectedTicket: (ticket: Ticket | null) => void;
}

const generateRecordId = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `RR${dateStr}${timeStr}`;
};

export const useTicketStore = create<TicketStore>((set) => ({
    tickets: mockTickets,
    records: mockRecords,
    users: mockUsers,
    currentUser: mockUsers[0],
    selectedTicket: null,
    
    searchTicket: (ticketId) => {
        return mockTickets.find(t => t.ticket_id === ticketId);
    },
    
    createReleaseRecord: (record) => {
        const newRecord: ReleaseRecord = {
            ...record,
            record_id: generateRecordId(),
            created_at: new Date().toLocaleString('zh-CN')
        };
        set((state) => ({ records: [...state.records, newRecord] }));
    },
    
    approveRecord: (recordId, approver) => {
        set((state) => ({
            records: state.records.map(r => 
                r.record_id === recordId 
                    ? { ...r, status: 'approved' as const, approver }
                    : r
            )
        }));
    },
    
    rejectRecord: (recordId, approver) => {
        set((state) => ({
            records: state.records.map(r => 
                r.record_id === recordId 
                    ? { ...r, status: 'rejected' as const, approver }
                    : r
            )
        }));
    },
    
    setCurrentUser: (user) => {
        set({ currentUser: user });
    },
    
    setSelectedTicket: (ticket) => {
        set({ selectedTicket: ticket });
    }
}));