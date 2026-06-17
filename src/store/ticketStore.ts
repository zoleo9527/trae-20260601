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
    createReleaseRecord: (record: Omit<ReleaseRecord, 'record_id' | 'created_at'>, ticket: Ticket) => void;
    approveRecord: (recordId: string, approver: string) => void;
    rejectRecord: (recordId: string, approver: string) => void;
    updateCSRemarks: (recordId: string, remarks: string, csName: string) => void;
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
    
    createReleaseRecord: (record, ticket) => {
        const newRecord: ReleaseRecord = {
            ...record,
            ticket_id: ticket.ticket_id,
            ticket_type: ticket.ticket_type,
            channel: ticket.channel,
            visitor_name: ticket.visitor_name,
            visitor_id: ticket.visitor_id,
            cs_remarks: '',
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
    
    updateCSRemarks: (recordId, remarks, csName) => {
        set((state) => ({
            records: state.records.map(r => 
                r.record_id === recordId 
                    ? { ...r, cs_remarks: `${csName}: ${remarks}` }
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