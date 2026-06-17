export interface Ticket {
    ticket_id: string;
    ticket_type: string;
    channel: string;
    visitor_name: string;
    visitor_id: string;
    valid_from: string;
    valid_to: string;
    status: string;
}

export interface ReleaseRecord {
    record_id: string;
    ticket_id: string;
    exception_type: string;
    release_reason: string;
    approver: string;
    checker: string;
    remarks: string;
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
}

export type ExceptionType = 'expired' | 'team_mismatch' | 'gate_offline' | 'id_verify_fail';

export interface ExceptionOption {
    value: ExceptionType;
    label: string;
    color: string;
}

export interface User {
    id: string;
    name: string;
    role: 'checker' | 'supervisor' | 'customer_service';
}