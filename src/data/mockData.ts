import { Ticket, ReleaseRecord, ExceptionOption, User } from '../types';

export const exceptionTypes: ExceptionOption[] = [
    { value: 'expired', label: '套票过期', color: 'red' },
    { value: 'team_mismatch', label: '团队票名单不符', color: 'orange' },
    { value: 'gate_offline', label: '闸机离线', color: 'yellow' },
    { value: 'id_verify_fail', label: '证件核验失败', color: 'blue' }
];

export const ticketTypes = ['成人票', '儿童票', '老人票', '家庭套票', '团队票'];

export const channels = ['官网', 'OTA', '现场', '旅行社'];

export const releaseReasons = [
    '系统故障导致无法正常检票',
    '游客特殊情况需紧急放行',
    '票务系统升级影响',
    '其他合理原因'
];

export const mockTickets: Ticket[] = [
    {
        ticket_id: 'TK202401010001',
        ticket_type: '家庭套票',
        channel: '官网',
        visitor_name: '张三',
        visitor_id: '110101199001011234',
        valid_from: '2024-01-01',
        valid_to: '2024-01-02',
        status: 'expired'
    },
    {
        ticket_id: 'TK202401010002',
        ticket_type: '团队票',
        channel: '旅行社',
        visitor_name: '李四',
        visitor_id: '320101198506065678',
        valid_from: '2024-01-15',
        valid_to: '2024-01-15',
        status: 'valid'
    },
    {
        ticket_id: 'TK202401010003',
        ticket_type: '老人票',
        channel: 'OTA',
        visitor_name: '王五',
        visitor_id: '110101194512123456',
        valid_from: '2024-01-15',
        valid_to: '2024-01-15',
        status: 'valid'
    },
    {
        ticket_id: 'TK202401010004',
        ticket_type: '成人票',
        channel: '现场',
        visitor_name: '赵六',
        visitor_id: '440301199203037890',
        valid_from: '2024-01-15',
        valid_to: '2024-01-15',
        status: 'valid'
    },
    {
        ticket_id: 'TK202401010005',
        ticket_type: '儿童票',
        channel: '官网',
        visitor_name: '小明',
        visitor_id: '110101201505051234',
        valid_from: '2024-01-15',
        valid_to: '2024-01-15',
        status: 'valid'
    }
];

export const mockRecords: ReleaseRecord[] = [
    {
        record_id: 'RR202401150001',
        ticket_id: 'TK202401010001',
        ticket_type: '家庭套票',
        channel: '官网',
        visitor_name: '张三',
        visitor_id: '110101199001011234',
        exception_type: 'expired',
        release_reason: '系统故障导致无法正常检票',
        approver: '李主管',
        checker: '张检票员',
        remarks: '游客持过期套票，经主管批准放行',
        cs_remarks: '已联系游客办理延期，游客表示满意',
        created_at: '2024-01-15 09:30:00',
        status: 'approved'
    },
    {
        record_id: 'RR202401150002',
        ticket_id: 'TK202401010002',
        ticket_type: '团队票',
        channel: '旅行社',
        visitor_name: '李四',
        visitor_id: '320101198506065678',
        exception_type: 'team_mismatch',
        release_reason: '游客特殊情况需紧急放行',
        approver: '',
        checker: '王检票员',
        remarks: '团队票名单不符，等待主管审批',
        cs_remarks: '',
        created_at: '2024-01-15 10:15:00',
        status: 'pending'
    },
    {
        record_id: 'RR202401150003',
        ticket_id: 'TK202401010003',
        ticket_type: '老人票',
        channel: 'OTA',
        visitor_name: '王五',
        visitor_id: '110101194512123456',
        exception_type: 'id_verify_fail',
        release_reason: '系统故障导致无法正常检票',
        approver: '李主管',
        checker: '张检票员',
        remarks: '老人证件核验失败，人工确认后放行',
        cs_remarks: '',
        created_at: '2024-01-15 11:00:00',
        status: 'approved'
    },
    {
        record_id: 'RR202401150004',
        ticket_id: 'TK202401010004',
        ticket_type: '成人票',
        channel: '现场',
        visitor_name: '赵六',
        visitor_id: '440301199203037890',
        exception_type: 'gate_offline',
        release_reason: '票务系统升级影响',
        approver: '',
        checker: '王检票员',
        remarks: '闸机离线，手动记录放行',
        cs_remarks: '',
        created_at: '2024-01-15 14:20:00',
        status: 'approved'
    }
];

export const mockUsers: User[] = [
    { id: 'U001', name: '张检票员', role: 'checker' },
    { id: 'U002', name: '王检票员', role: 'checker' },
    { id: 'U003', name: '李主管', role: 'supervisor' },
    { id: 'U004', name: '陈客服', role: 'customer_service' }
];

export const getExceptionLabel = (value: string): string => {
    const exception = exceptionTypes.find(e => e.value === value);
    return exception ? exception.label : value;
};

export const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝'
    };
    return statusMap[status] || status;
};