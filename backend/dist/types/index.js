"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signinStatusDisplay = exports.arrangementStatusDisplay = exports.statusDisplay = exports.exceptionTypeNames = exports.roleNames = void 0;
exports.roleNames = {
    project_specialist: '项目专员',
    review_secretary: '评审秘书',
    finance: '财务',
};
exports.exceptionTypeNames = {
    arrangement_timeout: '安排超时',
    expert_absent: '专家缺席',
    expert_late: '专家迟到',
    signin_incomplete: '签到未完成',
    room_conflict: '会议室冲突',
    document_missing: '文件缺失',
    financial_issue: '财务问题',
    other: '其他问题',
};
exports.statusDisplay = {
    draft: { label: '草稿', color: '#8c8c8c' },
    arrangement_pending: { label: '待安排', color: '#faad14' },
    arrangement_reviewing: { label: '安排审核中', color: '#1890ff' },
    arrangement_approved: { label: '安排已通过', color: '#52c41a' },
    arrangement_rejected: { label: '安排已退回', color: '#f5222d' },
    bidding_pending: { label: '待开标', color: '#faad14' },
    bidding_in_progress: { label: '开标中', color: '#1890ff' },
    bidding_completed: { label: '开标完成', color: '#13c2c2' },
    expert_signin_pending: { label: '待专家签到', color: '#faad14' },
    expert_signin_in_progress: { label: '签到进行中', color: '#1890ff' },
    expert_signin_completed: { label: '签到完成', color: '#52c41a' },
    evaluation_in_progress: { label: '评标中', color: '#722ed1' },
    evaluation_completed: { label: '评标完成', color: '#52c41a' },
    archived: { label: '已归档', color: '#8c8c8c' },
};
exports.arrangementStatusDisplay = {
    pending: { label: '待提交', color: '#8c8c8c' },
    reviewing: { label: '审核中', color: '#1890ff' },
    approved: { label: '已通过', color: '#52c41a' },
    rejected: { label: '已退回', color: '#f5222d' },
    modified: { label: '已修改', color: '#faad14' },
};
exports.signinStatusDisplay = {
    pending: { label: '待签到', color: '#faad14' },
    confirmed: { label: '已签到', color: '#52c41a' },
    absent: { label: '缺席', color: '#f5222d' },
    leave: { label: '请假', color: '#fa8c16' },
    substituted: { label: '已更换', color: '#722ed1' },
};
//# sourceMappingURL=index.js.map